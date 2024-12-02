import { motion, AnimatePresence } from 'framer-motion';

interface ProgressIndicatorProps {
  progress: { current: number; total: number } | null;
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  return (
    <motion.div 
      className="text-center py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {progress ? (
          <motion.div 
            key="progress"
            className="space-y-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2.5 overflow-hidden relative">
              <motion.div 
                className="bg-blue-500 h-2.5 rounded-full"
                style={{
                  animation: progress.current < progress.total ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                }}
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              <motion.div 
                className="absolute top-0 left-0 w-full h-full bg-blue-400 opacity-0"
                animate={{ 
                  opacity: [0, 0.1, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            <motion.p 
              className="text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Processing entries: {progress.current} / {progress.total}
            </motion.p>
          </motion.div>
        ) : (
          <motion.div 
            key="spinner"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        )}
      </AnimatePresence>
      <motion.p 
        className="mt-4 text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Processing HAR file...
      </motion.p>
    </motion.div>
  );
}
