'use client';

import { useState, useEffect, useMemo } from 'react';
import HarEntry from './HarEntry';
import { formatBytes, formatDuration, getRequestType } from './utils';

interface HarViewerProps {
  entries: Array<any>;
  totalSize?: number;
  totalTime?: number;
}

export default function HarViewer({ entries, totalSize = 0, totalTime = 0 }: HarViewerProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<'order' | 'time' | 'size' | 'status'>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const types = new Set<string>();
    const methods = new Set<string>();
    const statuses = new Set<string>();

    entries.forEach(entry => {
      const { type } = getRequestType(entry.request, entry.response);
      types.add(type);
      methods.add(entry.request.method);
      statuses.add(entry.response.status.toString());
    });

    return {
      types: Array.from(types).sort(),
      methods: Array.from(methods).sort(),
      statuses: Array.from(statuses).sort((a, b) => parseInt(a) - parseInt(b))
    };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const { type } = getRequestType(entry.request, entry.response);
      const matchesSearch = !searchFilter || 
        entry.request.url.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesType = !typeFilter || type === typeFilter;
      const matchesMethod = !methodFilter || entry.request.method === methodFilter;
      const matchesStatus = !statusFilter || 
        entry.response.status.toString() === statusFilter;

      return matchesSearch && matchesType && matchesMethod && matchesStatus;
    });
  }, [entries, searchFilter, typeFilter, methodFilter, statusFilter]);

  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      let aValue, bValue;
      switch (sortField) {
        case 'order':
          aValue = entries.indexOf(a);
          bValue = entries.indexOf(b);
          break;
        case 'time':
          aValue = a.time;
          bValue = b.time;
          break;
        case 'size':
          aValue = a.response.content.size;
          bValue = b.response.content.size;
          break;
        case 'status':
          aValue = a.response.status;
          bValue = b.response.status;
          break;
        default:
          return 0;
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [filteredEntries, sortField, sortDirection, entries]);

  const handleSort = (field: 'order' | 'time' | 'size' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Total Requests</div>
          <div className="text-2xl font-bold">{entries.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Total Size</div>
          <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Total Time</div>
          <div className="text-2xl font-bold">{formatDuration(totalTime)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search URL..."
          className="p-2 border border-gray-300 rounded"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
        <select
          className="p-2 border border-gray-300 rounded"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {filterOptions.types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          className="p-2 border border-gray-300 rounded"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="">All Methods</option>
          {filterOptions.methods.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
        <select
          className="p-2 border border-gray-300 rounded"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status Codes</option>
          {filterOptions.statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Headers */}
      <div className="bg-white sticky top-0 z-10 mb-4 p-4 rounded-lg shadow-sm flex items-center gap-4">
        <button 
          className={`w-8 text-left ${sortField === 'order' ? 'font-bold' : ''}`}
          onClick={() => handleSort('order')}
        >
          # {sortField === 'order' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          className={`w-20 text-left ${sortField === 'status' ? 'font-bold' : ''}`}
          onClick={() => handleSort('status')}
        >
          Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <span className="w-20">Method</span>
        <span className="w-16">Type</span>
        <span className="flex-1">URL</span>
        <button 
          className={`w-24 text-right ${sortField === 'time' ? 'font-bold' : ''}`}
          onClick={() => handleSort('time')}
        >
          Time {sortField === 'time' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          className={`w-24 text-right ${sortField === 'size' ? 'font-bold' : ''}`}
          onClick={() => handleSort('size')}
        >
          Size {sortField === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {sortedEntries.map((entry, index) => (
          <div 
            key={index}
            style={{ contentVisibility: 'auto' }}
            className="har-entry"
          >
            <HarEntry entry={entry} index={entries.indexOf(entry)} />
          </div>
        ))}
      </div>

      {/* No results */}
      {sortedEntries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No matching requests found
        </div>
      )}
    </div>
  );
}
