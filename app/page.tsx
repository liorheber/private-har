'use client';

import { useState, useEffect } from 'react';
import ViewerContainer from './components/ViewerContainer';
import Warning from './components/Warning';

interface LogEntry {
  timestamp: string;
  message: string;
  data?: any;
}

export default function Home() {
  const [harData, setHarData] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const featureCheckWorker = new Worker('/scrubber-worker.js');
    
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
    setHarData(null);
    setProgress(null);
    setLogs([]);

    try {
      const worker = new Worker('/scrubber-worker.js');
      
      worker.onmessage = (e) => {
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
        } else if (e.data.type === 'success') {
          setHarData(e.data.data);
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
      worker.postMessage({ type: 'processHar', harContent: text });
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">HAR Privacy Scrubber</h1>
          <p className="text-gray-600">
            Upload your HAR file to automatically scrub sensitive information
          </p>
        </div>

        <div className="text-center">
          <label className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
            {harData ? 'Upload Different File' : 'Choose HAR File'}
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

        {isProcessing && (
          <div className="text-center py-12">
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

        {harData && !isProcessing && (
          <ViewerContainer
            entries={harData.log.entries}
            logs={logs}
            totalSize={harData.log.entries.reduce((sum: number, entry: any) => sum + entry.response.content.size, 0)}
            totalTime={harData.log.entries.reduce((sum: number, entry: any) => sum + entry.time, 0)}
          />
        )}
      </div>
    </main>
  );
}
