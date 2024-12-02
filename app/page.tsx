'use client';

import { useState, useEffect } from 'react';
import ViewerContainer from './components/ViewerContainer';
import Warning from './components/Warning';
import Introduction from './components/Introduction';

interface LogEntry {
  timestamp: string;
  message: string;
  data?: any;
}

export default function Home() {
  const [entries, setEntries] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [harInfo, setHarInfo] = useState<any>(null);

  useEffect(() => {
    const featureCheckWorker = new Worker(`/scrubber-worker.js?v=${Date.now()}`);
    
    featureCheckWorker.onmessage = (e) => {
      if (e.data.type === 'featureCheck' && !e.data.hasFeatures) {
        setWarning(e.data.message);
      } else if (e.data.type === 'error') {
        setWarning('Error checking privacy features. Basic privacy protection will be applied.');
      }
    };

    featureCheckWorker.onerror = () => {
      setWarning('Error initializing privacy features. Basic privacy protection will be applied.');
    };

    featureCheckWorker.postMessage({ type: 'checkFeatures' });

    return () => featureCheckWorker.terminate();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setEntries([]);
    setProgress(null);
    setLogs([]);
    setHarInfo(null);

    try {
      const worker = new Worker(`/scrubber-worker.js?v=${Date.now()}`);
      
      worker.onmessage = (e) => {
        console.log('Worker message received:', e.data);
        
        if (e.data.type === 'init') {
          setProgress({ current: 0, total: e.data.totalEntries });
        } else if (e.data.type === 'progress') {
          setProgress({ current: e.data.current, total: e.data.total });
        } else if (e.data.type === 'log') {
          setLogs(prevLogs => [...prevLogs, {
            timestamp: new Date().toISOString(),
            message: e.data.message,
            data: e.data.data
          }]);
        } else if (e.data.type === 'entry') {
          // Add new entry as it arrives
          setEntries(prevEntries => {
            const newEntries = [...prevEntries];
            newEntries[e.data.index] = e.data.entry;
            return newEntries;
          });
        } else if (e.data.type === 'complete') {
          setIsProcessing(false);
          setProgress(null);
          worker.terminate();
        } else if (e.data.type === 'error') {
          setError(e.data.message);
          setIsProcessing(false);
          setProgress(null);
          worker.terminate();
        }
      };

      worker.onerror = (error) => {
        setError(error.message);
        setIsProcessing(false);
        setProgress(null);
        worker.terminate();
      };

      const text = await file.text();
      const harData = JSON.parse(text);
      setHarInfo({
        version: harData.log.version,
        creator: harData.log.creator,
        browser: harData.log.browser,
        pages: harData.log.pages
      });
      
      worker.postMessage({ 
        type: 'processHar',
        harContent: text
      });
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed top-6 right-6">
        <a 
          href="https://github.com/liorheber/private-har"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="View on GitHub"
        >
          <svg 
            viewBox="0 0 16 16" 
            className="w-8 h-8" 
            fill="currentColor" 
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
      </div>
      <main className="flex-1 pb-24">
        <div className="p-24">
          <div className="w-full max-w-5xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">HAR Privacy Scrubber</h1>
              <p className="text-gray-600">
                Upload your HAR file to automatically scrub sensitive information
              </p>
            </div>

            <div className="text-center">
              <label className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                {entries.length > 0 ? 'Upload Different File' : 'Choose HAR File'}
                <input
                  type="file"
                  accept=".har"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {warning && (
              <div className="flex justify-center">
                <Warning 
                  message={warning} 
                  onClose={() => setWarning(null)} 
                />
              </div>
            )}

            {!isProcessing && entries.length === 0 && (
              <Introduction />
            )}

            {isProcessing && (
              <div className="text-center py-8">
                {progress ? (
                  <div className="space-y-4">
                    <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-gray-600">
                      Processing entries: {progress.current} / {progress.total}
                    </p>
                  </div>
                ) : (
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
                )}
                <p className="mt-4 text-gray-600">Processing HAR file...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            )}

            {entries.length > 0 && !isProcessing && harInfo && (
              <ViewerContainer
                entries={entries}
                logs={logs}
                totalSize={entries.reduce((sum: number, entry: any) => sum + (entry?.response?.content?.size || 0), 0)}
                totalTime={entries.reduce((sum: number, entry: any) => sum + (entry?.time || 0), 0)}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t py-6 bg-white">
        <div className="text-center">
          <a 
            href="/sensitive-test" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline text-sm"
          >
            Open Test Page with Sensitive Data
          </a>
        </div>
      </footer>
    </div>
  );
}
