/**
 * DOM query helpers with selector fallback support.
 * Prefer stable IDs; never rely solely on nth-child.
 */

/**
 * Query first matching element from a list of selector candidates.
 * @param {ParentNode} root
 * @param {readonly string[] | string} selectors
 * @returns {Element | null}
 */
export function queryFirst(root, selectors) {
  if (!root) return null;

  const list = Array.isArray(selectors) ? selectors : [selectors];

  for (const selector of list) {
    if (!selector || typeof selector !== 'string') continue;
    try {
      const el = root.querySelector(selector);
      if (el) return el;
    } catch {
      // Invalid selector — skip
    }
  }

  return null;
}

/**
 * Query all matching elements from the first selector that matches anything.
 * @param {ParentNode} root
 * @param {readonly string[] | string} selectors
 * @returns {Element[]}
 */
export function queryAllFirst(root, selectors) {
  if (!root) return [];

  const list = Array.isArray(selectors) ? selectors : [selectors];

  for (const selector of list) {
    if (!selector || typeof selector !== 'string') continue;
    try {
      const nodes = root.querySelectorAll(selector);
      if (nodes.length > 0) {
        return Array.from(nodes);
      }
    } catch {
      // Invalid selector — skip
    }
  }

  return [];
}

/**
 * Normalize header text for comparison.
 * @param {string} text
 * @returns {string}
 */
export function normalizeHeaderText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Extract header texts from a table element.
 * Prefers thead th; falls back to first row cells.
 * @param {HTMLTableElement | Element} table
 * @returns {string[]}
 */
export function extractTableHeaders(table) {
  if (!table) return [];

  const theadCells = table.querySelectorAll('thead th, thead td');
  if (theadCells.length > 0) {
    return Array.from(theadCells).map((cell) =>
      normalizeHeaderText(cell.textContent || '')
    );
  }

  const firstRow = table.querySelector('tr');
  if (!firstRow) return [];

  const cells = firstRow.querySelectorAll('th, td');
  return Array.from(cells).map((cell) =>
    normalizeHeaderText(cell.textContent || '')
  );
}

/**
 * Build a map of header name → column index.
 * @param {string[]} headers - normalized headers
 * @returns {Map<string, number>}
 */
export function buildHeaderIndexMap(headers) {
  /** @type {Map<string, number>} */
  const map = new Map();
  headers.forEach((header, index) => {
    if (header && !map.has(header)) {
      map.set(header, index);
    }
  });
  return map;
}

/**
 * Score how well table headers match expected headers.
 * @param {string[]} actualHeaders - normalized
 * @param {readonly string[]} expectedHeaders - normalized
 * @returns {number} score 0–1
 */
export function scoreHeaderMatch(actualHeaders, expectedHeaders) {
  if (!expectedHeaders.length) return 0;
  if (!actualHeaders.length) return 0;

  let matches = 0;
  for (const expected of expectedHeaders) {
    if (actualHeaders.includes(expected)) {
      matches += 1;
    }
  }

  return matches / expectedHeaders.length;
}

/**
 * Find a table by matching expected headers.
 * @param {ParentNode} root
 * @param {readonly string[]} expectedHeaders - normalized lowercase
 * @param {number} [threshold=0.6]
 * @returns {{ table: Element | null, headers: string[], score: number, headerMap: Map<string, number> }}
 */
export function findTableByHeaders(root, expectedHeaders, threshold = 0.6) {
  const empty = {
    table: null,
    headers: [],
    score: 0,
    headerMap: new Map()
  };

  if (!root) return empty;

  const tables = root.querySelectorAll('table');
  let best = empty;

  for (const table of tables) {
    const headers = extractTableHeaders(table);
    const score = scoreHeaderMatch(headers, expectedHeaders);

    if (score > best.score) {
      best = {
        table,
        headers,
        score,
        headerMap: buildHeaderIndexMap(headers)
      };
    }
  }

  if (best.score < threshold) {
    return empty;
  }

  return best;
}

/**
 * Get cell text from a row by column index.
 * @param {Element} row
 * @param {number} columnIndex
 * @returns {string}
 */
export function getCellText(row, columnIndex) {
  if (!row || columnIndex < 0) return '';
  const cells = row.querySelectorAll('td, th');
  const cell = cells[columnIndex];
  if (!cell) return '';
  return (cell.textContent || '').trim().replace(/\s+/g, ' ');
}

/**
 * Check if a row looks like a DataTables empty/placeholder row.
 * @param {Element} row
 * @returns {boolean}
 */
export function isPlaceholderRow(row) {
  if (!row) return true;
  const text = (row.textContent || '').trim().toLowerCase();
  if (!text) return true;

  const placeholders = [
    'no data available',
    'tidak ada data',
    'no matching records',
    'loading',
    'memuat'
  ];

  return placeholders.some((p) => text.includes(p));
}