'use client';

import { ChangeEvent } from 'react';

interface HarUploaderProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  onReset: () => void;
}

export default function HarUploader({ onFileUpload, isProcessing, onReset }: HarUploaderProps) {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!(file.name.endsWith('.har') || file.name.endsWith('.json'))) {
      alert('Please upload a valid HAR (JSON) file');
      return;
    }

    // Reset the input value to allow the same file to be selected again
    event.target.value = '';
    onFileUpload(file);
  };

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <label 
        htmlFor="har-upload" 
        className={`block w-full text-center ${
          isProcessing ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-700'
        } text-white font-bold py-2 px-4 rounded cursor-pointer`}
      >
        {isProcessing ? 'Processing...' : 'Upload HAR File'}
        <input 
          id="har-upload"
          type="file" 
          accept=".har,.json"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
          onClick={(e) => {
            if (isProcessing) {
              e.preventDefault();
            }
          }}
        />
      </label>
      {!isProcessing && (
        <p className="text-sm text-gray-600 mt-2 text-center">
          Select a HAR file to scrub sensitive information
        </p>
      )}
    </div>
  );
}
