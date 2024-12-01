'use client';

import { useState } from 'react';
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
    <div className="space-y-4">
      {/* Tab Selection */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'har'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('har')}
        >
          HAR Viewer
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'logs'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveTab('logs')}
        >
          Log Viewer
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'har' ? (
          <HarViewer entries={entries} totalSize={totalSize} totalTime={totalTime} />
        ) : (
          <LogViewer logs={logs} />
        )}
      </div>
    </div>
  );
}
