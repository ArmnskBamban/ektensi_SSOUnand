/** Generic, header-driven parser for Attendance Unand report results. */

import { extractTableHeaders, buildHeaderIndexMap, getCellText, isPlaceholderRow, normalizeHeaderText } from '../../../shared/dom/query.js';
import { parseNumber } from '../normalizers/number.js';
import { textOrNull } from '../normalizers/text.js';
import { successResult, emptyResult, errorResult } from '../../../shared/result/parse-result.js';
import { PARSER_VERSION } from '../../../config/defaults.js';

const HEADER_GROUPS = {
  courseCode: ['kode', 'kode mk', 'kode mata kuliah'],
  courseName: ['mata kuliah', 'nama mata kuliah', 'nama', 'matakuliah'],
  meetings: ['pertemuan', 'total pertemuan', 'jumlah pertemuan'],
  present: ['hadir', 'kehadiran', 'h'],
  permit: ['izin', 'ijin', 'i'],
  sick: ['sakit', 's'],
  absent: ['alpa', 'alpha', 'tidak hadir', 'a'],
  percentage: ['persentase', 'persen', '%', 'persentase kehadiran']
};

function source(pathname = '/mahasiswa/absensi/report') {
  return { portal: 'attendance-unand', pathname, parsedAt: new Date().toISOString(), parserVersion: PARSER_VERSION };
}

function resolve(map, aliases) {
  for (const alias of aliases) {
    const normalized = normalizeHeaderText(alias);
    if (map.has(normalized)) return map.get(normalized);
  }
  for (const [header, index] of map.entries()) {
    if (aliases.some((alias) => header.includes(normalizeHeaderText(alias)))) return index;
  }
  return undefined;
}

function score(headers) {
  const normalized = headers.join(' ');
  let points = 0;
  if (/hadir|kehadiran/.test(normalized)) points += 3;
  if (/mata kuliah|matakuliah|nama/.test(normalized)) points += 2;
  if (/izin|ijin|sakit|alpa|alpha/.test(normalized)) points += 2;
  if (/persen|%/.test(normalized)) points += 1;
  return points;
}

export function findAttendanceReportTable(root) {
  let best = null;
  let bestScore = 0;
  for (const table of root.querySelectorAll('table')) {
    if (table.id === 'ipk-kumulatif-table' || table.id === 'table-bimbingan') continue;
    const headers = extractTableHeaders(table);
    const tableScore = score(headers);
    if (tableScore > bestScore) {
      best = table;
      bestScore = tableScore;
    }
  }
  return bestScore >= 3 ? best : null;
}

export function parseAttendanceReport(root, options = {}) {
  const empty = [];
  const meta = source(options.pathname);
  try {
    const table = findAttendanceReportTable(root);
    if (!table) return emptyResult(empty, meta, 'Tabel hasil kehadiran belum tersedia');
    const headers = extractTableHeaders(table);
    const map = buildHeaderIndexMap(headers);
    const columns = Object.fromEntries(Object.entries(HEADER_GROUPS).map(([key, aliases]) => [key, resolve(map, aliases)]));
    const rows = table.querySelectorAll('tbody tr');
    const records = [];

    for (const row of rows) {
      if (isPlaceholderRow(row)) continue;
      const raw = {};
      headers.forEach((header, index) => { raw[header || `kolom_${index + 1}`] = getCellText(row, index); });
      const readText = (key) => columns[key] === undefined ? null : textOrNull(getCellText(row, columns[key]));
      const readNumber = (key) => columns[key] === undefined ? null : parseNumber(getCellText(row, columns[key]));
      const readPercentage = () => columns.percentage === undefined ? null : parseNumber(getCellText(row, columns.percentage).replace(/%/g, '').trim());
      const meetings = readNumber('meetings');
      const present = readNumber('present');
      const permit = readNumber('permit');
      const sick = readNumber('sick');
      const absent = readNumber('absent');
      let percentage = readPercentage();
      if (percentage === null && meetings && present !== null) percentage = Math.round((present / meetings) * 10000) / 100;
      const courseName = readText('courseName');
      const courseCode = readText('courseCode');
      if (!courseName && !courseCode && Object.values(raw).every((value) => !value)) continue;
      records.push({ courseCode, courseName, meetings, present, permit, sick, absent, percentage, raw });
    }

    if (!records.length) return emptyResult(empty, meta, 'Tidak ada hasil kehadiran untuk filter ini');
    return successResult(records, meta, []);
  } catch (error) {
    return errorResult(empty, meta, 'PARSER_FAILED', error instanceof Error ? error.message : 'Gagal membaca laporan kehadiran');
  }
}
