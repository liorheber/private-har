// Constants for sensitive data patterns
const SENSITIVE_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  CREDIT_CARD: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
  SSN: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  API_KEY: /(api[_-]?key|token|secret)['\"]?\s*[:=]\s*['"]?[a-zA-Z0-9._\-]{20,}['"]?/gi,
  PASSWORD: /(password|passwd|pwd)['\"]?\s*[:=]\s*['"]?[^'\"\s]{6,}['"]?/gi,
  AUTH_HEADER: /(authorization|auth|bearer|api[_-]?key|token):\s*[a-zA-Z0-9._\-]+/gi,
};

// Sensitive field names to scrub
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'auth',
  'credentials',
  'key',
  'session',
  'cookie',
];

// Content types that should be scrubbed
const SENSITIVE_CONTENT_TYPES = [
  'application/json',
  'application/ld+json',
  'application/x-www-form-urlencoded',
  'text/html',
  'text/xml',
  'application/xml',
];

function isContentTypeSensitive(contentType) {
  if (!contentType) return false;
  const lowerContentType = contentType.toLowerCase();
  
  // Check if it's a sensitive content type
  if (SENSITIVE_CONTENT_TYPES.some(type => lowerContentType.includes(type))) {
    return true;
  }

  // Check if it's an API endpoint
  if (lowerContentType.includes('api') || lowerContentType.includes('graphql')) {
    return true;
  }

  return false;
}

// Worker log function
function workerLog(message, data = null) {
  self.postMessage({
    type: 'log',
    message,
    data
  });
}

// Scrub sensitive data from a string
function scrubSensitiveData(str, url) {
  if (typeof str !== 'string') return str;
  
  let scrubbedStr = str;
  Object.entries(SENSITIVE_PATTERNS).forEach(([patternName, pattern]) => {
    const matches = str.match(pattern);
    if (matches) {
      matches.forEach(match => {
        workerLog(`Scrubbing ${patternName} from ${url}`);
        scrubbedStr = scrubbedStr.replace(match, '[SCRUBBED]');
      });
    }
  });
  
  return scrubbedStr;
}

// Recursively process an object to scrub sensitive data
function processSensitiveData(obj, path = '', contentType = null, url = '') {
  if (!obj) return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item, index) => processSensitiveData(item, `${path}[${index}]`, contentType, url));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      // Check if the key is sensitive
      const lowerKey = key.toLowerCase();
      
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        workerLog(`Scrubbing ${key} field from ${url}`);
        result[key] = '[SCRUBBED]';
      } else if (key === 'content' && !isContentTypeSensitive(contentType)) {
        result[key] = value;
      } else if (typeof value === 'string') {
        result[key] = scrubSensitiveData(value, url);
      } else {
        result[key] = processSensitiveData(value, currentPath, contentType, url);
      }
    }
    
    return result;
  }

  // Handle strings
  if (typeof obj === 'string') {
    return scrubSensitiveData(obj, url);
  }

  return obj;
}

// Process HAR data
async function processHarData(harData) {
  try {
    workerLog('Starting HAR file processing');
    
    if (!harData.log || !harData.log.entries) {
      throw new Error('Invalid HAR file format');
    }

    const totalEntries = harData.log.entries.length;
    self.postMessage({ type: 'init', totalEntries });
    workerLog(`Found ${totalEntries} entries to process`);

    const processedEntries = [];
    for (let i = 0; i < harData.log.entries.length; i++) {
      const entry = harData.log.entries[i];
      
      // Process request
      if (entry.request) {
        workerLog(`Processing request: ${entry.request.url}`);
        entry.request = processSensitiveData(entry.request, 'request', null, entry.request.url);
      }
      
      // Process response
      if (entry.response) {
        const contentType = entry.response.content?.mimeType;
        workerLog(`Processing response with content type: ${contentType || 'unknown'}`);
        entry.response = processSensitiveData(entry.response, 'response', contentType);
      }

      processedEntries.push(entry);
      self.postMessage({ type: 'progress', current: i + 1, total: totalEntries });
    }

    workerLog('Completed HAR file processing');

    return {
      log: {
        version: harData.log.version,
        creator: harData.log.creator,
        browser: harData.log.browser,
        pages: harData.log.pages,
        entries: processedEntries
      }
    };
  } catch (error) {
    workerLog(`Error: ${error.message}`);
    throw error;
  }
}

// Handle messages from the main thread
self.onmessage = async function(e) {
  try {
    if (e.data.type === 'checkFeatures') {
      // Check for Chrome AI features
      const hasFeatures = 'ai' in self && 
        ('languageModel' in self.ai || 
         'summarizer' in self.ai || 
         'writer' in self.ai || 
         'rewriter' in self.ai);

      self.postMessage({
        type: 'featureCheck',
        hasFeatures,
        message: hasFeatures ? 
          'Advanced privacy features are available.' :
          'Advanced privacy features are not available in this environment. Basic privacy protection will be applied.'
      });
      return;
    }

    if (e.data.type === 'processHar' && e.data.harContent) {
      const harData = JSON.parse(e.data.harContent);
      const scrubbedData = await processHarData(harData);
      self.postMessage({ 
        type: 'success',
        data: scrubbedData
      });
    }
  } catch (error) {
    workerLog(`Error: ${error.message}`);
    self.postMessage({ 
      type: 'error',
      message: error.message
    });
  }
};
