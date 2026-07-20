/** Parser for the dynamically rendered #ipk-kumulatif-table. */

import { homeSelectors } from '../selectors/home.js';
import { queryFirst, isPlaceholderRow, normalizeHeaderText } from '../../../shared/dom/query.js';
import { parseNumber } from '../normalizers/number.js';
import { normalizeText } from '../normalizers/text.js';
import { successResult, emptyResult, errorResult, loadingResult } from '../../../shared/result/parse-result.js';
import { PARSER_VERSION } from '../../../config/defaults.js';

export function emptySummary() {
  return {
    semesters: [],
    currentSemester: null,
    currentIps: null,
    currentIpk: null,
    passedCredits: null,
    totalCredits: null,
    sourceLabels: []
  };
}

function makeSource(pathname = '/home') {
  return {
    portal: 'attendance-unand',
    pathname,
    parsedAt: new Date().toISOString(),
    parserVersion: PARSER_VERSION
  };
}

function classifyMetric(label) {
  const key = normalizeHeaderText(label).replace(/[()]/g, '');
  if (/^(ips|ip semester|indeks prestasi semester)$/.test(key)) return 'ips';
  if (/^(ipk|ip kumulatif|indeks prestasi kumulatif)$/.test(key)) return 'ipk';
  if (/sks.*(semester|diambil)|^(sks semester)$/.test(key)) return 'semesterCredits';
  if (/sks.*(kumulatif|total)/.test(key)) return 'cumulativeCredits';
  if (/sks.*lulus/.test(key)) return 'passedCredits';
  return null;
}

function semesterNumber(value) {
  const text = normalizeText(value);
  const exact = text.match(/^\d{1,2}$/);
  if (exact) return Number(exact[0]);
  const match = text.match(/semester\s*(\d{1,2})/i);
  return match ? Number(match[1]) : null;
}

function parseHorizontal(table) {
  const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
  if (!headerRow) return null;
  const headers = Array.from(headerRow.querySelectorAll('th,td')).map((cell) => normalizeText(cell.textContent));
  const semesterColumns = headers
    .map((header, index) => ({ semester: semesterNumber(header), index }))
    .filter((item) => item.semester !== null);
  if (semesterColumns.length === 0) return null;

  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const metrics = new Map();
  let passedCredits = null;
  const sourceLabels = [];

  for (const row of rows) {
    if (isPlaceholderRow(row)) continue;
    const cells = Array.from(row.querySelectorAll('th,td'));
    if (cells.length === 0) continue;
    const label = normalizeText(cells[0].textContent);
    const type = classifyMetric(label);
    sourceLabels.push(label);
    if (!type) continue;

    if (type === 'passedCredits') {
      const values = cells.slice(1).map((cell) => parseNumber(cell.textContent)).filter((value) => value !== null);
      if (values.length) passedCredits = values.at(-1) ?? null;
      continue;
    }

    for (const column of semesterColumns) {
      const value = parseNumber(cells[column.index]?.textContent);
      if (!metrics.has(column.semester)) {
        metrics.set(column.semester, {
          semester: column.semester,
          ips: null,
          ipk: null,
          semesterCredits: null,
          cumulativeCredits: null
        });
      }
      metrics.get(column.semester)[type] = value;
    }

    const passedIndex = headers.findIndex((header) => /sks.*lulus/i.test(header));
    if (passedIndex >= 0) {
      const value = parseNumber(cells[passedIndex]?.textContent);
      if (value !== null) passedCredits = value;
    }
  }

  const semesters = Array.from(metrics.values())
    .filter((item) => [item.ips, item.ipk, item.semesterCredits, item.cumulativeCredits].some((value) => value !== null))
    .sort((a, b) => a.semester - b.semester);
  if (!semesters.length && passedCredits === null) return null;
  return { semesters, passedCredits, sourceLabels };
}

function parseVertical(table) {
  const rows = Array.from(table.querySelectorAll('tbody tr, tr'));
  const semesters = [];
  let passedCredits = null;
  let currentSemester = null;
  const sourceLabels = [];

  for (const row of rows) {
    if (row.closest('thead') || isPlaceholderRow(row)) continue;
    const cells = Array.from(row.querySelectorAll('th,td'));
    if (cells.length < 2) continue;
    const label = normalizeText(cells[0].textContent);
    const value = parseNumber(cells[1].textContent);
    sourceLabels.push(label);
    const metric = classifyMetric(label);
    if (/^semester$/i.test(label) && value !== null) currentSemester = value;
    else if (metric === 'passedCredits' && value !== null) passedCredits = value;
    else {
      const sem = semesterNumber(label);
      if (sem !== null && value !== null) {
        semesters.push({ semester: sem, ips: null, ipk: value, semesterCredits: null, cumulativeCredits: null });
      }
    }
  }
  if (!semesters.length && passedCredits === null && currentSemester === null) return null;
  return { semesters, passedCredits, currentSemester, sourceLabels };
}

export function parseCumulativeAcademic(root, options = {}) {
  const source = makeSource(options.pathname || '/home');
  const empty = emptySummary();
  try {
    const table = queryFirst(root, homeSelectors.cumulativeAcademicTable);
    if (!table) {
      return options.treatEmptyAsLoading
        ? loadingResult(empty, source)
        : errorResult(empty, source, 'ELEMENT_NOT_FOUND', 'Tabel ringkasan akademik tidak ditemukan', { selector: '#ipk-kumulatif-table' });
    }

    const dataRows = Array.from(table.querySelectorAll('tbody tr, tr')).filter(
      (row) => !row.closest('thead') && !isPlaceholderRow(row)
    );
    if (dataRows.length === 0) {
      return options.treatEmptyAsLoading
        ? loadingResult(empty, source)
        : emptyResult(empty, source, 'Tabel ringkasan akademik masih kosong');
    }

    const parsed = parseHorizontal(table) || parseVertical(table);
    if (!parsed) {
      return errorResult(empty, source, 'UNSUPPORTED_STRUCTURE', 'Struktur tabel IPK belum dapat dikenali dengan aman');
    }

    const semesters = parsed.semesters || [];
    const latest = semesters.at(-1) || null;
    const calculatedCredits = semesters.reduce((sum, item) => sum + (item.semesterCredits || 0), 0);
    const totalCredits = latest?.cumulativeCredits ?? (calculatedCredits || null);
    const summary = {
      semesters,
      currentSemester: parsed.currentSemester ?? latest?.semester ?? null,
      currentIps: latest?.ips ?? null,
      currentIpk: latest?.ipk ?? null,
      passedCredits: parsed.passedCredits ?? latest?.cumulativeCredits ?? totalCredits,
      totalCredits,
      sourceLabels: parsed.sourceLabels || []
    };

    return successResult(summary, source, []);
  } catch (error) {
    return errorResult(empty, source, 'PARSER_FAILED', error instanceof Error ? error.message : 'Gagal membaca tabel ringkasan akademik');
  }
}
