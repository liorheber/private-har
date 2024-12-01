export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

export function getMimeTypeColor(mimeType: string): string {
  if (mimeType.includes('image')) return 'text-purple-600';
  if (mimeType.includes('javascript')) return 'text-yellow-600';
  if (mimeType.includes('css')) return 'text-blue-600';
  if (mimeType.includes('html')) return 'text-red-600';
  if (mimeType.includes('json')) return 'text-green-600';
  return 'text-gray-600';
}

export function getRequestType(request: any, response: any): { type: string; color: string } {
  // Check if it's an XHR request
  const isXHR = request.headers.some(
    (header: { name: string; value: string }) =>
      header.name.toLowerCase() === 'x-requested-with' &&
      header.value.toLowerCase() === 'xmlhttprequest'
  );

  if (isXHR) return { type: 'XHR', color: 'text-purple-600' };

  // Check response content type
  const contentType = response.headers.find(
    (header: { name: string; value: string }) =>
      header.name.toLowerCase() === 'content-type'
  )?.value.toLowerCase() || '';

  // Common request types
  if (contentType.includes('html')) return { type: 'HTML', color: 'text-red-600' };
  if (contentType.includes('javascript')) return { type: 'JS', color: 'text-yellow-600' };
  if (contentType.includes('css')) return { type: 'CSS', color: 'text-blue-600' };
  if (contentType.includes('image')) return { type: 'IMG', color: 'text-green-600' };
  if (contentType.includes('font')) return { type: 'FONT', color: 'text-pink-600' };
  if (contentType.includes('json')) return { type: 'JSON', color: 'text-indigo-600' };
  if (contentType.includes('xml')) return { type: 'XML', color: 'text-orange-600' };

  // Check if it's a media file
  if (contentType.includes('audio') || contentType.includes('video')) {
    return { type: 'MEDIA', color: 'text-teal-600' };
  }

  // Check for common API patterns in URL
  const url = request.url.toLowerCase();
  if (url.includes('/api/') || url.includes('/rest/') || url.includes('/graphql')) {
    return { type: 'API', color: 'text-violet-600' };
  }

  // Default type
  return { type: 'OTHER', color: 'text-gray-600' };
}
