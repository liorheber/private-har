/**
 * Checks if the browser supports Chrome's AI features
 * @returns {Promise<boolean>} True if Chrome AI features are available
 */
export async function checkChromeAIFeatures(): Promise<boolean> {
  // Check if the browser is Chrome
  const isChrome = navigator.userAgent.indexOf("Chrome") > -1;
  if (!isChrome) {
    return false;
  }

  // Check if the AI features are available
  try {
    // Check for Prompt API
    const hasPromptAPI = 'ai' in window && 'languageModel' in (window as any).ai;
    
    // Check for Writing Assistance APIs
    const hasWritingAPI = 'ai' in window && 
      ('summarizer' in (window as any).ai || 
       'writer' in (window as any).ai || 
       'rewriter' in (window as any).ai);

    // Return true if either API is available
    return hasPromptAPI || hasWritingAPI;
  } catch (error) {
    console.warn('Error checking Chrome AI features:', error);
    return false;
  }
}

/**
 * Shows a notification warning about feature availability
 * @param message Custom warning message to display
 */
export function showChromeAIWarning(message: string = 'Some smart privacy features are not available in this environment.') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg max-w-md';
  notification.innerHTML = `
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <p class="text-sm">
          ${message}
        </p>
      </div>
      <div class="pl-3">
        <button class="text-yellow-700 hover:text-yellow-900" onclick="this.parentElement.parentElement.parentElement.remove()">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  `;

  // Add to document
  document.body.appendChild(notification);

  // Remove after 10 seconds
  setTimeout(() => {
    notification.remove();
  }, 10000);
}
