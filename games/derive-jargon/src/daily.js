// Daily Puzzle helpers — one puzzle per day, deterministic, shareable.

import { TERMS, checkAnswer } from './jargon.js';

const STORAGE_KEY = 'datacruise.jargon.daily';
const DAILY_EPOCH = new Date('2026-05-12T00:00:00Z'); // launch day → puzzle #1

// Today as YYYY-MM-DD in local time
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Puzzle number since launch (1-indexed, never repeats until bank exhausts).
export function puzzleNumberFor(date = new Date()) {
  const oneDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((date.getTime() - DAILY_EPOCH.getTime()) / oneDay);
  return Math.max(1, days + 1);
}

// Deterministic puzzle for the given date.
export function puzzleFor(date = new Date()) {
  const n = puzzleNumberFor(date);
  const idx = (n - 1) % TERMS.length;
  return { puzzle: TERMS[idx], number: n, dateKey: todayKey(date) };
}

// Read any saved record of today's attempt.
export function readSavedAttempt(dateKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.dateKey === dateKey) return obj;
  } catch { /* ignore */ }
  return null;
}

export function writeSavedAttempt(record) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch { /* ignore */ }
}

// Build the share string the player can copy/paste anywhere.
// Single-attempt daily — one row: 🟩 solved, 🟥 missed.
export function buildShareText({ number, dateKey, result, hintUsed }) {
  const head = `Derive the Data Jargon #${number} — ${dateKey}`;
  const row = result === 'correct' ? '🟩' : '🟥';
  const status = result === 'correct'
    ? (hintUsed ? 'solved (with hint 💡)' : 'solved ✓')
    : (hintUsed ? 'missed (used 💡)' : 'missed ✗');
  return [
    head,
    row,
    status,
    'datacruise.wordpress.com/data-quizzes'
  ].join('\n');
}

// Re-export the matcher so render/main can stay in one direction.
export { checkAnswer };
