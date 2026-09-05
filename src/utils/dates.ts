export function getDayStart(date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getDayEnd(date = new Date()) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function parseFlexibleDate(value: string | Date | undefined | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed === 'Today' || trimmed === 'Just now' || trimmed === 'Now') return new Date();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || trimmed.includes('T') || trimmed.includes(',')) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function getLocalDateKey(value: string | Date = new Date()) {
  const parsed = parseFlexibleDate(value);
  if (!parsed) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isToday(value: string | Date, date = new Date()) {
  const key = getLocalDateKey(value);
  return Boolean(key) && key === getLocalDateKey(date);
}

export function isYesterday(value: string | Date, date = new Date()) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const key = getLocalDateKey(value);
  return Boolean(key) && key === getLocalDateKey(yesterday);
}

export function formatDate(value: string | Date) {
  const parsed = parseFlexibleDate(value);
  if (!parsed) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsed);
}

export function formatTime(value: string | Date) {
  const parsed = parseFlexibleDate(value);
  if (!parsed) return '';
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(parsed);
}

export function formatRelativeTime(value: string | Date) {
  const parsed = parseFlexibleDate(value);
  if (!parsed) return '';
  const delta = Date.now() - parsed.getTime();
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  if (isYesterday(parsed)) return 'Yesterday';
  return formatDate(parsed);
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}
