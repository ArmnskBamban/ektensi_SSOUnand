/**
 * Header-driven parser for course history table on Home.
 *
 * Do NOT use table:nth-child. Discover table by matching headers:
 * Semester, Kode Sem, Kode, Nama, Jenis, Bobot, Nilai, SKS, KRS, KRS Status
 */

import {
  COURSE_HISTORY_HEADERS,
  COURSE_HISTORY_MATCH_THRESHOLD
} from '../selectors/home.js';
import {
  findTableByHeaders,
  getCellText,
  isPlaceholderRow
} from '../../../shared/dom/query.js';
import { textOrNull } from '../normalizers/text.js';
import { parseCredits, parseGradeWeight } from '../normalizers/number.js';
import {
  successResult,
  emptyResult,
  errorResult,
  loadingResult
} from '../../../shared/result/parse-result.js';
import { PARSER_VERSION } from '../../../config/defaults.js';

/**
 * @typedef {import('./types.js').CourseHistoryRecord} CourseHistoryRecord
 */

/**
 * Header aliases → canonical field keys
 */
const FIELD_ALIASES = {
  semesterLabel: ['semester'],
  semesterCode: ['kode sem', 'kode semester'],
  courseCode: ['kode'],
  courseName: ['nama', 'nama mata kuliah', 'mata kuliah'],
  courseType: ['jenis'],
  gradeWeight: ['bobot'],
  gradeLabel: ['nilai'],
  credits: ['sks'],
  krsValue: ['krs'],
  krsStatus: ['krs status', 'status krs']
};

/**
 * @returns {CourseHistoryRecord[]}
 */
export function emptyCourseHistory() {
  return [];
}

/**
 * @param {string} [pathname]
 */
function makeSource(pathname = '/home') {
  return {
    portal: 'attendance-unand',
    pathname,
    parsedAt: new Date().toISOString(),
    parserVersion: PARSER_VERSION
  };
}

/**
 * Resolve column index for a field from header map using aliases.
 * @param {Map<string, number>} headerMap
 * @param {string[]} aliases
 * @returns {number | undefined}
 */
function resolveColumn(headerMap, aliases) {
  for (const alias of aliases) {
    if (headerMap.has(alias)) {
      return headerMap.get(alias);
    }
  }
  return undefined;
}

/**
 * Parse course history from live DOM using header-driven discovery.
 *
 * @param {Document | ParentNode} root
 * @param {{ pathname?: string, treatEmptyAsLoading?: boolean }} [options]
 * @returns {import('../../../shared/result/parse-result.js').ParseResult<CourseHistoryRecord[]>}
 */
export function parseCourseHistory(root, options = {}) {
  const pathname = options.pathname || '/home';
  const source = makeSource(pathname);
  const empty = emptyCourseHistory();

  try {
    const { table, headers, score, headerMap } = findTableByHeaders(
      root,
      COURSE_HISTORY_HEADERS,
      COURSE_HISTORY_MATCH_THRESHOLD
    );

    if (!table) {
      if (options.treatEmptyAsLoading) {
        return loadingResult(empty, source);
      }
      return errorResult(
        empty,
        source,
        'TABLE_HEADER_MISMATCH',
        'Tabel riwayat mata kuliah tidak ditemukan berdasarkan header yang diharapkan',
        { selector: 'table' }
      );
    }

    /** @type {import('../../../shared/result/parse-result.js').ParseIssue[]} */
    const issues = [];

    // Check important columns
    const importantFields = [
      'courseCode',
      'courseName',
      'credits',
      'gradeLabel'
    ];
    for (const field of importantFields) {
      const aliases = FIELD_ALIASES[field];
      if (resolveColumn(headerMap, aliases) === undefined) {
        issues.push({
          code: 'MISSING_COLUMN',
          message: `Kolom penting tidak ditemukan: ${field}`,
          column: field
        });
      }
    }

    // Map field → column index
    /** @type {Record<string, number | undefined>} */
    const col = {};
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      col[field] = resolveColumn(headerMap, aliases);
    }

    const tbody = table.querySelector('tbody');
    const rows = tbody
      ? tbody.querySelectorAll('tr')
      : table.querySelectorAll('tr');

    /** @type {CourseHistoryRecord[]} */
    const records = [];

    let rowIndex = 0;
    for (const row of rows) {
      // Skip header row if no tbody
      if (!tbody && rowIndex === 0 && row.querySelector('th')) {
        rowIndex += 1;
        continue;
      }

      if (isPlaceholderRow(row)) {
        rowIndex += 1;
        continue;
      }

      /** @type {Record<string, string>} */
      const raw = {};
      headers.forEach((h, i) => {
        raw[h] = getCellText(row, i);
      });

      const semesterLabel =
        col.semesterLabel !== undefined
          ? textOrNull(getCellText(row, col.semesterLabel))
          : null;
      const semesterCode =
        col.semesterCode !== undefined
          ? textOrNull(getCellText(row, col.semesterCode))
          : null;
      const courseCode =
        col.courseCode !== undefined
          ? textOrNull(getCellText(row, col.courseCode))
          : null;
      const courseName =
        col.courseName !== undefined
          ? textOrNull(getCellText(row, col.courseName))
          : null;
      const courseType =
        col.courseType !== undefined
          ? textOrNull(getCellText(row, col.courseType))
          : null;
      const gradeWeightRaw =
        col.gradeWeight !== undefined
          ? getCellText(row, col.gradeWeight)
          : '';
      const gradeLabel =
        col.gradeLabel !== undefined
          ? textOrNull(getCellText(row, col.gradeLabel))
          : null;
      const creditsRaw =
        col.credits !== undefined ? getCellText(row, col.credits) : '';
      const krsValue =
        col.krsValue !== undefined
          ? textOrNull(getCellText(row, col.krsValue))
          : null;
      const krsStatus =
        col.krsStatus !== undefined
          ? textOrNull(getCellText(row, col.krsStatus))
          : null;

      // Skip completely empty rows
      if (!courseCode && !courseName && !gradeLabel) {
        rowIndex += 1;
        continue;
      }

      const gradeWeight = parseGradeWeight(gradeWeightRaw);
      const credits = parseCredits(creditsRaw);

      if (gradeWeightRaw && gradeWeight === null) {
        issues.push({
          code: 'INVALID_GRADE_VALUE',
          message: `Bobot tidak valid pada baris ${rowIndex + 1}`,
          column: 'bobot'
        });
      }

      const semesterMatch = semesterLabel?.match(/\d{1,2}/);
      const semesterNumber = semesterMatch ? Number(semesterMatch[0]) : null;

      records.push({
        semesterLabel,
        semesterNumber,
        semesterCode,
        courseCode,
        courseName,
        courseType,
        gradeWeight,
        gradeLabel,
        credits,
        krsValue,
        krsStatus,
        raw
      });

      rowIndex += 1;
    }

    if (records.length === 0) {
      if (options.treatEmptyAsLoading) {
        return loadingResult(empty, source);
      }
      return emptyResult(
        empty,
        source,
        'Tabel riwayat mata kuliah tidak berisi data'
      );
    }

    // Attach match score as debug issue if partial match
    if (score < 1) {
      issues.push({
        code: 'PARTIAL_HEADER_MATCH',
        message: `Kecocokan header: ${Math.round(score * 100)}%`
      });
    }

    return successResult(records, source, issues);
  } catch (err) {
    return errorResult(
      empty,
      source,
      'PARSER_FAILED',
      err instanceof Error ? err.message : 'Gagal mem-parse riwayat mata kuliah'
    );
  }
}