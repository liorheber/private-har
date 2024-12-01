'use client';

interface HarDownloaderProps {
  harData: string;
  fileName: string;
}

export default function HarDownloader({ harData, fileName }: HarDownloaderProps) {
  const handleDownload = () => {
    const blob = new Blob([harData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.har') ? fileName : `${fileName}.har`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8 text-center">
      <button
        onClick={handleDownload}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Download Scrubbed HAR
      </button>
      <p className="text-sm text-gray-600 mt-2">
        Your HAR file has been scrubbed and is ready for download
      </p>
    </div>
  );
}
