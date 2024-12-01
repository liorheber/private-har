const scrubSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;

  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 
    'email', 'username', 'phone', 'credit_card'
  ];

  const scrubbedData = Array.isArray(data) 
    ? data.map(item => scrubSensitiveData(item))
    : Object.keys(data).reduce((acc, key) => {
        const lowerKey = key.toLowerCase();
        
        const isSensitive = sensitiveKeys.some(sensitiveKey => 
          lowerKey.includes(sensitiveKey)
        );

        acc[key] = isSensitive 
          ? '[SCRUBBED]' 
          : scrubSensitiveData(data[key]);
        
        return acc;
      }, {} as any);

  return scrubbedData;
};

const scrubHarFile = (harData: any) => {
  // Deep clone to avoid mutating original data
  const scrubbedHarData = JSON.parse(JSON.stringify(harData));

  // Scrub sensitive information
  if (scrubbedHarData.log && scrubbedHarData.log.entries) {
    scrubbedHarData.log.entries.forEach((entry: any) => {
      // Scrub URL query parameters
      if (entry.request && entry.request.url) {
        const url = new URL(entry.request.url);
        url.search = ''; // Remove query parameters
        entry.request.url = url.toString();
      }

      // Scrub request headers
      if (entry.request && entry.request.headers) {
        entry.request.headers = entry.request.headers.map((header: any) => {
          // Remove sensitive headers
          const sensitiveHeaders = [
            'authorization', 
            'cookie', 
            'set-cookie', 
            'x-api-key'
          ];
          
          if (sensitiveHeaders.includes(header.name.toLowerCase())) {
            return { ...header, value: '[SCRUBBED]' };
          }
          return header;
        });
      }

      // Scrub request postData
      if (entry.request && entry.request.postData) {
        // Check if postData contains JSON
        try {
          const parsedPostData = JSON.parse(entry.request.postData.text);
          // Recursively scrub sensitive fields
          const scrubbedPostData = scrubSensitiveData(parsedPostData);
          entry.request.postData.text = JSON.stringify(scrubbedPostData);
        } catch {
          // If not JSON, just replace with placeholder
          entry.request.postData.text = '[SCRUBBED]';
        }
      }

      // Scrub response data if it contains sensitive information
      if (entry.response && entry.response.content && entry.response.content.text) {
        try {
          const parsedContent = JSON.parse(entry.response.content.text);
          const scrubbedContent = scrubSensitiveData(parsedContent);
          entry.response.content.text = JSON.stringify(scrubbedContent);
        } catch {
          // Not JSON, leave as is
        }
      }
    });
  }

  return scrubbedHarData;
};

/**
 * Checks if Chrome AI features are available in the worker context
 * @returns {Promise<boolean>} True if Chrome AI features are available
 */
const checkChromeAIFeatures = async (): Promise<boolean> => {
  try {
    // Check for Prompt API
    const hasPromptAPI = 'ai' in self && 'languageModel' in (self as any).ai;
    
    // Check for Writing Assistance APIs
    const hasWritingAPI = 'ai' in self && 
      ('summarizer' in (self as any).ai || 
       'writer' in (self as any).ai || 
       'rewriter' in (self as any).ai);

    return hasPromptAPI || hasWritingAPI;
  } catch (error) {
    console.warn('Error checking Chrome AI features in worker:', error);
    return false;
  }
};

self.addEventListener('message', async (e: MessageEvent) => {
  // Handle feature check request
  if (e.data.type === 'checkFeatures') {
    try {
      const hasFeatures = await checkChromeAIFeatures();
      // Always send a response, whether features are available or not
      self.postMessage({
        type: 'featureCheck',
        hasFeatures,
        message: hasFeatures ? 
          'Advanced privacy features are available.' :
          'Advanced privacy features are not available in this environment. Basic privacy protection will be applied.'
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error checking features'
      });
    }
    return;
  }

  // Handle HAR processing request
  if (e.data.type === 'processHar' && e.data.harContent) {
    try {
      const harData = JSON.parse(e.data.harContent);
      const scrubbedData = scrubHarFile(harData);
      
      self.postMessage({
        type: 'success',
        data: scrubbedData
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    return;
  }
});
