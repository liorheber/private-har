interface FileUploadProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hasEntries: boolean;
}

export default function FileUpload({ onFileChange, hasEntries }: FileUploadProps) {
  return (
    <div className="text-center">
      <label className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
        {hasEntries ? 'Upload Different File' : 'Choose HAR File'}
        <input
          type="file"
          accept=".har"
          onChange={onFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
}
