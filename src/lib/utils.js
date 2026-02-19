import clsx from 'clsx';
import { format as fnsFormat, parseISO } from 'date-fns';

/**
 * Merge class names, filtering out falsy values.
 */
export function cn(...classes) {
  return clsx(...classes);
}

/**
 * Extract initials from a full name (first letter of first & last word).
 *
 * @param {string} name
 * @returns {string} e.g. "John Doe" -> "JD"
 */
export function getInitials(name) {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Return a deterministic Tailwind-friendly HSL colour string derived from a name.
 * Useful for avatar backgrounds when no image is set.
 */
const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-lime-500',
  'bg-fuchsia-500',
];

export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Format a date (string or Date) using date-fns patterns.
 *
 * @param {string|Date} date
 * @param {string}      formatStr  date-fns format string (default: 'MMM d, yyyy')
 * @returns {string}
 */
export function formatDate(date, formatStr = 'MMM d, yyyy') {
  if (!date) return '';

  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return fnsFormat(parsed, formatStr);
}

/**
 * Generate a cryptographically random token string for shareable public links.
 *
 * @param {number} length  byte-length (default 32 -> 64 hex chars)
 * @returns {string}
 */
export function generateShareToken(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Truncate a string to a given length, appending an ellipsis when trimmed.
 *
 * @param {string} str
 * @param {number} length  max character count (default 50)
 * @returns {string}
 */
export function truncate(str, length = 50) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '\u2026';
}
