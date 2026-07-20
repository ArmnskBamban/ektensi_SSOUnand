/**
 * Generic parse result types used by all parsers.
 * Parsers must not throw for ordinary DOM mismatches — return ParseResult instead.
 */

/**
 * @typedef {'success' | 'empty' | 'partial' | 'unsupported' | 'error' | 'loading'} ParseStatus
 */

/**
 * @typedef {Object} ParseIssue
 * @property {string} code
 * @property {string} message
 * @property {string} [selector]
 * @property {string} [column]
 */

/**
 * @template T
 * @typedef {Object} ParseResult
 * @property {ParseStatus} status
 * @property {T} data
 * @property {ParseIssue[]} issues
 * @property {{ portal: string, pathname: string, parsedAt: string, parserVersion: string }} source
 */

/**
 * Create a successful parse result.
 * @template T
 * @param {T} data
 * @param {object} source
 * @param {ParseIssue[]} [issues]
 * @returns {ParseResult<T>}
 */
export function successResult(data, source, issues = []) {
  return {
    status: issues.length > 0 ? 'partial' : 'success',
    data,
    issues,
    source: {
      portal: source.portal || 'attendance-unand',
      pathname: source.pathname || '',
      parsedAt: source.parsedAt || new Date().toISOString(),
      parserVersion: source.parserVersion || '1.0.0'
    }
  };
}

/**
 * Create an empty parse result.
 * @template T
 * @param {T} emptyData
 * @param {object} source
 * @param {string} [message]
 * @returns {ParseResult<T>}
 */
export function emptyResult(emptyData, source, message = 'Tidak ada data') {
  return {
    status: 'empty',
    data: emptyData,
    issues: [{ code: 'EMPTY_DATA', message }],
    source: {
      portal: source.portal || 'attendance-unand',
      pathname: source.pathname || '',
      parsedAt: source.parsedAt || new Date().toISOString(),
      parserVersion: source.parserVersion || '1.0.0'
    }
  };
}

/**
 * Create an error parse result.
 * @template T
 * @param {T} emptyData
 * @param {object} source
 * @param {string} code
 * @param {string} message
 * @param {Partial<ParseIssue>} [extra]
 * @returns {ParseResult<T>}
 */
export function errorResult(emptyData, source, code, message, extra = {}) {
  return {
    status: 'error',
    data: emptyData,
    issues: [{ code, message, ...extra }],
    source: {
      portal: source.portal || 'attendance-unand',
      pathname: source.pathname || '',
      parsedAt: source.parsedAt || new Date().toISOString(),
      parserVersion: source.parserVersion || '1.0.0'
    }
  };
}

/**
 * Create a loading parse result.
 * @template T
 * @param {T} emptyData
 * @param {object} source
 * @returns {ParseResult<T>}
 */
export function loadingResult(emptyData, source) {
  return {
    status: 'loading',
    data: emptyData,
    issues: [],
    source: {
      portal: source.portal || 'attendance-unand',
      pathname: source.pathname || '',
      parsedAt: source.parsedAt || new Date().toISOString(),
      parserVersion: source.parserVersion || '1.0.0'
    }
  };
}

/**
 * Create an unsupported structure result.
 * @template T
 * @param {T} emptyData
 * @param {object} source
 * @param {string} [message]
 * @returns {ParseResult<T>}
 */
export function unsupportedResult(
  emptyData,
  source,
  message = 'Struktur halaman belum didukung'
) {
  return {
    status: 'unsupported',
    data: emptyData,
    issues: [{ code: 'UNSUPPORTED_STRUCTURE', message }],
    source: {
      portal: source.portal || 'attendance-unand',
      pathname: source.pathname || '',
      parsedAt: source.parsedAt || new Date().toISOString(),
      parserVersion: source.parserVersion || '1.0.0'
    }
  };
}