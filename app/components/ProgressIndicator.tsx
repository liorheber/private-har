interface ProgressIndicatorProps {
  progress: { current: number; total: number } | null;
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  return (
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
  );
}
