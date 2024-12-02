'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HarViewer from '../HarViewer';
import LogViewer from '../LogViewer';

interface ViewerContainerProps {
  entries: Array<any>;
  logs?: Array<any>;
  totalSize?: number;
  totalTime?: number;
}

export default function ViewerContainer({ entries, logs = [], totalSize = 0, totalTime = 0 }: ViewerContainerProps) {
  const [activeTab, setActiveTab] = useState<'har' | 'logs'>('har');

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Tab Selection */}
      <motion.div 
        className="flex space-x-1 bg-gray-100 p-1 rounded-lg"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <motion.button
          className={`flex-1 py-2 px-4 rounded-md transition-all ${
            activeTab === 'har'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('har')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          HAR Viewer
        </motion.button>
        <motion.button
          className={`flex-1 py-2 px-4 rounded-md transition-all ${
            activeTab === 'logs'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('logs')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Log Viewer
        </motion.button>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'har' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'har' ? 20 : -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'har' ? (
            <HarViewer entries={entries} totalSize={totalSize} totalTime={totalTime} />
          ) : (
            <LogViewer logs={logs} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
