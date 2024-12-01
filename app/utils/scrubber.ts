export const scrubSensitiveData = (data: any): any => {
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

export const scrubHarFile = (harData: any) => {
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
