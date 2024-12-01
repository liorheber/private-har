import { useState, useEffect, useCallback } from 'react';

export const useScrubber = () => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize worker
    if (typeof window !== 'undefined') {
      const w = new Worker(new URL('../workers/scrubber.worker.ts', import.meta.url));
      setWorker(w);

      return () => {
        w.terminate();
      };
    }
  }, []);

  const scrubHarFile = useCallback((harData: any): Promise<any> => {
    if (!worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    setIsProcessing(true);
    setError(null);

    return new Promise((resolve, reject) => {
      worker.onmessage = (e: MessageEvent) => {
        setIsProcessing(false);
        if (e.data.type === 'success') {
          resolve(e.data.data);
        } else {
          setError(e.data.error);
          reject(new Error(e.data.error));
        }
      };

      worker.onerror = (e: ErrorEvent) => {
        setIsProcessing(false);
        setError(e.message);
        reject(new Error(e.message));
      };

      worker.postMessage(JSON.stringify(harData));
    });
  }, [worker]);

  return {
    scrubHarFile,
    isProcessing,
    error
  };
};
