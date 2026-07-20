/**
 * Number parsing helpers for Indonesian and general formats.
 */

/**
 * Parse a number from text that may use comma as decimal separator.
 * Returns null if invalid.
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  let text = String(value).trim();
  if (!text) return null;

  // Remove thousand separators (dot or space) and normalize decimal comma
  // e.g. "1.234,56" → "1234.56"  |  "3,5" → "3.5"  |  "3.5" → "3.5"
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) {
    // Indonesian thousand: 1.234,56
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+,\d+$/.test(text)) {
    // Simple decimal comma: 3,5
    text = text.replace(',', '.');
  } else {
    // Remove spaces used as thousand separators
    text = text.replace(/\s/g, '');
  }

  // Strip non-numeric except dot and minus
  text = text.replace(/[^\d.-]/g, '');

  if (!text || text === '-' || text === '.') return null;

  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse integer SKS (credits). Must be non-negative integer.
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseCredits(value) {
  const n = parseNumber(value);
  if (n === null) return null;
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

/**
 * Parse grade weight (bobot), typically 0–4.
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseGradeWeight(value) {
  const n = parseNumber(value);
  if (n === null) return null;
  if (n < 0 || n > 4) return null;
  return n;
}