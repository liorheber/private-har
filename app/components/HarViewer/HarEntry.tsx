'use client';

import { useState } from 'react';
import { formatBytes, formatDuration, formatDate, getRequestType } from './utils';

interface HarEntryProps {
  entry: {
    startedDateTime: string;
    time: number;
    summary?: string;
    request: {
      method: string;
      url: string;
      headers: Array<{ name: string; value: string }>;
      queryString: Array<{ name: string; value: string }>;
      postData?: {
        mimeType: string;
        text: string;
      };
    };
    response: {
      status: number;
      statusText: string;
      headers: Array<{ name: string; value: string }>;
      content: {
        size: number;
        mimeType: string;
        text?: string;
      };
    };
    timings: {
      blocked: number;
      dns: number;
      connect: number;
      send: number;
      wait: number;
      receive: number;
    };
  };
  index: number;
}

function HeadersTable({ headers }: { headers: Array<{ name: string; value: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {headers.map((header, i) => (
            <tr key={i} className="border-t border-gray-200">
              <td className="p-2 font-medium">{header.name}</td>
              <td className="p-2 font-mono text-xs break-all">{header.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HarEntry({ entry, index }: HarEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { request, response, timings } = entry;
  const statusClass = response.status < 400 ? 'text-green-600' : 'text-red-600';
  const { type: requestType, color: requestTypeColor } = getRequestType(request, response);

  return (
    <div className="border border-gray-200 rounded-lg mb-4 bg-white shadow-sm">
      {/* Summary Row */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 flex items-center gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-gray-500 w-8">{index + 1}</span>
        <span className={`font-medium w-20 ${statusClass}`}>
          {response.status} {response.statusText}
        </span>
        <span className="font-medium w-20">{request.method}</span>
        <span className={`w-16 font-medium ${requestTypeColor}`}>{requestType}</span>
        <span className="flex-1 truncate font-mono text-sm">{request.url}</span>
        <span className="text-gray-600 w-24 text-right">
          {formatDuration(entry.time)}
        </span>
        <span className="text-gray-600 w-24 text-right">
          {formatBytes(response.content.size)}
        </span>
      </div>

      {/* Details Panel */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-6">
            {/* Summary */}
            {entry.summary && (
              <section>
                <h3 className="text-lg font-medium mb-2">Summary</h3>
                <p className="text-sm text-gray-700">{entry.summary}</p>
              </section>
            )}

            {/* General Info */}
            <section>
              <h3 className="text-lg font-medium mb-2">General</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Request URL:</span> {request.url}</p>
                  <p><span className="font-medium">Request Method:</span> {request.method}</p>
                  <p><span className="font-medium">Status Code:</span> {response.status}</p>
                  <p><span className="font-medium">Request Type:</span> <span className={requestTypeColor}>{requestType}</span></p>
                </div>
                <div>
                  <p><span className="font-medium">Started:</span> {formatDate(entry.startedDateTime)}</p>
                  <p><span className="font-medium">Total Time:</span> {formatDuration(entry.time)}</p>
                  <p><span className="font-medium">Size:</span> {formatBytes(response.content.size)}</p>
                  <p><span className="font-medium">Content Type:</span> {response.content.mimeType}</p>
                </div>
              </div>
            </section>

            {/* Timings */}
            <section>
              <h3 className="text-lg font-medium mb-2">Timings</h3>
              <div className="space-y-2">
                {Object.entries(timings).map(([phase, time]) => (
                  time > 0 && (
                    <div key={phase} className="flex items-center gap-2">
                      <span className="w-24 font-medium capitalize">{phase}:</span>
                      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${(time / entry.time) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 text-right">{formatDuration(time)}</span>
                    </div>
                  )
                ))}
              </div>
            </section>

            {/* Request Headers */}
            <section>
              <h3 className="text-lg font-medium mb-2">Request Headers</h3>
              <HeadersTable headers={request.headers} />
            </section>

            {/* Response Headers */}
            <section>
              <h3 className="text-lg font-medium mb-2">Response Headers</h3>
              <HeadersTable headers={response.headers} />
            </section>

            {/* Request Query Parameters */}
            {request.queryString.length > 0 && (
              <section>
                <h3 className="text-lg font-medium mb-2">Query Parameters</h3>
                <HeadersTable headers={request.queryString} />
              </section>
            )}

            {/* Request Body */}
            {request.postData && (
              <section>
                <h3 className="text-lg font-medium mb-2">Request Body</h3>
                <div className="bg-gray-50 p-4 rounded overflow-x-auto">
                  <pre className="text-sm">
                    {request.postData.text}
                  </pre>
                </div>
              </section>
            )}

            {/* Response Body */}
            {response.content.text && (
              <section>
                <h3 className="text-lg font-medium mb-2">Response Body</h3>
                <div className="bg-gray-50 p-4 rounded overflow-x-auto">
                  <pre className="text-sm">
                    {response.content.text}
                  </pre>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
