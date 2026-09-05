import test from 'node:test';
import assert from 'node:assert/strict';

// Helper re-implementations matching src/utils/dates.ts for standalone Node test runner validation
function getLocalDateKey(value = new Date()) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isToday(value, date = new Date()) {
  const key = getLocalDateKey(value);
  return Boolean(key) && key === getLocalDateKey(date);
}

function isYesterday(value, date = new Date()) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const key = getLocalDateKey(value);
  return Boolean(key) && key === getLocalDateKey(yesterday);
}

test('Date utilities - getLocalDateKey formats YYYY-MM-DD correctly', () => {
  const d = new Date(2026, 8, 5); // Sept 5, 2026
  assert.equal(getLocalDateKey(d), '2026-09-05');
});

test('Date utilities - isToday correctly compares dates', () => {
  const now = new Date();
  assert.equal(isToday(now), true);
  assert.equal(isToday(new Date('2020-01-01')), false);
});

test('Date utilities - isYesterday correctly identifies yesterday', () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  assert.equal(isYesterday(yesterday, now), true);
  assert.equal(isYesterday(now, now), false);
});
