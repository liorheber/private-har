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

// Check if an entry is an API call that should be summarized
function isApiCall(entry) {
  const { request, response } = entry;
  
  // Non-GET methods are likely API calls
  if (request.method !== 'GET') {
    return true;
  }
  
  // Check response content type
  const contentType = response?.content?.mimeType?.toLowerCase() || '';
  
  // Skip static assets
  const staticAssetPatterns = [
    'text/css',
    'text/javascript',
    'application/javascript',
    'image/',
    'font/',
    'audio/',
    'video/',
    'text/html',
    '.css',
    '.js',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot'
  ];
  
  if (staticAssetPatterns.some(pattern => 
    contentType.includes(pattern) || request.url.toLowerCase().includes(pattern)
  )) {
    return false;
  }
  
  // Look for API indicators in URL
  const apiUrlPatterns = [
    '/api/',
    '/graphql',
    '/v1/',
    '/v2/',
    '/rest/',
    'service',
    '/data/',
    '.json'
  ];
  
  const url = request.url.toLowerCase();
  if (apiUrlPatterns.some(pattern => url.includes(pattern))) {
    return true;
  }
  
  // Check if response is JSON
  if (contentType.includes('application/json')) {
    return true;
  }
  
  // Check if request accepts JSON
  const acceptsJson = request.headers.some(header => 
    header.name.toLowerCase() === 'accept' && 
    header.value.toLowerCase().includes('application/json')
  );
  
  if (acceptsJson) {
    return true;
  }
  
  return false;
}

// Add summary to an entry
async function summarizeEntry(entry, hasAI) {
  if (!hasAI) return entry;
  
  // Only summarize API calls
  if (!isApiCall(entry)) {
    workerLog(`Skipping non-API call: ${entry.request.url}`);
    return entry;
  }
  
  workerLog(`Summarizing API call: ${entry.request.url}`);
  
  try {
    // Build context for summarization
    let content = `${entry.request.method} request to ${entry.request.url}`;
    
    // Include request body if present
    if (entry.request.postData?.text) {
      try {
        const jsonData = JSON.parse(entry.request.postData.text);
        content += `\nRequest body: ${JSON.stringify(jsonData, null, 2)}`;
      } catch {
        content += `\nRequest body: ${entry.request.postData.text}`;
      }
    }
    
    // Include response body
    if (entry.response.content?.text) {
      try {
        const jsonData = JSON.parse(entry.response.content.text);
        content += `\nResponse body: ${JSON.stringify(jsonData, null, 2)}`;
      } catch {
        content += `\nResponse body: ${entry.response.content.text}`;
      }
    }
    
    workerLog('Content for summarization:', content);
    
    // Create summarizer with shared context
    const summarizer = await self.ai.summarizer.create({
      sharedContext: "JSON API request from HAR file",
      type: "headline",
      length: "short"
    });
    
    // Generate summary with specific context
    const summary = await summarizer.summarize(content, {
      context: `HTTP ${entry.request.method} API call made at ${entry.startedDateTime} with ${entry.response.status} response status`
    });
    
    entry.summary = summary.trim();
    workerLog(`Generated summary for API call: ${entry.summary}`);
  } catch (error) {
    workerLog(`Error generating summary: ${error.toString()}`);
    workerLog('Error details:', error);
    entry.summary = `Failed to generate summary: ${error.message}`;
  }
  
  return entry;
}

// Smart scrub entry using AI features if available
async function smartScrubEntry(entry, hasAI) {
  if (!hasAI) return entry;
  
  workerLog(`Smart scrubbing entry: ${entry.request.url}`);
  // TODO: Implement AI-powered smart scrubbing
  return entry;
}

// Process a single entry through the pipeline
async function processEntryThroughPipeline(entry, hasAI) {
  workerLog(`Starting pipeline for ${entry.request.url} with AI: ${hasAI}`);
  
  // Step 1: Summarize
  entry = await summarizeEntry(entry, hasAI);
  
  // Step 2: Smart scrub
  entry = await smartScrubEntry(entry, hasAI);
  
  // Step 3: Basic scrub
  if (entry.request) {
    entry.request = processSensitiveData(entry.request, 'request', null, entry.request.url);
  }
  
  if (entry.response) {
    const contentType = entry.response.content?.mimeType;
    entry.response = processSensitiveData(entry.response, 'response', contentType);
  }
  
  return entry;
}

// Check if content should be scrubbed
function shouldScrubContent(entry) {
  const { request, response } = entry;
  const contentType = response?.content?.mimeType?.toLowerCase() || '';
  
  // Static assets that should not be scrubbed
  const preserveContentTypes = [
    'text/css',
    'text/javascript',
    'application/javascript',
    'image/',
    'font/',
    'audio/',
    'video/',
    '.css',
    '.js',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot'
  ];
  
  // Don't scrub if it's a static asset
  if (preserveContentTypes.some(pattern => 
    contentType.includes(pattern) || request.url.toLowerCase().includes(pattern)
  )) {
    return false;
  }
  
  // Scrub HTML and API responses
  return contentType.includes('text/html') || isApiCall(entry);
}

// Basic scrub of an entry
function basicScrubEntry(entry) {
  try {
    // Deep clone to avoid modifying original
    entry = JSON.parse(JSON.stringify(entry));
    
    // Always scrub cookies and auth headers
    entry.request.cookies = [];
    entry.response.cookies = [];
    
    entry.request.headers = entry.request.headers.filter(header => {
      const name = header.name.toLowerCase();
      return !name.includes('cookie') && 
             !name.includes('auth') && 
             !name.includes('token') &&
             !name.includes('key');
    });
    
    entry.response.headers = entry.response.headers.filter(header => {
      const name = header.name.toLowerCase();
      return !name.includes('cookie') && 
             !name.includes('auth') && 
             !name.includes('token') &&
             !name.includes('key');
    });

    // Only scrub content if needed
    if (shouldScrubContent(entry)) {
      // Scrub request content
      if (entry.request.postData?.text) {
        try {
          const postData = JSON.parse(entry.request.postData.text);
          entry.request.postData.text = JSON.stringify(scrubObject(postData));
        } catch {
          // If not JSON, apply basic scrubbing patterns
          entry.request.postData.text = scrubText(entry.request.postData.text);
        }
      }
      
      // Scrub response content
      if (entry.response.content?.text) {
        const contentType = entry.response.content.mimeType?.toLowerCase() || '';
        
        if (contentType.includes('application/json')) {
          try {
            const content = JSON.parse(entry.response.content.text);
            entry.response.content.text = JSON.stringify(scrubObject(content));
          } catch {
            entry.response.content.text = scrubText(entry.response.content.text);
          }
        } else if (contentType.includes('text/html')) {
          entry.response.content.text = scrubText(entry.response.content.text);
        }
      }
    } else {
      workerLog(`Preserving content for non-scrubbed type: ${entry.request.url}`);
    }
    
    return entry;
  } catch (error) {
    workerLog('Error in basicScrubEntry:', error);
    return entry;
  }
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

    // Check for AI features
    const hasAI = 'ai' in self && 'summarizer' in self.ai;
    workerLog(`AI features available: ${hasAI}`);

    // Process entries one by one and send updates
    for (let i = 0; i < harData.log.entries.length; i++) {
      let entry = harData.log.entries[i];
      
      // Process through pipeline
      entry = await processEntryThroughPipeline(entry, hasAI);
      
      // Send the processed entry immediately
      self.postMessage({ 
        type: 'entry',
        entry,
        index: i,
        total: totalEntries
      });
      
      // Also send progress update
      self.postMessage({ 
        type: 'progress', 
        current: i + 1, 
        total: totalEntries 
      });
    }

    // Send completion message
    self.postMessage({ 
      type: 'complete',
      message: 'All entries processed'
    });
    
    workerLog('Completed HAR file processing');

  } catch (error) {
    workerLog(`Error: ${error.message}`);
    self.postMessage({ 
      type: 'error',
      message: error.message
    });
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
