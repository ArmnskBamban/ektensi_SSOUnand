/** Honest enhancement for Bimbingan TA. */

import { createRoot, mountRoot, el } from '../../ui/mount.js';
import { queryFirst } from '../../../../shared/dom/query.js';
import { commonSelectors } from '../../selectors/common.js';
import { StateIndicator } from '../../../../shared/ui/StateIndicator.js';

export function detectThesisAdvisingState(doc) {
  const content = queryFirst(doc, commonSelectors.contentRoot);
  if (!content) return 'ERROR';
  const nativeText = Array.from(content.childNodes).filter((node) => !(node instanceof Element) || !node.closest?.('[data-siakadx-root]')).map((node) => node.textContent || '').join(' ').toLowerCase();
  const hasDataStructure = content.querySelectorAll('table tbody tr, form, .card, .timeline').length > 0;
  if (hasDataStructure) return 'AVAILABLE';
  if (['belum ada', 'tidak ada data', 'no data', 'belum tersedia'].some((hint) => nativeText.includes(hint))) return 'EMPTY';
  return 'UNSUPPORTED_STRUCTURE';
}

export async function mountThesisAdvising(input) {
  const { document: doc, signal } = input;
  if (signal.aborted) return;
  const state = detectThesisAdvisingState(doc);
  const root = createRoot('thesis-advising', { className: 'siakadx-thesis' }, doc);
  const surface = el('section', 'siakadx-surface', undefined, doc); const header = el('header', 'siakadx-surface__header', undefined, doc); const titles = el('div', '', undefined, doc); titles.append(el('h2', '', 'Bimbingan Tugas Akhir', doc), el('p', '', 'Status halaman resmi ditampilkan tanpa membuat data palsu', doc)); header.appendChild(titles); const body = el('div', 'siakadx-surface__body', undefined, doc);
  if (state === 'AVAILABLE') body.appendChild(StateIndicator({ state: 'partial', title: 'Konten terdeteksi', message: 'Konten resmi tersedia di bawah panel ini. SIAKAD-X belum menyalin isi bimbingan agar privasi tetap terjaga.' }));
  else if (state === 'EMPTY') body.appendChild(StateIndicator({ state: 'empty', title: 'Belum ada bimbingan TA', message: 'Portal belum menampilkan data bimbingan tugas akhir.' }));
  else if (state === 'ERROR') body.appendChild(StateIndicator({ state: 'error', message: 'Area konten portal tidak ditemukan.' }));
  else body.appendChild(StateIndicator({ state: 'unsupported', title: 'Struktur belum dikenali', message: 'Gunakan konten asli di bawah panel ini. Tidak ada data yang dibuat-buat.' }));
  const guide = el('div', 'siakadx-guidance-grid', undefined, doc); guide.append(guideItem(doc, 'Dokumen', 'Pastikan versi berkas dan nama file mudah dikenali.'), guideItem(doc, 'Catatan', 'Rangkum arahan dosen setelah pertemuan.'), guideItem(doc, 'Privasi', 'SIAKAD-X tidak menyimpan isi bimbingan.')); body.appendChild(guide); surface.append(header, body); root.appendChild(surface); mountRoot(doc, root);
}
function guideItem(doc, title, text) { const card = el('article', 'siakadx-guidance-card', undefined, doc); card.append(el('strong', '', title, doc), el('p', '', text, doc)); return card; }
