'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface WarningProps {
  message: string;
  onClose: () => void;
}

export default function Warning({ message, onClose }: WarningProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          delay: 1,
          duration: 0.4,
          ease: "easeOut"
        }}
      >
        <motion.div 
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-lg"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ 
            delay: 1.2,
            duration: 0.3,
            ease: "easeOut"
          }}
        >
          <div className="flex items-start">
            <motion.div 
              className="flex-shrink-0"
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ 
                delay: 1.3,
                duration: 0.4,
                ease: "easeOut"
              }}
            >
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </motion.div>
            <div className="ml-3 flex-1">
              <motion.p 
                className="text-sm text-yellow-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ 
                  delay: 1.4,
                  duration: 0.3
                }}
              >
                {message}
              </motion.p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <motion.button
                type="button"
                className="inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ 
                  delay: 1.4,
                  duration: 0.3
                }}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
