'use client';

import ViewerContainer from './components/ViewerContainer';
import Warning from './components/Warning';
import Introduction from './components/Introduction';
import FileUpload from './components/FileUpload';
import ProgressIndicator from './components/ProgressIndicator';
import ErrorDisplay from './components/ErrorDisplay';
import GitHubButton from './components/GitHubButton';
import Footer from './components/Footer';
import Header from './components/Header';
import { useHarScrubber } from './hooks/useHarScrubber';

export default function Home() {
  const {
    entries,
    logs,
    isProcessing,
    error,
    progress,
    warning,
    handleFileChange,
    setWarning,
    downloadScrubbed
  } = useHarScrubber();

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed top-6 right-6">
        <GitHubButton />
      </div>
      
      <main className="flex-1 pb-24">
        <div className="p-24">
          <div className="w-full max-w-5xl mx-auto space-y-8">
            <Header />
            
            <FileUpload 
              onFileChange={handleFileChange} 
              hasEntries={entries.length > 0} 
              onDownload={downloadScrubbed}
              isProcessing={isProcessing}
            />

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
              <ProgressIndicator progress={progress} />
            )}

            {error && (
              <ErrorDisplay message={error} />
            )}

            {entries.length > 0 && !isProcessing && (
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
      <Footer />
    </div>
  );
}
