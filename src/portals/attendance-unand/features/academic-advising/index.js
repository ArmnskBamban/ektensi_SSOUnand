/** Academic advising list and safe detail-page enhancement. */

import { parseAcademicAdvisingList } from '../../parsers/academic-advising-parser.js';
import { advisingSelectors } from '../../selectors/academic-advising.js';
import { queryFirst } from '../../../../shared/dom/query.js';
import { createRoot, mountRoot, el } from '../../ui/mount.js';
import { markNativeSource } from '../../ui/app-shell.js';
import { StateIndicator } from '../../../../shared/ui/StateIndicator.js';
import { MESSAGE_TYPES } from '../../../../shared/messaging/types.js';
import { PARSER_VERSION } from '../../../../config/defaults.js';
import { logger } from '../../../../shared/logging/logger.js';

export async function mountAcademicAdvising(input) {
  const { document: doc, location, signal } = input;
  if (signal.aborted) return;
  const result = parseAcademicAdvisingList(doc, { pathname: location.pathname });
  markNativeSource(queryFirst(doc, advisingSelectors.table));

  const root = createRoot('academic-advising', { className: 'siakadx-advising' }, doc);
  if (result.status === 'success' && Array.isArray(result.data)) {
    const periods = [...result.data].sort(comparePeriods);
    const summary = el('section', 'siakadx-stat-grid siakadx-stat-grid--three', undefined, doc);
    summary.append(stat(doc, 'Periode', String(periods.length), 'Riwayat bimbingan'), stat(doc, 'Terverifikasi', String(periods.filter((period) => /verifik|setuju|valid/i.test(period.verificationStatus || '')).length), 'Berdasarkan teks portal'), stat(doc, 'Terbaru', formatPeriod(periods[0]), periods[0]?.advisingStatus || '—'));
    root.appendChild(summary);

    const surface = makeSurface(doc, 'Riwayat Bimbingan Akademik', 'Pilih periode untuk membuka detail resmi');
    const timeline = el('div', 'siakadx-timeline', undefined, doc);
    periods.forEach((period) => timeline.appendChild(periodCard(doc, period)));
    surface.body.appendChild(timeline); root.appendChild(surface.element);
    try { chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SAVE_PARSED_DATA, payload: { key: 'advisingPeriods', value: periods, parserVersion: PARSER_VERSION } }); } catch (error) { logger.debug('Cache advising unavailable', error); }
  } else if (result.status === 'empty') {
    root.appendChild(StateIndicator({ state: 'empty', title: 'Belum ada periode bimbingan', message: 'Portal belum menyediakan data bimbingan akademik.' }));
  } else {
    root.appendChild(StateIndicator({ state: 'error', title: 'Data bimbingan tidak terbaca', message: result.issues?.[0]?.message || 'Gunakan tampilan asli portal.' }));
  }
  mountRoot(doc, root);
}

export async function mountAcademicAdvisingDetail(input) {
  const { document: doc, signal } = input;
  if (signal.aborted) return;
  const root = createRoot('academic-advising-detail', { className: 'siakadx-advising-detail' }, doc);
  const surface = makeSurface(doc, 'Detail Bimbingan', 'Konten tetap berasal dari halaman resmi dan tidak disimpan oleh SIAKAD-X');
  surface.body.appendChild(StateIndicator({ state: 'partial', title: 'Mode aman', message: 'SIAKAD-X hanya merapikan halaman ini. Isi percakapan, lampiran, dan formulir tidak dibaca atau disalin.' }));
  const guide = el('div', 'siakadx-guidance-grid', undefined, doc);
  guide.append(guideItem(doc, 'Periksa periode', 'Pastikan semester dan tahun ajaran sesuai.'), guideItem(doc, 'Gunakan form resmi', 'Kirim pesan atau berkas hanya melalui kontrol asli portal.'), guideItem(doc, 'Jaga privasi', 'Hindari menyimpan isi bimbingan di perangkat bersama.'));
  surface.body.appendChild(guide); root.appendChild(surface.element); mountRoot(doc, root);
}

function periodCard(doc, period) {
  const article = el('article', 'siakadx-timeline__item', undefined, doc);
  const marker = el('span', 'siakadx-timeline__marker', undefined, doc); marker.setAttribute('aria-hidden', 'true');
  const content = el('div', 'siakadx-timeline__content', undefined, doc);
  const header = el('div', 'siakadx-timeline__header', undefined, doc);
  const titles = el('div', '', undefined, doc); titles.append(el('h3', '', formatPeriod(period), doc), el('p', '', period.advisingStatus || 'Status tidak tersedia', doc));
  header.append(titles, statusBadge(doc, period.verificationStatus)); content.appendChild(header);
  if (period.detailUrl) { const link = el('a', 'siakadx-button siakadx-button--primary', 'Buka detail', doc); link.href = period.detailUrl; content.appendChild(link); }
  article.append(marker, content); return article;
}
function statusBadge(doc, value) { const verified = /verifik|setuju|valid/i.test(value || ''); return el('span', `siakadx-pill siakadx-pill--${verified ? 'success' : 'neutral'}`, value || 'Belum diketahui', doc); }
function stat(doc, label, value, hint) { const card = el('article', 'siakadx-stat-card', undefined, doc); card.append(el('span', 'siakadx-stat-card__label', label, doc), el('strong', 'siakadx-stat-card__value', value, doc), el('span', 'siakadx-stat-card__hint', hint, doc)); return card; }
function makeSurface(doc, title, subtitle) { const element = el('section', 'siakadx-surface', undefined, doc); const header = el('header', 'siakadx-surface__header', undefined, doc); const titles = el('div', '', undefined, doc); titles.append(el('h2', '', title, doc), el('p', '', subtitle, doc)); header.appendChild(titles); const body = el('div', 'siakadx-surface__body', undefined, doc); element.append(header, body); return { element, body }; }
function guideItem(doc, title, text) { const item = el('article', 'siakadx-guidance-card', undefined, doc); item.append(el('strong', '', title, doc), el('p', '', text, doc)); return item; }
function formatPeriod(period) { return [period?.semesterLabel, period?.academicYear].filter(Boolean).join(' · ') || 'Periode tidak diketahui'; }
function comparePeriods(a, b) { const yearA = Number(String(a.academicYear || '').match(/\d{4}/)?.[0] || 0); const yearB = Number(String(b.academicYear || '').match(/\d{4}/)?.[0] || 0); if (yearA !== yearB) return yearB - yearA; return String(b.semesterLabel || '').localeCompare(String(a.semesterLabel || ''), 'id', { numeric: true }); }
