import { motion } from 'framer-motion';

interface FileUploadProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hasEntries: boolean;
}

export default function FileUpload({ onFileChange, hasEntries }: FileUploadProps) {
  return (
    <motion.div 
      className="text-center"
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
    </motion.div>
  );
}
