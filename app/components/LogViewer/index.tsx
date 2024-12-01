'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { VariableSizeList as List } from 'react-window';
import debounce from 'lodash/debounce';

interface LogEntry {
  timestamp: string;
  message: string;
  data?: any;
}

interface LogViewerProps {
  logs: LogEntry[];
}

const LIST_HEIGHT = 600; // Max height of the list
const MIN_ROW_HEIGHT = 50; // Minimum height for a row
const PADDING = 32; // Total vertical padding for a row
const LINE_HEIGHT = 20; // Line height in pixels
const TIMESTAMP_HEIGHT = 20; // Height of timestamp line

export default function LogViewer({ logs = [] }: LogViewerProps) {
  const [filter, setFilter] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(logs);
  const listRef = useRef<List>(null);
  const rowHeights = useRef<{ [key: number]: number }>({});

  // Debounced filter function to prevent excessive re-renders
  const debouncedFilter = useMemo(
    () =>
      debounce((searchTerm: string, logs: LogEntry[]) => {
        if (!searchTerm) {
          setFilteredLogs(logs);
          return;
        }

        const lowerFilter = searchTerm.toLowerCase();
        const filtered = logs.filter(
          log =>
            log.message.toLowerCase().includes(lowerFilter) ||
            (log.data && JSON.stringify(log.data).toLowerCase().includes(lowerFilter))
        );
        setFilteredLogs(filtered);

        // Reset cache when filter changes
        rowHeights.current = {};
        if (listRef.current) {
          listRef.current.resetAfterIndex(0);
        }
      }, 300),
    []
  );

  useEffect(() => {
    debouncedFilter(filter, logs);
    return () => {
      debouncedFilter.cancel();
    };
  }, [logs, filter, debouncedFilter]);

  const formatTime = useCallback((timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });
    } catch {
      return timestamp;
    }
  }, []);

  const formatData = useCallback((data: any) => {
    if (!data) return null;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return null;
    }
  }, []);

  const getRowHeight = useCallback((index: number) => {
    if (rowHeights.current[index] !== undefined) {
      return rowHeights.current[index];
    }

    const log = filteredLogs[index];
    if (!log) return MIN_ROW_HEIGHT;

    // Calculate height based on content
    let height = TIMESTAMP_HEIGHT; // Start with timestamp height

    // Add message height (calculate based on length and container width)
    const messageLines = Math.ceil(log.message.length / 50); // Rough estimate of chars per line
    height += messageLines * LINE_HEIGHT;

    // Add data height if present
    if (log.data) {
      const dataStr = formatData(log.data);
      if (dataStr) {
        const dataLines = dataStr.split('\n').length;
        height += dataLines * LINE_HEIGHT;
      }
    }

    height += PADDING; // Add padding
    height = Math.max(height, MIN_ROW_HEIGHT); // Ensure minimum height

    rowHeights.current[index] = height;
    return height;
  }, [filteredLogs, formatData]);

  // Reset cache when logs change
  useEffect(() => {
    rowHeights.current = {};
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [filteredLogs]);

  // Memoized row renderer
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const log = filteredLogs[index];
      const data = formatData(log.data);
      
      return (
        <div
          style={style}
          className="px-4 py-2 border-b border-gray-200 hover:bg-gray-50"
        >
          <div className="flex items-start gap-4">
            <span className="text-gray-500 whitespace-nowrap font-mono text-sm shrink-0">
              {formatTime(log.timestamp)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {log.message}
              </p>
              {data && (
                <pre className="mt-1 text-xs text-gray-500 whitespace-pre-wrap overflow-hidden">
                  {data}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    },
    [filteredLogs, formatTime, formatData]
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredLogs.length > 0 ? (
        <List
          ref={listRef}
          height={LIST_HEIGHT}
          itemCount={filteredLogs.length}
          itemSize={getRowHeight}
          width="100%"
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
          {Row}
        </List>
      ) : (
        <div className="p-4 text-center text-gray-500">
          {filter ? 'No logs match the filter' : 'No logs available'}
        </div>
      )}
    </div>
  );
}
