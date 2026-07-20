/** Full academic dashboard for Attendance Unand Home. */

import { parseCumulativeAcademic } from '../../parsers/cumulative-academic-parser.js';
import { parseCourseHistory } from '../../parsers/course-history-parser.js';
import { homeSelectors } from '../../selectors/home.js';
import { queryFirst, findTableByHeaders } from '../../../../shared/dom/query.js';
import { createRoot, mountRoot, el } from '../../ui/mount.js';
import { markNativeSource } from '../../ui/app-shell.js';
import { StateIndicator } from '../../../../shared/ui/StateIndicator.js';
import { DEFAULT_GRADE_SCALE, PARSER_VERSION } from '../../../../config/defaults.js';
import { MESSAGE_TYPES } from '../../../../shared/messaging/types.js';
import { logger } from '../../../../shared/logging/logger.js';
import { debounce } from '../../../../shared/utils/debounce.js';
import { COURSE_HISTORY_HEADERS, COURSE_HISTORY_MATCH_THRESHOLD } from '../../selectors/home.js';

const PAGE_SIZE = 10;

export async function mountHomeDashboard(input) {
  const { document: doc, location, signal } = input;
  if (signal.aborted) return;

  const root = createRoot('home-dashboard', { className: 'siakadx-dashboard' }, doc);
  root.appendChild(buildDashboardSkeleton(doc));
  mountRoot(doc, root);

  const [summaryResult, historyResult] = await Promise.all([
    waitForParser(() => parseCumulativeAcademic(doc, { pathname: location.pathname, treatEmptyAsLoading: true }), doc, signal),
    waitForParser(() => parseCourseHistory(doc, { pathname: location.pathname, treatEmptyAsLoading: true }), doc, signal)
  ]);

  if (signal.aborted) return;
  markNativeSource(queryFirst(doc, homeSelectors.cumulativeAcademicTable));
  markNativeSource(findTableByHeaders(doc, COURSE_HISTORY_HEADERS, COURSE_HISTORY_MATCH_THRESHOLD).table);

  renderDashboard(root, summaryResult, historyResult, doc);
  saveSafeCache(summaryResult, historyResult);
}

function buildDashboardSkeleton(doc) {
  const wrapper = el('div', 'siakadx-dashboard__skeleton', undefined, doc);
  wrapper.appendChild(StateIndicator({ state: 'loading', title: 'Menyiapkan dashboard', message: 'Menunggu data akademik dari portal resmi…' }));
  const grid = el('div', 'siakadx-stat-grid', undefined, doc);
  for (let index = 0; index < 4; index += 1) grid.appendChild(el('div', 'siakadx-skeleton siakadx-skeleton--stat', undefined, doc));
  wrapper.appendChild(grid);
  wrapper.appendChild(el('div', 'siakadx-skeleton siakadx-skeleton--panel', undefined, doc));
  return wrapper;
}

function waitForParser(parser, doc, signal, timeoutMs = 12000) {
  return new Promise((resolve) => {
    let settled = false;
    let settleTimer = null;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timeoutTimer);
      if (settleTimer) clearTimeout(settleTimer);
      signal.removeEventListener('abort', onAbort);
      resolve(result);
    };
    const evaluate = () => {
      const result = parser();
      if (result.status === 'success' || result.status === 'partial' || result.status === 'error') {
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(() => finish(parser()), 200);
      }
      return result;
    };
    const onAbort = () => finish(parser());
    const observer = new MutationObserver((mutations) => {
      if (mutations.every((mutation) => mutation.target.parentElement?.closest('[data-siakadx-root]'))) return;
      evaluate();
    });
    observer.observe(doc.documentElement, { childList: true, subtree: true, characterData: true });
    const timeoutTimer = setTimeout(() => finish(parser()), timeoutMs);
    signal.addEventListener('abort', onAbort, { once: true });
    const initial = evaluate();
    if (initial.status === 'empty' && timeoutMs === 0) finish(initial);
  });
}

function renderDashboard(root, summaryResult, historyResult, doc) {
  root.innerHTML = '';
  const summary = summaryResult.data;
  const records = Array.isArray(historyResult.data) ? historyResult.data : [];
  const computed = calculateCourseStatistics(records);

  if (summaryResult.status === 'error' && historyResult.status === 'error') {
    root.appendChild(StateIndicator({
      state: 'error',
      title: 'Data belum dapat dibaca',
      message: 'Struktur portal berubah atau data belum selesai dimuat. Tampilan asli tetap tersedia melalui tombol di kanan atas.'
    }));
    return;
  }

  const stats = el('section', 'siakadx-stat-grid', undefined, doc);
  stats.append(
    statCard(doc, 'IP Semester', formatDecimal(summary?.currentIps ?? computed.latestIps), 'Semester terbaru', 'accent'),
    statCard(doc, 'IPK', formatDecimal(summary?.currentIpk ?? computed.cumulativeGpa), 'Kumulatif', 'primary'),
    statCard(doc, 'SKS Lulus', formatInteger(summary?.passedCredits ?? computed.passedCredits), 'Dari data portal', 'success'),
    statCard(doc, 'Mata Kuliah', String(records.length || '—'), `${computed.semesters.length || 0} semester`, 'neutral')
  );
  root.appendChild(stats);

  const overview = el('div', 'siakadx-dashboard-grid', undefined, doc);
  const chartPanel = panel(doc, 'Perkembangan Akademik', 'IPS dan IPK per semester');
  chartPanel.body.appendChild(buildAcademicChart(doc, summary?.semesters || computed.semesterMetrics));
  overview.appendChild(chartPanel.element);

  const distributionPanel = panel(doc, 'Distribusi Nilai', 'Ringkasan nilai huruf yang sudah terbaca');
  distributionPanel.body.appendChild(buildGradeDistribution(doc, computed.gradeDistribution));
  overview.appendChild(distributionPanel.element);
  root.appendChild(overview);

  if (summaryResult.status !== 'success') {
    root.appendChild(StateIndicator({ state: 'partial', title: 'Ringkasan terbatas', message: 'Sebagian metrik IP/IPK belum dapat dikenali. Riwayat mata kuliah tetap ditampilkan.' }));
  }

  root.appendChild(buildCourseExplorer(doc, records));
  root.appendChild(buildGradeSimulator(doc, records, computed));

  const footer = el('footer', 'siakadx-data-footer', undefined, doc);
  footer.textContent = `Sumber: Attendance Unand · Dibaca ${formatDateTime(summaryResult.source?.parsedAt || historyResult.source?.parsedAt)} · Perubahan simulasi tidak mengubah data resmi.`;
  root.appendChild(footer);
}

function statCard(doc, label, value, hint, tone) {
  const card = el('article', `siakadx-stat-card siakadx-stat-card--${tone}`, undefined, doc);
  const top = el('div', 'siakadx-stat-card__top', undefined, doc);
  top.appendChild(el('span', 'siakadx-stat-card__label', label, doc));
  const dot = el('span', 'siakadx-stat-card__dot', undefined, doc);
  dot.setAttribute('aria-hidden', 'true');
  top.appendChild(dot);
  card.append(top, el('strong', 'siakadx-stat-card__value', value, doc), el('span', 'siakadx-stat-card__hint', hint, doc));
  return card;
}

function panel(doc, title, subtitle) {
  const element = el('section', 'siakadx-surface', undefined, doc);
  const header = el('header', 'siakadx-surface__header', undefined, doc);
  const titles = el('div', '', undefined, doc);
  titles.append(el('h2', '', title, doc), el('p', '', subtitle, doc));
  header.appendChild(titles);
  const body = el('div', 'siakadx-surface__body', undefined, doc);
  element.append(header, body);
  return { element, header, body };
}

function buildAcademicChart(doc, metrics) {
  const valid = metrics.filter((item) => item.ips !== null || item.ipk !== null);
  if (!valid.length) return StateIndicator({ state: 'empty', message: 'Data IPS/IPK per semester belum tersedia.' });

  const wrapper = el('div', 'siakadx-chart', undefined, doc);
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 720 260');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Grafik perkembangan IPS dan IPK per semester');

  const left = 50;
  const right = 690;
  const top = 24;
  const bottom = 215;
  for (let value = 0; value <= 4; value += 1) {
    const y = bottom - (value / 4) * (bottom - top);
    const line = doc.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', String(left)); line.setAttribute('x2', String(right)); line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y)); line.setAttribute('class', 'siakadx-chart__grid');
    svg.appendChild(line);
    const label = doc.createElementNS(svg.namespaceURI, 'text');
    label.setAttribute('x', '18'); label.setAttribute('y', String(y + 4)); label.setAttribute('class', 'siakadx-chart__axis-label'); label.textContent = String(value);
    svg.appendChild(label);
  }

  const xFor = (index) => valid.length === 1 ? (left + right) / 2 : left + (index / (valid.length - 1)) * (right - left);
  const yFor = (value) => bottom - ((value ?? 0) / 4) * (bottom - top);
  const makePath = (key, className) => {
    const points = valid.map((item, index) => item[key] === null ? null : `${xFor(index)},${yFor(item[key])}`).filter(Boolean);
    if (!points.length) return;
    const polyline = doc.createElementNS(svg.namespaceURI, 'polyline');
    polyline.setAttribute('points', points.join(' '));
    polyline.setAttribute('class', className);
    svg.appendChild(polyline);
  };
  makePath('ipk', 'siakadx-chart__line siakadx-chart__line--ipk');
  makePath('ips', 'siakadx-chart__line siakadx-chart__line--ips');

  valid.forEach((item, index) => {
    const text = doc.createElementNS(svg.namespaceURI, 'text');
    text.setAttribute('x', String(xFor(index))); text.setAttribute('y', '244'); text.setAttribute('text-anchor', 'middle'); text.setAttribute('class', 'siakadx-chart__axis-label'); text.textContent = String(item.semester);
    svg.appendChild(text);
  });
  wrapper.appendChild(svg);
  const legend = el('div', 'siakadx-chart__legend', undefined, doc);
  legend.innerHTML = '<span><i class="is-ipk"></i>IPK</span><span><i class="is-ips"></i>IPS</span>';
  wrapper.appendChild(legend);
  return wrapper;
}

function buildGradeDistribution(doc, distribution) {
  const container = el('div', 'siakadx-grade-distribution', undefined, doc);
  const entries = Object.entries(distribution).sort((a, b) => gradeOrder(a[0]) - gradeOrder(b[0]));
  if (!entries.length) return StateIndicator({ state: 'empty', message: 'Nilai huruf belum tersedia.' });
  const maximum = Math.max(...entries.map(([, count]) => count));
  for (const [grade, count] of entries) {
    const row = el('div', 'siakadx-grade-row', undefined, doc);
    row.appendChild(el('strong', '', grade, doc));
    const track = el('div', 'siakadx-grade-row__track', undefined, doc);
    const bar = el('span', 'siakadx-grade-row__bar', undefined, doc);
    bar.style.width = `${Math.max(8, (count / maximum) * 100)}%`;
    track.appendChild(bar);
    row.append(track, el('span', '', String(count), doc));
    container.appendChild(row);
  }
  return container;
}

function buildCourseExplorer(doc, records) {
  const section = panel(doc, 'Riwayat Mata Kuliah', 'Cari, filter, urutkan, dan lihat seluruh mata kuliah');
  const controls = el('div', 'siakadx-toolbar', undefined, doc);
  const search = doc.createElement('input');
  search.type = 'search'; search.className = 'siakadx-control'; search.placeholder = 'Cari kode atau nama mata kuliah'; search.setAttribute('aria-label', 'Cari mata kuliah');
  const semester = doc.createElement('select');
  semester.className = 'siakadx-control'; semester.setAttribute('aria-label', 'Filter semester');
  semester.appendChild(new Option('Semua semester', ''));
  const semesterValues = [...new Set(records.map((record) => record.semesterLabel).filter(Boolean))].sort(naturalCompare);
  semesterValues.forEach((value) => semester.appendChild(new Option(value, value)));
  const status = doc.createElement('select');
  status.className = 'siakadx-control'; status.setAttribute('aria-label', 'Filter status KRS');
  status.appendChild(new Option('Semua status KRS', ''));
  [...new Set(records.map((record) => record.krsStatus).filter(Boolean))].sort().forEach((value) => status.appendChild(new Option(value, value)));
  const sort = doc.createElement('select');
  sort.className = 'siakadx-control'; sort.setAttribute('aria-label', 'Urutkan mata kuliah');
  [['semester-desc', 'Semester terbaru'], ['semester-asc', 'Semester terlama'], ['name-asc', 'Nama A–Z'], ['grade-desc', 'Bobot tertinggi']].forEach(([value, label]) => sort.appendChild(new Option(label, value)));
  controls.append(search, semester, status, sort);
  section.body.appendChild(controls);

  const meta = el('div', 'siakadx-table-meta', undefined, doc);
  const count = el('span', '', '', doc);
  meta.appendChild(count);
  section.body.appendChild(meta);

  const tableWrap = el('div', 'siakadx-table-wrap', undefined, doc);
  const table = el('table', 'siakadx-table', undefined, doc);
  const caption = el('caption', 'siakadx-visually-hidden', 'Riwayat mata kuliah', doc);
  table.appendChild(caption);
  const thead = el('thead', '', undefined, doc);
  const trh = el('tr', '', undefined, doc);
  ['Semester', 'Kode', 'Mata Kuliah', 'SKS', 'Nilai', 'Bobot', 'Status KRS'].forEach((header) => {
    const th = el('th', '', header, doc); th.scope = 'col'; trh.appendChild(th);
  });
  thead.appendChild(trh); table.appendChild(thead);
  const tbody = el('tbody', '', undefined, doc); table.appendChild(tbody); tableWrap.appendChild(table); section.body.appendChild(tableWrap);

  const pager = el('nav', 'siakadx-pagination', undefined, doc); pager.setAttribute('aria-label', 'Navigasi halaman riwayat mata kuliah');
  const previous = button(doc, 'Sebelumnya', 'secondary');
  const pageLabel = el('span', '', '', doc);
  const next = button(doc, 'Berikutnya', 'secondary');
  pager.append(previous, pageLabel, next); section.body.appendChild(pager);

  let page = 1;
  const update = () => {
    const query = search.value.trim().toLowerCase();
    let filtered = records.filter((record) => {
      if (semester.value && record.semesterLabel !== semester.value) return false;
      if (status.value && record.krsStatus !== status.value) return false;
      const haystack = `${record.courseCode || ''} ${record.courseName || ''}`.toLowerCase();
      return !query || haystack.includes(query);
    });
    filtered = [...filtered].sort((a, b) => {
      if (sort.value === 'semester-asc') return compareSemester(a, b);
      if (sort.value === 'name-asc') return (a.courseName || '').localeCompare(b.courseName || '', 'id');
      if (sort.value === 'grade-desc') return (b.gradeWeight ?? -1) - (a.gradeWeight ?? -1);
      return compareSemester(b, a);
    });
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    tbody.innerHTML = '';
    if (!visible.length) {
      const row = el('tr', '', undefined, doc); const cell = el('td', 'siakadx-table__empty', 'Tidak ada mata kuliah yang cocok.', doc); cell.colSpan = 7; row.appendChild(cell); tbody.appendChild(row);
    } else {
      visible.forEach((record) => {
        const row = el('tr', '', undefined, doc);
        const cells = [record.semesterLabel || '—', record.courseCode || '—', record.courseName || '—', record.credits ?? '—', record.gradeLabel || '—', record.gradeWeight ?? '—', record.krsStatus || '—'];
        cells.forEach((value, index) => {
          const cell = el('td', index === 2 ? 'siakadx-table__primary' : '', String(value), doc);
          if (index === 4 && record.gradeLabel) cell.appendChild(gradeBadge(doc, record.gradeLabel));
          row.appendChild(cell);
        });
        tbody.appendChild(row);
      });
    }
    count.textContent = `${filtered.length} dari ${records.length} mata kuliah`;
    pageLabel.textContent = `Halaman ${page} dari ${pages}`;
    previous.disabled = page <= 1; next.disabled = page >= pages;
  };
  previous.addEventListener('click', () => { page -= 1; update(); });
  next.addEventListener('click', () => { page += 1; update(); });
  const resetPageAndUpdate = () => { page = 1; update(); };
  search.addEventListener('input', debounce(resetPageAndUpdate, 180));
  semester.addEventListener('change', resetPageAndUpdate); status.addEventListener('change', resetPageAndUpdate); sort.addEventListener('change', resetPageAndUpdate);
  update();
  return section.element;
}

function buildGradeSimulator(doc, records, computed) {
  const section = panel(doc, 'Simulasi Nilai', 'Perkiraan lokal—tidak mengubah data resmi kampus');
  const eligible = records.filter((record) => record.credits && record.courseName);
  if (!eligible.length) {
    section.body.appendChild(StateIndicator({ state: 'empty', message: 'Belum ada mata kuliah yang dapat disimulasikan.' }));
    return section.element;
  }
  const form = el('div', 'siakadx-simulator', undefined, doc);
  const course = doc.createElement('select'); course.className = 'siakadx-control'; course.setAttribute('aria-label', 'Pilih mata kuliah');
  eligible.forEach((record, index) => course.appendChild(new Option(`${record.courseCode || ''} — ${record.courseName}`, String(index))));
  const grade = doc.createElement('select'); grade.className = 'siakadx-control'; grade.setAttribute('aria-label', 'Pilih nilai simulasi');
  Object.keys(DEFAULT_GRADE_SCALE).forEach((label) => grade.appendChild(new Option(`${label} (${DEFAULT_GRADE_SCALE[label].toFixed(2)})`, label)));
  const result = el('div', 'siakadx-simulator__result', undefined, doc);
  const current = el('span', '', `IPK estimasi saat ini ${formatDecimal(computed.cumulativeGpa)}`, doc);
  const projected = el('strong', '', '', doc);
  result.append(current, projected);
  const update = () => {
    const selected = eligible[Number(course.value) || 0];
    const proposed = DEFAULT_GRADE_SCALE[grade.value];
    const projectedValue = simulateGpa(records, selected, proposed);
    projected.textContent = `Jika ${selected.courseCode || selected.courseName} menjadi ${grade.value}, estimasi IPK ${formatDecimal(projectedValue)}.`;
  };
  course.addEventListener('change', update); grade.addEventListener('change', update);
  form.append(course, grade, result);
  section.body.append(form, el('p', 'siakadx-help-text', 'Skala nilai simulasi dapat berbeda dari ketentuan resmi. Gunakan hanya untuk perencanaan pribadi.', doc));
  update();
  return section.element;
}

function calculateCourseStatistics(records) {
  const valid = records.filter((record) => record.credits && record.gradeWeight !== null);
  const totalCredits = valid.reduce((sum, record) => sum + record.credits, 0);
  const quality = valid.reduce((sum, record) => sum + record.credits * record.gradeWeight, 0);
  const cumulativeGpa = totalCredits ? quality / totalCredits : null;
  const semesterMap = new Map();
  for (const record of valid) {
    const semester = record.semesterNumber ?? record.semesterLabel ?? '—';
    if (!semesterMap.has(semester)) semesterMap.set(semester, []);
    semesterMap.get(semester).push(record);
  }
  const semesterMetrics = Array.from(semesterMap.entries()).map(([semester, list]) => {
    const credits = list.reduce((sum, record) => sum + record.credits, 0);
    const points = list.reduce((sum, record) => sum + record.credits * record.gradeWeight, 0);
    return { semester: Number(semester) || semesterMetricsLengthFallback(semester), ips: credits ? points / credits : null, ipk: null, semesterCredits: credits, cumulativeCredits: null };
  }).sort((a, b) => Number(a.semester) - Number(b.semester));
  let cumulativeCredits = 0; let cumulativePoints = 0;
  semesterMetrics.forEach((metric) => {
    const list = semesterMap.get(metric.semester) || semesterMap.get(String(metric.semester)) || [];
    cumulativeCredits += metric.semesterCredits || 0;
    cumulativePoints += list.reduce((sum, record) => sum + record.credits * record.gradeWeight, 0);
    metric.cumulativeCredits = cumulativeCredits;
    metric.ipk = cumulativeCredits ? cumulativePoints / cumulativeCredits : null;
  });
  const distribution = {};
  records.forEach((record) => { if (record.gradeLabel) distribution[record.gradeLabel] = (distribution[record.gradeLabel] || 0) + 1; });
  return {
    cumulativeGpa,
    latestIps: semesterMetrics.at(-1)?.ips ?? null,
    passedCredits: totalCredits || null,
    semesters: [...semesterMap.keys()],
    semesterMetrics,
    gradeDistribution: distribution
  };
}

function semesterMetricsLengthFallback(value) {
  const match = String(value).match(/\d+/); return match ? Number(match[0]) : 0;
}

function simulateGpa(records, selected, proposedWeight) {
  let credits = 0; let points = 0;
  for (const record of records) {
    if (!record.credits) continue;
    const weight = record === selected ? proposedWeight : record.gradeWeight;
    if (weight === null || weight === undefined) continue;
    credits += record.credits; points += record.credits * weight;
  }
  return credits ? points / credits : null;
}

function gradeBadge(doc, grade) {
  const badge = el('span', 'siakadx-grade-badge', grade, doc);
  badge.dataset.grade = grade.replace(/[^A-Z+-]/gi, '');
  return badge;
}

function button(doc, text, variant = 'primary') {
  const element = el('button', `siakadx-button siakadx-button--${variant}`, text, doc); element.type = 'button'; return element;
}

function compareSemester(a, b) {
  const av = a.semesterNumber ?? Number(String(a.semesterLabel || '').match(/\d+/)?.[0] || 0);
  const bv = b.semesterNumber ?? Number(String(b.semesterLabel || '').match(/\d+/)?.[0] || 0);
  return av - bv || String(a.semesterLabel || '').localeCompare(String(b.semesterLabel || ''), 'id');
}

function naturalCompare(a, b) {
  return String(a).localeCompare(String(b), 'id', { numeric: true });
}

function gradeOrder(grade) {
  const order = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'E'];
  const index = order.indexOf(grade); return index < 0 ? 99 : index;
}

function formatDecimal(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
}
function formatInteger(value) { return typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value)) : '—'; }
function formatDateTime(iso) {
  try { return new Date(iso).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso || '—'; }
}

function saveSafeCache(summaryResult, historyResult) {
  try {
    if (summaryResult.status === 'success') chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SAVE_PARSED_DATA, payload: { key: 'academicSummary', value: summaryResult.data, parserVersion: PARSER_VERSION } });
    if (historyResult.status === 'success') chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SAVE_PARSED_DATA, payload: { key: 'courseHistory', value: historyResult.data, parserVersion: PARSER_VERSION } });
  } catch (error) {
    logger.debug('Cache unavailable', error);
  }
}
