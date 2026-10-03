/**
 * Utility functions for Indian Standard Time (IST, UTC+5:30)
 */

export function formatISTTime(date: Date | string | number = new Date()): string {
  if (!date) return '00:00:00 IST';
  
  if (typeof date === 'string') {
    // If it already ends with IST, return it
    if (date.trim().endsWith('IST')) return date.trim();
    
    // If it's a simple HH:MM:SS or HH:MM format
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(date.trim())) {
      return `${date.trim()} IST`;
    }
  }

  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return typeof date === 'string' ? `${date} IST` : '00:00:00 IST';
  }

  const timeStr = d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `${timeStr} IST`;
}

export function getCurrentISTString(): string {
  return formatISTTime(new Date());
}
