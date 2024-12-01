'use client';

import { useState, useEffect, useRef } from 'react';

interface HarScrubberProps {
  harFile: File;
  onScrub: (scrubbedHar: string) => void;
  onEntryProcessed: (entry: any) => void;
}

interface HarEntry {
  startedDateTime: string;
  time: number;
  request: any;
  response: any;
  cache: any;
  timings: any;
  [key: string]: any;
}

function debugLog(message: string, data: any = null) {
  const logMessage = {
    component: 'HarScrubber',
    timestamp: new Date().toISOString(),
    message,
    data
  };
  console.log('[HarScrubber]', logMessage);
}

export default function HarScrubber({ harFile, onScrub, onEntryProcessed }: HarScrubberProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'reading' | 'scrubbing' | 'done'>('reading');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const entriesRef = useRef<HarEntry[]>([]);
  const harDataRef = useRef<any>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup worker on unmount
      if (workerRef.current) {
        debugLog('Terminating worker on cleanup');
        workerRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    const processHarFile = async () => {
      if (!harFile) return;

      try {
        debugLog('Starting HAR file processing', { fileName: harFile.name, fileSize: harFile.size });
        
        // Reset state
        setIsProcessing(true);
        setProgress(0);
        setError(null);
        setStage('reading');
        setProcessedCount(0);
        setTotalEntries(0);
        entriesRef.current = [];

        // Read the file
        debugLog('Reading file contents');
        const text = await harFile.text();
        const harData = JSON.parse(text);
        
        if (!harData.log?.entries) {
          throw new Error('Invalid HAR file format');
        }

        debugLog('File parsed successfully', { entriesCount: harData.log.entries.length });
        harDataRef.current = harData;
        setStage('scrubbing');

        // Create worker
        debugLog('Initializing Web Worker');
        if (workerRef.current) {
          workerRef.current.terminate();
        }
        workerRef.current = new Worker('/scrubber-worker.js');

        // Process with worker
        const worker = workerRef.current;
        worker.postMessage(JSON.stringify(harData));
        debugLog('Sent data to worker for processing');

        worker.onmessage = (e) => {
          const { type, ...data } = e.data;
          debugLog(`Received worker message: ${type}`, data);

          switch (type) {
            case 'init':
              setTotalEntries(data.totalEntries);
              debugLog('Initialized with total entries', { total: data.totalEntries });
              break;
            
            case 'entry':
              entriesRef.current[data.index] = data.entry;
              setProcessedCount(data.index + 1);
              onEntryProcessed(data.entry);
              debugLog('Processed entry', { index: data.index, totalProcessed: data.index + 1 });
              break;
            
            case 'progress':
              setProgress(data.progress);
              debugLog('Progress update', { 
                progress: data.progress,
                current: data.current,
                total: data.total 
              });
              break;
            
            case 'complete':
              debugLog('Processing complete', { totalProcessed: data.totalProcessed });
              // Create final HAR object
              const scrubbedHar = {
                log: {
                  ...harDataRef.current.log,
                  entries: entriesRef.current
                }
              };
              onScrub(JSON.stringify(scrubbedHar, null, 2));
              setStage('done');
              setProgress(100);
              setProcessedCount(data.totalProcessed);
              setIsProcessing(false);
              worker.terminate();
              workerRef.current = null;
              break;
            
            case 'error':
              debugLog('Worker error', { error: data.error });
              setError(data.error);
              console.error('Error scrubbing HAR file:', data.error);
              setIsProcessing(false);
              worker.terminate();
              workerRef.current = null;
              break;

            case 'log':
              // Forward worker logs to console
              console.log('[Worker -> Main]', data.log);
              break;
          }
        };

        worker.onerror = (e) => {
          debugLog('Worker error event', { error: e.message });
          setError(e.message);
          console.error('Worker error:', e);
          setIsProcessing(false);
          worker.terminate();
          workerRef.current = null;
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        debugLog('Error in processHarFile', { error: errorMessage });
        setError(errorMessage);
        console.error('Error processing HAR file:', err);
        setIsProcessing(false);
      }
    };

    processHarFile();
  }, [harFile, onScrub, onEntryProcessed]);

  if (!isProcessing && !error) return null;

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      {isProcessing && (
        <div className="text-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {stage === 'reading' && 'Reading file...'}
            {stage === 'scrubbing' && totalEntries > 0 && (
              <>
                Scrubbing data... {progress}%
                <br />
                <span className="text-xs text-gray-500">
                  Processed {processedCount} of {totalEntries} entries
                </span>
              </>
            )}
            {stage === 'done' && 'Processing complete!'}
          </p>
        </div>
      )}
      {error && (
        <div className="text-red-500 text-center mt-4">
          Error: {error}
        </div>
      )}
    </div>
  );
}
