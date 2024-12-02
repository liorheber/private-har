import { motion } from 'framer-motion';

interface FileUploadProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hasEntries: boolean;
  onDownload?: () => void;
  isProcessing: boolean;
}

export default function FileUpload({ onFileChange, hasEntries, onDownload, isProcessing }: FileUploadProps) {
  return (
    <motion.div 
      className="text-center space-x-4 flex items-center justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: 0.6, 
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      <motion.label 
        className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg cursor-pointer transition-colors duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 40,
          mass: 0.5
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {hasEntries ? 'Upload Different File' : 'Choose HAR File'}
        <input
          type="file"
          accept=".har"
          onChange={onFileChange}
          className="hidden"
        />
      </motion.label>

      {hasEntries && onDownload && !isProcessing && (
        <motion.button
          onClick={onDownload}
          className="inline-flex items-center px-4 py-3 bg-green-500 text-white rounded-lg cursor-pointer transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 700,
            damping: 40,
            mass: 0.5
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="ml-2">Download</span>
        </motion.button>
      )}
    </motion.div>
  );
}
