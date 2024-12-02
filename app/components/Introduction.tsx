export default function Introduction() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-500 mb-3">
          Private HAR Scrubbing with Local AI
        </h2>
        <p className="text-base text-gray-400 max-w-2xl mx-auto">
          Securely scrub sensitive data from your HAR files using Chrome&apos;s Local AI model,
          ensuring your data never leaves your machine.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <div className="bg-blue-50 rounded-full p-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-gray-600">Complete Privacy</h3>
              <p className="text-sm text-gray-500 mt-1">All processing happens locally on your machine, ensuring your sensitive data stays with you.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <div className="bg-green-50 rounded-full p-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-gray-600">Intelligent Scrubbing</h3>
              <p className="text-sm text-gray-500 mt-1">Uses AI to identify sensitive data beyond predefined patterns, providing smarter protection.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <div className="bg-purple-50 rounded-full p-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-gray-600">Enhanced Security</h3>
              <p className="text-sm text-gray-500 mt-1">No data transmission to external servers means zero risk of data interception.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start">
            <div className="bg-orange-50 rounded-full p-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-gray-600">Smart Detection</h3>
              <p className="text-sm text-gray-500 mt-1">Contextually understands what should be scrubbed for comprehensive protection.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
