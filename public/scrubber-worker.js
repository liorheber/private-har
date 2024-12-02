// Check AI capabilities and ensure models are ready
async function checkAICapabilities() {
  try {
    const [languageCapabilities, summarizerCapabilities] = await Promise.all([
      ai.languageModel.capabilities(),
      ai.summarizer.capabilities()
    ]);
    
    // Check if either model is not supported
    if (languageCapabilities.available === "no" || summarizerCapabilities.available === "no") {
      workerLog("AI capabilities not fully supported on this device");
      return false;
    }
    
    // If either model needs downloading
    if (languageCapabilities.available === "after-download" || summarizerCapabilities.available === "after-download") {
      workerLog("AI models need to be downloaded first");
      
      // Start the downloads and monitor progress
      const [languageSession, summarizerSession] = await Promise.all([
        ai.languageModel.create({
          monitor(m) {
            m.addEventListener("downloadprogress", e => {
              const progress = Math.round((e.loaded / e.total) * 100);
              workerLog(`Downloading language model: ${progress}%`);
              postMessage({
                type: 'aiModelDownloadProgress',
                model: 'language',
                progress
              });
            });
          }
        }),
        ai.summarizer.create({
          monitor(m) {
            m.addEventListener("downloadprogress", e => {
              const progress = Math.round((e.loaded / e.total) * 100);
              workerLog(`Downloading summarizer model: ${progress}%`);
              postMessage({
                type: 'aiModelDownloadProgress',
                model: 'summarizer',
                progress
              });
            });
          }
        })
      ]);
      
      workerLog("AI models downloaded successfully");
      return true;
    }
    
    // Both models are readily available
    if (languageCapabilities.available === "readily" && summarizerCapabilities.available === "readily") {
      workerLog("AI capabilities ready");
      return true;
    }
    
    return false;
  } catch (error) {
    workerLog("Error checking AI capabilities:", error);
    return false;
  }
}

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

// Content types that can be summarized
const SUMMARIZABLE_CONTENT_TYPES = [
  'application/json',
  'application/ld+json',
  'text/json',
  'application/problem+json'
];

// Maximum size in bytes for content to be summarized (3000 tokens * 4 bytes per token)
const MAX_SUMMARIZABLE_SIZE = 3000 * 4;

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

// Check if content type is JSON-like and can be summarized
function isSummarizableContentType(contentType) {
  if (!contentType) return false;
  const lowerContentType = contentType.toLowerCase();
  return SUMMARIZABLE_CONTENT_TYPES.some(type => lowerContentType.includes(type));
}

// Check if content is too large to summarize
function isContentTooLarge(content) {
  if (!content) return false;
  // Use TextEncoder to get accurate byte length of UTF-8 string
  return new TextEncoder().encode(content).length > MAX_SUMMARIZABLE_SIZE;
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
  
  if (!isApiCall(entry)) {
    workerLog(`Skipping non-API call: ${entry.request.url}`);
    return entry;
  }

  // Check if response content type is summarizable
  const contentType = entry.response.content?.mimeType;
  if (!isSummarizableContentType(contentType)) {
    workerLog(`Skipping non-JSON content type: ${contentType}`);
    return entry;
  }
  
  workerLog(`Summarizing API call: ${entry.request.url}`);
  
  try {
    // Build base context that will be included in all requests
    const baseContext = `<method>${entry.request.method}</method>
    <url>${entry.request.url}</url>`;
    
    let requestContent = '';
    let responseContent = '';
    let finalSummary = '';
    
    // Process request body if present
    if (entry.request.postData?.text) {
      try {
        const jsonData = JSON.parse(entry.request.postData.text);
        requestContent = `<requestBody>${JSON.stringify(jsonData, null, 2)}</requestBody>`;
      } catch {
        requestContent = `<requestBody>${entry.request.postData.text}</requestBody>`;
      }
    }
    
    // Process response body
    if (entry.response.content?.text) {
      try {
        const jsonData = JSON.parse(entry.response.content.text);
        responseContent = `<responseBody>${JSON.stringify(jsonData, null, 2)}</responseBody>`;
      } catch {
        responseContent = `<responseBody>${entry.response.content.text}</responseBody>`;
      }
    }

    // Create summarizer with shared context
    const summarizer = await self.ai.summarizer.create({
      sharedContext: `
      <goal>Summarize the API call attached under the <request> tag.</goal>
      <rules>
        <rule>Based on the API path and method, try to derive the purpose of the request.</rule>
        <rule>Based on the request body, try to derive the parameters of the request.</rule>
        <rule>Based on the response body, try to derive the result of the request.</rule>
      </rules>
      `,
    });

    const fullContent = `${baseContext}\n${requestContent}\n${responseContent}`;
    
    // Check if full content is small enough to process at once
    if (!isContentTooLarge(fullContent)) {
      const summary = await summarizer.summarize(fullContent);
      finalSummary = summary;
    } else {
      // Split processing based on content size
      let summaries = [];
      
      // Process request if present and not too large
      if (requestContent && !isContentTooLarge(requestContent)) {
        const requestOnlyContent = `<notification>this is a partial request, summarize only based on the content you have</notification>\n${baseContext}\n${requestContent}`;
        const requestSummary = await summarizer.summarize(requestOnlyContent);
        summaries.push(requestSummary);
      } else if (requestContent) {
        summaries.push('Request body was too large to process');
      }
      
      // Process response if present and not too large
      if (responseContent && !isContentTooLarge(responseContent)) {
        const responseOnlyContent = `<notification>this is a partial request, summarize only based on the content you have</notification>\n${baseContext}\n${responseContent}`;
        const responseSummary = await summarizer.summarize(responseOnlyContent);
        summaries.push(responseSummary);
      } else if (responseContent) {
        summaries.push('Response body was too large to process');
      }
      
      // Combine summaries
      finalSummary = summaries.join('\n');
    }
    
    // Add summary to entry
    entry.summary = finalSummary;
    return entry;
    
  } catch (error) {
    workerLog('Error summarizing entry:', error);
    entry.summary = 'Error generating summary';
    return entry;
  }
}

// Queue for smart scrubbing tasks
let scrubQueue = [];
let scrubQueuePromise = null;

// Process the scrub queue in batches
async function processScrubQueue() {
  if (scrubQueuePromise) return scrubQueuePromise;
  
  scrubQueuePromise = (async () => {
    while (scrubQueue.length > 0) {
      const batch = scrubQueue.splice(0, 4);
      await Promise.all(batch.map(async ({ entry, resolve, reject }) => {
        try {
          const result = await processSmartScrub(entry);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }));
    }
    scrubQueuePromise = null;
  })();
  
  return scrubQueuePromise;
}

// Process a single entry for smart scrubbing
async function processSmartScrub(entry) {
  try {
    // Only process JSON responses
    const contentType = entry.response.content.mimeType;
    if (!isSummarizableContentType(contentType)) {
      workerLog(`Skipping non-JSON content type: ${contentType} for ${entry.request.url}`);
      return entry;
    }

    // Ensure we have response body text
    const responseBody = entry.response.content.text;
    if (!responseBody) {
      workerLog(`Skipping empty response body for ${entry.request.url}`);
      return entry;
    }

    // Parse the JSON response
    const jsonData = JSON.parse(responseBody);
    workerLog(`Processing JSON response for ${entry.request.url}`);
    
    // Generate schema for the JSON data
    const schema = generateJsonSchema(jsonData);
    workerLog(`Generated schema for ${entry.request.url}: ${JSON.stringify(schema)}`);
    
    // Identify sensitive fields using AI
    const sensitiveKeys = await identifySensitiveFields(schema, true);
    workerLog(`AI identified sensitive keys for ${entry.request.url}: ${sensitiveKeys.join(', ')}`);
    
    if (!sensitiveKeys || sensitiveKeys.length === 0) {
      workerLog(`No sensitive fields identified for ${entry.request.url}`);
      return entry;
    }
    
    // Create a deep copy of the entry to modify
    const scrubbedEntry = JSON.parse(JSON.stringify(entry));
    
    // Update the response content with scrubbed data
    const scrubbedData = JSON.parse(JSON.stringify(jsonData));
    
    // Function to recursively scrub objects
    function scrubObject(obj) {
      if (!obj || typeof obj !== 'object') return;
      
      for (const key in obj) {
        const value = obj[key];
        const keyLower = key.toLowerCase();
        
        // Check if this key matches any of our sensitive keys
        if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive.toLowerCase()))) {
          if (typeof value === 'string') {
            obj[key] = '[SCRUBBED]';
            workerLog(`Using Smart Scrub on ${key} (string) for request ${entry.request.url}`);
          } else if (typeof value === 'number') {
            obj[key] = 0;
            workerLog(`Using Smart Scrub on ${key} (number) for request ${entry.request.url}`);
          } else if (Array.isArray(value)) {
            obj[key] = [];
            workerLog(`Using Smart Scrub on ${key} (array) for request ${entry.request.url}`);
          } else if (typeof value === 'object') {
            obj[key] = {};
            workerLog(`Using Smart Scrub on ${key} (object) for request ${entry.request.url}`);
          }
        } else if (typeof value === 'object') {
          // Recursively check nested objects and arrays
          scrubObject(value);
        }
      }
    }
    
    // Scrub the data recursively
    scrubObject(scrubbedData);
    
    // Update the entry with scrubbed data
    scrubbedEntry.response.content.text = JSON.stringify(scrubbedData);
    
    return scrubbedEntry;
  } catch (error) {
    console.warn('Smart scrubbing failed', error);
    workerLog(`Smart scrubbing failed for ${entry.request.url}: ${error.message}`);
    return entry;
  }
}

// Identify sensitive fields in a schema that should be scrubbed
async function identifySensitiveFields(schema, hasAI) {
  if (!hasAI) {
    workerLog('AI not available, falling back to default sensitive fields');
    return defaultSensitiveFields;
  }

  try {
    // Flatten the schema and get unique field names
    const flattenedFields = flattenSchema(schema);
    const fieldNames = getFieldNames(flattenedFields);
    workerLog(`Flattened schema fields: ${fieldNames.join(',')}`);

    workerLog('Creating AI session for sensitive field identification');
    const session = await self.ai.languageModel.create({
      systemPrompt: `
      You are a privacy and security expert focused on protecting sensitive information while preserving necessary application functionality.
      Your task is to identify fields that contain truly sensitive information while maintaining the utility of non-sensitive data.

      IMPORTANT DISTINCTION - Object Names vs Content:
      - Do not mark container objects as sensitive (e.g., "user", "profile", "account")
      - Instead, examine the actual fields within these objects
      - Example: In {"user": {"name": "John", "id": "123"}}, mark "name" as sensitive, not "user"

      Definitely Sensitive Information (MARK THE SPECIFIC FIELDS ONLY):
      1. Personal Identifiable Information:
         - Full names of individuals (name, firstName, lastName)
         - Contact details (email, phone, address)
         - Government IDs (ssn, passport, driverLicense)
         - Date of birth, age
         - Personal characteristics (gender, ethnicity)

      2. Financial Information:
         - Credit card details (number, cvv, expiry)
         - Bank account details (accountNumber, routingNumber)
         - Financial credentials
         - Payment tokens

      3. Medical/Health Information:
         - Medical record numbers
         - Health conditions
         - Insurance details
         - Treatment information
         - Prescription data

      4. Authentication/Security:
         - Passwords and hashes
         - Private keys and secrets
         - Authentication tokens
         - Security credentials
         - Session identifiers

      Container Objects (NEVER MARK THESE, CHECK THEIR CONTENTS INSTEAD):
      - user, profile, account, customer
      - payment, billing, financial
      - medical, health, insurance
      - authentication, security, session
      - preferences, settings, config
      - metrics, analytics, stats

      Definitely NOT Sensitive:
      1. Application Metadata:
         - status, state
         - version numbers
         - environment names
         - feature flags
         - build numbers

      2. Public Configuration:
         - language settings
         - theme preferences
         - time zones
         - UI settings
         - display options

      3. Generic Metrics:
         - counts and totals
         - timestamps
         - status codes
         - response times
         - resource usage

      4. Technical Identifiers:
         - request IDs
         - transaction IDs
         - correlation IDs
         - generic UUIDs
         - public endpoints

      5. Public Business Data:
         - product names
         - category names
         - feature lists
         - plan names
         - service status

      Key Principles:
      1. Focus on the actual data fields, not the container objects
      2. Technical metadata about the application is not sensitive
      3. Public business information is not sensitive
      4. Generic identifiers without context are not sensitive
      5. System metrics and performance data are not sensitive

      Examples:
      For this object:
      {
        "user": {                    // Don't mark "user"
          "name": "John",            // Mark this
          "email": "test@test.com",  // Mark this
          "preferences": {           // Don't mark "preferences"
            "theme": "dark",         // Don't mark this
            "language": "en"         // Don't mark this
          }
        }
      }

      From the list of fields I provide, identify ONLY those that contain truly sensitive information.
      Use exactly the same field names I provide, separated by commas.

      DO NOT add any explanation or additional text.
      DO NOT add any fields that weren't in my list.
      DO NOT mark container object names as sensitive.
      DO NOT mark technical or public business information as sensitive.
      `,
    });

    const schemaPrompt = `From these field names, list only the ones that are DEFINITELY sensitive:
    ${fieldNames.join(',')}`;

    workerLog('Sending field names to AI for analysis');
    const result = await session.prompt(schemaPrompt);
    workerLog(`Raw AI response: ${result}`);
    
    // Split the comma-separated response and clean it up
    const sensitiveKeys = result
      .split(',')
      .map(key => key.trim().toLowerCase())
      .filter(key => key.length > 0 && fieldNames.some(field => field.toLowerCase() === key));
    
    if (sensitiveKeys.length > 0) {
      workerLog(`AI successfully identified ${sensitiveKeys.length} sensitive keys: ${sensitiveKeys.join(', ')}`);
      return sensitiveKeys;
    }
    
    workerLog('No valid keys found in AI response, falling back to defaults');
    return defaultSensitiveFields;
    
  } catch (error) {
    workerLog(`AI processing failed: ${error.message}`);
    workerLog('Stack trace:', error.stack);
    workerLog('Falling back to default sensitive fields');
    return defaultSensitiveFields;
  }
}

// Flatten a JSON schema into a list of field names
function flattenSchema(schema, prefix = '') {
  const fields = new Set();
  
  if (!schema || typeof schema !== 'object') return fields;
  
  // Add the current field name if we have a prefix
  if (prefix) {
    fields.add(prefix);
  }
  
  // If this is an object with properties, process each property
  if (schema.type === 'object' && schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      const nestedFields = flattenSchema(value, newPrefix);
      nestedFields.forEach(field => fields.add(field));
    }
  }
  
  // If this is an array with items, process the items schema
  if (schema.type === 'array' && schema.items) {
    const nestedFields = flattenSchema(schema.items, prefix);
    nestedFields.forEach(field => fields.add(field));
  }
  
  return fields;
}

// Extract just the field names from a dot-notation path
function getFieldNames(fields) {
  const names = new Set();
  for (const field of fields) {
    // Split on dots and add each part
    field.split('.').forEach(part => names.add(part));
  }
  return Array.from(names);
}

// Smart scrub entry using AI features if available
async function smartScrubEntry(entry, hasAI) {
  if (!hasAI) return entry;

  return new Promise((resolve, reject) => {
    scrubQueue.push({ entry, resolve, reject });
    processScrubQueue().catch(reject);
  });
}

// Process a single entry through the pipeline
async function processEntryThroughPipeline(entry, hasAI, index, totalEntries) {
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

// Process HAR data
async function processHarData(harData) {
  try {
    // Check AI capabilities before processing
    const hasAI = await checkAICapabilities();
    
    workerLog(`Starting HAR processing with${hasAI ? '' : 'out'} AI capabilities`);
    
    if (!harData.log || !harData.log.entries) {
      throw new Error('Invalid HAR file format');
    }

    const totalEntries = harData.log.entries.length;
    self.postMessage({ type: 'init', totalEntries });
    workerLog(`Found ${totalEntries} entries to process`);

    const CONCURRENT_LIMIT = 4;
    const entries = [...harData.log.entries];
    const results = new Array(totalEntries);
    let currentIndex = 0;
    let completedCount = 0;

    // Process entries in batches of CONCURRENT_LIMIT
    async function processNextBatch() {
      const batch = [];
      
      while (batch.length < CONCURRENT_LIMIT && currentIndex < totalEntries) {
        const entryIndex = currentIndex;
        batch.push(
          processEntryThroughPipeline(entries[entryIndex], hasAI, entryIndex, totalEntries)
            .then(result => {
              results[entryIndex] = result;
              completedCount++;
              
              // Send the processed entry
              self.postMessage({ 
                type: 'entry',
                entry: result,
                index: entryIndex,
                total: totalEntries
              });

              // Send progress update based on actual completion count
              self.postMessage({ 
                type: 'progress', 
                current: completedCount, 
                total: totalEntries 
              });

              // If there are more entries to process, add them to the queue
              if (currentIndex < totalEntries) {
                return processNextBatch();
              }
            })
        );
        currentIndex++;
      }

      if (batch.length > 0) {
        await Promise.all(batch);
      }
    }

    // Start initial batch processing
    await processNextBatch();

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

// Generate JSON schema from a JSON object
function generateJsonSchema(obj) {
  if (obj === null) return { type: 'null' };
  
  if (Array.isArray(obj)) {
    // For arrays, analyze all items to create a unified schema
    if (obj.length === 0) return { type: 'array', items: {} };
    
    // First, generate schemas for all items
    const itemSchemas = obj.map(item => generateJsonSchema(item));
    
    // Then merge all properties from all items
    const mergedSchema = itemSchemas.reduce((acc, schema) => {
      if (schema.type === 'object' && schema.properties) {
        // For each property in the current schema
        Object.entries(schema.properties).forEach(([key, value]) => {
          if (!acc.properties[key]) {
            // If property doesn't exist in accumulator, add it
            acc.properties[key] = value;
          } else {
            // If property exists, merge its type information
            const existingType = acc.properties[key].type;
            const newType = value.type;
            if (existingType !== newType) {
              // If types differ, make it a union type
              acc.properties[key].type = Array.isArray(existingType) 
                ? [...new Set([...existingType, newType])]
                : [existingType, newType];
            }
            // Merge formats if they exist
            if (value.format && !acc.properties[key].format) {
              acc.properties[key].format = value.format;
            }
          }
        });
      }
      return acc;
    }, { type: 'object', properties: {} });
    
    return {
      type: 'array',
      items: mergedSchema
    };
  }
  
  const type = typeof obj;
  
  switch (type) {
    case 'object':
      const properties = {};
      for (const [key, value] of Object.entries(obj)) {
        properties[key] = generateJsonSchema(value);
      }
      return {
        type: 'object',
        properties
      };
      
    case 'string':
      // Try to identify string formats
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
        return { type: 'string', format: 'date-time' };
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(obj)) {
        return { type: 'string', format: 'date' };
      }
      if (/^[^@]+@[^@]+\.[^@]+$/.test(obj)) {
        return { type: 'string', format: 'email' };
      }
      if (/^(https?:\/\/)/.test(obj)) {
        return { type: 'string', format: 'uri' };
      }
      return { type: 'string' };
      
    case 'number':
      // Identify number format (integer vs float)
      return Number.isInteger(obj) ? { type: 'integer' } : { type: 'number' };
      
    case 'boolean':
      return { type: 'boolean' };
      
    default:
      return { type: 'unknown' };
  }
}

// Default list of sensitive fields to scrub when AI is not available
const defaultSensitiveFields = [
  "name",
  "email",
  "phone",
  "phoneNumber",
  "password",
  "token",
  "apiKey",
  "secret",
  "accessToken",
  "refreshToken",
  "authorization",
  "auth",
  "key",
  "ssn",
  "socialSecurity",
  "creditCard",
  "cardNumber",
  "cvv",
  "address",
  "location",
  "gps",
  "coordinates",
  "latitude",
  "longitude",
  "ip",
  "ipAddress",
  "personalId",
  "userId",
  "username",
  "sessionId",
  "deviceId",
  "fingerprint",
  "biometric",
  "dob",
  "birthDate",
  "birthDay",
  "age",
  "gender",
  "race",
  "ethnicity",
  "nationality",
  "passport",
  "license",
  "account",
  "accountNumber",
  "routing",
  "routingNumber",
  "iban",
  "swift",
  "privateKey",
  "certificate",
  "signature"
];

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
