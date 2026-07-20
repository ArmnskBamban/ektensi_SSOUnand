/** Enhanced Attendance Report page with generic verified-safe parsing. */

import { attendanceReportSelectors } from '../../selectors/attendance-report.js';
import { queryFirst } from '../../../../shared/dom/query.js';
import { createRoot, mountRoot, el } from '../../ui/mount.js';
import { markNativeSource } from '../../ui/app-shell.js';
import { getSettings, updateSettings } from '../../../../shared/storage/index.js';
import { parseAttendanceReport, findAttendanceReportTable } from '../../parsers/attendance-report-parser.js';
import { StateIndicator } from '../../../../shared/ui/StateIndicator.js';
import { logger } from '../../../../shared/logging/logger.js';

export async function mountAttendanceReport(input) {
  const { document: doc, location, signal, settings } = input;
  if (signal.aborted) return;

  const form = queryFirst(doc, attendanceReportSelectors.form);
  const faculty = /** @type {HTMLSelectElement | null} */ (queryFirst(doc, attendanceReportSelectors.facultySelect));
  const semester = /** @type {HTMLSelectElement | null} */ (queryFirst(doc, attendanceReportSelectors.semesterSelect));
  if (form) form.setAttribute('data-siakadx-native-form', 'attendance-filter');

  await restoreFilter(faculty, semester);
  if (form && faculty && semester) {
    form.addEventListener('submit', () => saveFilter(faculty.value, semester.value), { signal, capture: true });
  }

  const root = createRoot('attendance-report', { className: 'siakadx-report' }, doc);
  root.appendChild(buildLoading(doc));
  mountRoot(doc, root);

  const result = await waitForReport(doc, location.pathname, signal);
  if (signal.aborted) return;
  renderReport(root, { doc, form, faculty, semester, result, threshold: settings.attendanceThreshold ?? 75 });
}

function buildLoading(doc) {
  const section = surface(doc, 'Laporan Kehadiran', 'Menyiapkan filter dan hasil absensi');
  section.body.appendChild(StateIndicator({ state: 'loading', message: 'Memeriksa data hasil pada halaman…' }));
  return section.element;
}

function waitForReport(doc, pathname, signal) {
  return new Promise((resolve) => {
    let finished = false;
    let settle = null;
    const finish = () => {
      if (finished) return;
      finished = true;
      observer.disconnect(); clearTimeout(timeout); signal.removeEventListener('abort', finish);
      resolve(parseAttendanceReport(doc, { pathname }));
    };
    const inspect = () => {
      if (findAttendanceReportTable(doc)) {
        clearTimeout(settle); settle = setTimeout(finish, 250);
      }
    };
    const observer = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => mutation.target.parentElement?.closest('[data-siakadx-root]'))) return;
      inspect();
    });
    observer.observe(doc.documentElement, { childList: true, subtree: true, characterData: true });
    const timeout = setTimeout(finish, 2500);
    signal.addEventListener('abort', finish, { once: true });
    inspect();
  });
}

function renderReport(root, context) {
  const { doc, form, faculty, semester, result, threshold } = context;
  root.innerHTML = '';

  const filterSurface = surface(doc, 'Filter Kehadiran', 'Gunakan form resmi portal—SIAKAD-X tidak mengirim filter otomatis');
  if (!form) {
    filterSurface.body.appendChild(StateIndicator({ state: 'error', message: 'Form filter resmi tidak ditemukan. Gunakan tampilan asli.' }));
  } else {
    const status = el('div', 'siakadx-filter-status', undefined, doc);
    status.append(statusPill(doc, 'Fakultas', faculty?.value ? selectedText(faculty) : 'Belum dipilih', Boolean(faculty?.value)), statusPill(doc, 'Semester', semester?.value ? selectedText(semester) : 'Belum dipilih', Boolean(semester?.value)));
    filterSurface.body.appendChild(status);

    const remember = el('label', 'siakadx-switch-row', undefined, doc);
    const checkbox = doc.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'siakadx-switch';
    getSettings().then((value) => { checkbox.checked = Boolean(value.attendanceReport?.rememberLastFilter); });
    checkbox.addEventListener('change', () => updateSettings({ attendanceReport: { rememberLastFilter: checkbox.checked } }));
    remember.append(checkbox, doc.createTextNode('Ingat pilihan fakultas dan semester di perangkat ini'));
    filterSurface.body.appendChild(remember);
  }
  root.appendChild(filterSurface.element);

  if (result.status === 'success' && Array.isArray(result.data)) {
    const nativeTable = findAttendanceReportTable(doc); markNativeSource(nativeTable);
    const records = result.data;
    const percentages = records.map((record) => record.percentage).filter((value) => typeof value === 'number');
    const average = percentages.length ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length : null;
    const atRisk = records.filter((record) => typeof record.percentage === 'number' && record.percentage < threshold);
    const stats = el('section', 'siakadx-stat-grid siakadx-stat-grid--three', undefined, doc);
    stats.append(stat(doc, 'Mata Kuliah', String(records.length), 'Hasil filter aktif'), stat(doc, 'Rata-rata hadir', average === null ? '—' : `${average.toFixed(1)}%`, `Target pribadi ${threshold}%`), stat(doc, 'Perlu perhatian', String(atRisk.length), atRisk.length ? 'Di bawah target' : 'Semua di atas target'));
    root.appendChild(stats);

    if (atRisk.length) root.appendChild(StateIndicator({ state: 'partial', title: 'Kehadiran perlu diperhatikan', message: `${atRisk.length} mata kuliah berada di bawah target ${threshold}%. Angka ini hanya ringkasan dari data portal.` }));
    root.appendChild(buildReportTable(doc, records, threshold));
  } else if (result.status === 'empty') {
    const state = faculty?.value && semester?.value
      ? StateIndicator({ state: 'empty', title: 'Belum ada hasil', message: 'Portal belum menampilkan tabel hasil untuk filter ini. Tekan tombol Tampilkan pada form resmi.' })
      : StateIndicator({ state: 'empty', title: 'Pilih filter', message: 'Pilih fakultas dan semester pada form resmi, lalu tekan Tampilkan.' });
    root.appendChild(state);
  } else {
    root.appendChild(StateIndicator({ state: 'error', title: 'Hasil belum dapat dibaca', message: result.issues?.[0]?.message || 'Gunakan tabel asli portal.' }));
  }
}

function buildReportTable(doc, records, threshold) {
  const section = surface(doc, 'Detail Kehadiran', 'Persentase dihitung ulang hanya ketika jumlah pertemuan dan hadir tersedia');
  const wrap = el('div', 'siakadx-table-wrap', undefined, doc);
  const table = el('table', 'siakadx-table', undefined, doc);
  const caption = el('caption', 'siakadx-visually-hidden', 'Rincian kehadiran mata kuliah', doc); table.appendChild(caption);
  const thead = el('thead', '', undefined, doc); const trh = el('tr', '', undefined, doc);
  ['Mata Kuliah', 'Pertemuan', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Persentase', 'Status'].forEach((header) => { const th = el('th', '', header, doc); th.scope = 'col'; trh.appendChild(th); });
  thead.appendChild(trh); table.appendChild(thead);
  const tbody = el('tbody', '', undefined, doc);
  records.forEach((record) => {
    const row = el('tr', '', undefined, doc);
    const course = record.courseName || record.courseCode || firstMeaningfulRaw(record.raw) || '—';
    [course, record.meetings, record.present, record.permit, record.sick, record.absent].forEach((value, index) => row.appendChild(el('td', index === 0 ? 'siakadx-table__primary' : '', value === null || value === undefined ? '—' : String(value), doc)));
    row.appendChild(el('td', '', record.percentage === null ? '—' : `${record.percentage.toFixed(1)}%`, doc));
    const statusCell = el('td', '', undefined, doc);
    const safe = record.percentage === null || record.percentage >= threshold;
    statusCell.appendChild(badge(doc, record.percentage === null ? 'Belum dihitung' : safe ? 'Aman' : 'Perlu perhatian', record.percentage === null ? 'neutral' : safe ? 'success' : 'danger'));
    row.appendChild(statusCell); tbody.appendChild(row);
  });
  table.appendChild(tbody); wrap.appendChild(table); section.body.appendChild(wrap); return section.element;
}

function surface(doc, title, subtitle) {
  const element = el('section', 'siakadx-surface', undefined, doc); const header = el('header', 'siakadx-surface__header', undefined, doc); const titles = el('div', '', undefined, doc);
  titles.append(el('h2', '', title, doc), el('p', '', subtitle, doc)); header.appendChild(titles); const body = el('div', 'siakadx-surface__body', undefined, doc); element.append(header, body); return { element, body };
}
function stat(doc, label, value, hint) { const card = el('article', 'siakadx-stat-card', undefined, doc); card.append(el('span', 'siakadx-stat-card__label', label, doc), el('strong', 'siakadx-stat-card__value', value, doc), el('span', 'siakadx-stat-card__hint', hint, doc)); return card; }
function badge(doc, text, tone) { return el('span', `siakadx-pill siakadx-pill--${tone}`, text, doc); }
function statusPill(doc, label, value, complete) { const item = el('div', 'siakadx-filter-status__item', undefined, doc); item.append(el('span', '', label, doc), el('strong', '', value, doc), badge(doc, complete ? 'Siap' : 'Wajib', complete ? 'success' : 'warning')); return item; }
function selectedText(select) { return select?.selectedOptions?.[0]?.textContent?.trim() || select?.value || '—'; }
function firstMeaningfulRaw(raw) { return Object.values(raw || {}).find((value) => value && !/^\d+$/.test(value)) || null; }

async function restoreFilter(faculty, semester) {
  if (!faculty || !semester) return;
  const settings = await getSettings();
  if (!settings.attendanceReport?.rememberLastFilter) return;
  setSelectValue(faculty, settings.attendanceReport.faculty); setSelectValue(semester, settings.attendanceReport.semester);
}
function setSelectValue(select, value) { if (value && Array.from(select.options).some((option) => option.value === value)) select.value = value; }
async function saveFilter(faculty, semester) {
  const settings = await getSettings();
  if (!settings.attendanceReport?.rememberLastFilter) return;
  await updateSettings({ attendanceReport: { rememberLastFilter: true, faculty, semester } });
  logger.debug('Attendance filter preference saved');
}
