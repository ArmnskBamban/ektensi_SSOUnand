/**
 * Parser for #table-bimbingan (Bimbingan Akademik list).
 * Does NOT parse or store conversation content.
 */

import { advisingSelectors, ADVISING_HEADER_ALIASES } from '../selectors/academic-advising.js';
import {
  queryFirst,
  extractTableHeaders,
  buildHeaderIndexMap,
  getCellText,
  isPlaceholderRow,
  normalizeHeaderText
} from '../../../shared/dom/query.js';
import { textOrNull } from '../normalizers/text.js';
import {
  successResult,
  emptyResult,
  errorResult
} from '../../../shared/result/parse-result.js';
import { PARSER_VERSION } from '../../../config/defaults.js';
import { ATTENDANCE_UNAND_ROUTES } from '../routes.js';

/**
 * @typedef {import('./types.js').AcademicAdvisingPeriod} AcademicAdvisingPeriod
 */

const ATTENDANCE_ORIGIN = 'https://attendance.unand.ac.id';

/**
 * @returns {AcademicAdvisingPeriod[]}
 */
export function emptyAdvisingPeriods() {
  return [];
}

/**
 * @param {string} [pathname]
 */
function makeSource(pathname = ATTENDANCE_UNAND_ROUTES.academicAdvisingList) {
  return {
    portal: 'attendance-unand',
    pathname,
    parsedAt: new Date().toISOString(),
    parserVersion: PARSER_VERSION
  };
}

/**
 * Resolve column via aliases.
 * @param {Map<string, number>} headerMap
 * @param {readonly string[]} aliases
 * @returns {number | undefined}
 */
function resolveCol(headerMap, aliases) {
  for (const a of aliases) {
    const key = normalizeHeaderText(a);
    if (headerMap.has(key)) return headerMap.get(key);
  }
  return undefined;
}

/**
 * Sanitize detail URL: keep only attendance.unand.ac.id paths, drop sensitive query params.
 * @param {string | null} href
 * @returns {string | null}
 */
export function sanitizeDetailUrl(href) {
  if (!href) return null;

  try {
    // Relative URL
    const url = new URL(href, ATTENDANCE_ORIGIN);

    if (url.origin !== ATTENDANCE_ORIGIN) {
      return null;
    }

    // Drop sensitive query params if present
    const sensitive = [
      'token',
      'access_token',
      'refresh_token',
      'session',
      'key'
    ];
    for (const p of sensitive) {
      url.searchParams.delete(p);
    }

    return url.pathname + url.search;
  } catch {
    return null;
  }
}

/**
 * Find "Masuk" or detail link in a row.
 * @param {Element} row
 * @returns {string | null}
 */
function findDetailHref(row) {
  const links = row.querySelectorAll('a[href]');
  for (const link of links) {
    const text = (link.textContent || '').trim().toLowerCase();
    const href = link.getAttribute('href') || '';
    if (
      text.includes('masuk') ||
      href.includes('bimbingan-pa-detail') ||
      href.includes('detail-bimbingan')
    ) {
      return href;
    }
  }
  // Fallback: first internal link
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    if (href && !href.startsWith('http') && href !== '#') {
      return href;
    }
  }
  return null;
}

/**
 * Parse academic advising period list.
 *
 * @param {Document | ParentNode} root
 * @param {{ pathname?: string }} [options]
 * @returns {import('../../../shared/result/parse-result.js').ParseResult<AcademicAdvisingPeriod[]>}
 */
export function parseAcademicAdvisingList(root, options = {}) {
  const pathname =
    options.pathname || ATTENDANCE_UNAND_ROUTES.academicAdvisingList;
  const source = makeSource(pathname);
  const empty = emptyAdvisingPeriods();

  try {
    const table = queryFirst(root, advisingSelectors.table);

    if (!table) {
      return errorResult(
        empty,
        source,
        'ELEMENT_NOT_FOUND',
        'Tabel #table-bimbingan tidak ditemukan',
        { selector: '#table-bimbingan' }
      );
    }

    const headers = extractTableHeaders(table);
    const headerMap = buildHeaderIndexMap(headers);

    /** @type {import('../../../shared/result/parse-result.js').ParseIssue[]} */
    const issues = [];

    const colStatus = resolveCol(headerMap, ADVISING_HEADER_ALIASES.status);
    const colSemester = resolveCol(headerMap, ADVISING_HEADER_ALIASES.semester);
    const colYear = resolveCol(headerMap, ADVISING_HEADER_ALIASES.year);
    const colVerification = resolveCol(
      headerMap,
      ADVISING_HEADER_ALIASES.verification
    );

    if (colStatus === undefined) {
      issues.push({
        code: 'MISSING_COLUMN',
        message: 'Kolom status bimbingan tidak ditemukan',
        column: 'status'
      });
    }

    const tbody = table.querySelector('tbody');
    const rows = tbody
      ? tbody.querySelectorAll('tr')
      : table.querySelectorAll('tr');

    /** @type {AcademicAdvisingPeriod[]} */
    const periods = [];
    let index = 0;

    for (const row of rows) {
      if (!tbody && index === 0 && row.querySelector('th')) {
        index += 1;
        continue;
      }
      if (isPlaceholderRow(row)) {
        index += 1;
        continue;
      }

      const advisingStatus =
        colStatus !== undefined
          ? textOrNull(getCellText(row, colStatus))
          : null;
      const semesterLabel =
        colSemester !== undefined
          ? textOrNull(getCellText(row, colSemester))
          : null;
      const academicYear =
        colYear !== undefined ? textOrNull(getCellText(row, colYear)) : null;
      const verificationStatus =
        colVerification !== undefined
          ? textOrNull(getCellText(row, colVerification))
          : null;

      const rawHref = findDetailHref(row);
      const detailUrl = sanitizeDetailUrl(rawHref);

      // Skip empty rows
      if (!advisingStatus && !semesterLabel && !academicYear) {
        index += 1;
        continue;
      }

      periods.push({
        rowIndex: index,
        advisingStatus,
        semesterLabel,
        academicYear,
        verificationStatus,
        detailUrl
      });

      index += 1;
    }

    if (periods.length === 0) {
      return emptyResult(empty, source, 'Belum ada data bimbingan akademik');
    }

    return successResult(periods, source, issues);
  } catch (err) {
    return errorResult(
      empty,
      source,
      'PARSER_FAILED',
      err instanceof Error ? err.message : 'Gagal mem-parse bimbingan akademik'
    );
  }
}