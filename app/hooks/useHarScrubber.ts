import { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  message: string;
  data?: any;
}

interface Progress {
  current: number;
  total: number;
}

interface HarInfo {
  version: string;
  creator: any;
  browser: any;
  pages: any[];
}

export function useHarScrubber() {
  const [entries, setEntries] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [harInfo, setHarInfo] = useState<HarInfo | null>(null);

  useEffect(() => {
    const featureCheckWorker = new Worker(`/scrubber-worker.js?v=${Date.now()}`);
    
    featureCheckWorker.onmessage = (e) => {
      if (e.data.type === 'featureCheck' && !e.data.hasFeatures) {
        setWarning('This demo requires Chrome AI features which are not available in your environment.\n\n[Learn how to enable them](https://developer.chrome.com/docs/ai/built-in)');
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

  const downloadScrubbed = () => {
    if (entries.length === 0) return;
    
    // Create a clean HAR object without summary and schema
    const cleanEntries = entries.map(entry => {
      const { summary, schema, ...cleanEntry } = entry;
      return cleanEntry;
    });

    const cleanHar = {
      log: {
        version: harInfo?.version || '1.2',
        creator: harInfo?.creator || {},
        browser: harInfo?.browser || {},
        pages: harInfo?.pages || [],
        entries: cleanEntries
      }
    };

    const blob = new Blob([JSON.stringify(cleanHar, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scrubbed.har';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    entries,
    logs,
    isProcessing,
    error,
    progress,
    warning,
    harInfo,
    handleFileChange,
    setWarning,
    downloadScrubbed
  };
}
