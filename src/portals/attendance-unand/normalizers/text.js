/**
 * Text normalization helpers
 */

/**
 * Trim and collapse whitespace.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

/**
 * Normalize to lowercase for comparisons.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

/**
 * Return null if empty string after normalize.
 * @param {unknown} value
 * @returns {string | null}
 */
export function textOrNull(value) {
  const t = normalizeText(value);
  return t === '' ? null : t;
}