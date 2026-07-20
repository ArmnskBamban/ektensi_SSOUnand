/** Safe visual workflow for the official attendance form. */

import { takeAttendanceSelectors } from '../../selectors/take-attendance.js';
import { queryFirst } from '../../../../shared/dom/query.js';
import { createRoot, mountRoot, el } from '../../ui/mount.js';
import { StateIndicator } from '../../../../shared/ui/StateIndicator.js';
import { logger } from '../../../../shared/logging/logger.js';

export async function mountTakeAttendanceHelper(input) {
  const { document: doc, signal } = input;
  if (signal.aborted) return;
  const form = queryFirst(doc, takeAttendanceSelectors.form);
  const camera = queryFirst(doc, takeAttendanceSelectors.cameraSelect);
  const video = queryFirst(doc, takeAttendanceSelectors.videoPreview);
  const hasLocationFields = Boolean(queryFirst(doc, takeAttendanceSelectors.latitudeField) && queryFirst(doc, takeAttendanceSelectors.longitudeField));
  if (form) form.setAttribute('data-siakadx-native-form', 'take-attendance');
  if (video) video.setAttribute('data-siakadx-scanner-preview', 'true');

  const [cameraPermission, locationPermission] = await Promise.all([permissionState('camera'), permissionState('geolocation')]);
  const root = createRoot('take-attendance-helper', { className: 'siakadx-attendance-workflow' }, doc);
  const intro = el('section', 'siakadx-attendance-hero', undefined, doc);
  const copy = el('div', '', undefined, doc); copy.append(el('span', 'siakadx-eyebrow', 'Presensi resmi Unand', doc), el('h2', '', 'Siapkan kamera dan lokasi', doc), el('p', '', 'SIAKAD-X memperjelas proses, tetapi tidak membaca QR, koordinat, token, atau mengirim presensi.', doc));
  const readiness = el('div', 'siakadx-readiness', undefined, doc); readiness.append(readinessItem(doc, 'Form', form ? 'Siap' : 'Tidak ditemukan', Boolean(form)), readinessItem(doc, 'Kamera', permissionLabel(cameraPermission, Boolean(camera)), cameraPermission !== 'denied' && Boolean(camera)), readinessItem(doc, 'Lokasi', permissionLabel(locationPermission, hasLocationFields), locationPermission !== 'denied' && hasLocationFields));
  intro.append(copy, readiness); root.appendChild(intro);

  if (!form) root.appendChild(StateIndicator({ state: 'error', title: 'Form resmi tidak ditemukan', message: 'Jangan lanjutkan presensi. Gunakan tampilan asli atau muat ulang halaman.' }));
  if (cameraPermission === 'denied' || locationPermission === 'denied') root.appendChild(StateIndicator({ state: 'partial', title: 'Izin browser diblokir', message: 'Buka ikon izin di address bar, izinkan kamera/lokasi, lalu muat ulang halaman.' }));

  const steps = el('section', 'siakadx-surface', undefined, doc); const header = el('header', 'siakadx-surface__header', undefined, doc); const titles = el('div', '', undefined, doc); titles.append(el('h2', '', 'Alur Presensi', doc), el('p', '', 'Empat langkah sebelum menekan tombol kirim portal', doc)); header.appendChild(titles); const body = el('div', 'siakadx-surface__body', undefined, doc); const list = el('ol', 'siakadx-workflow-steps', undefined, doc);
  [['1', 'Pilih kamera', 'Gunakan pilihan kamera yang tersedia pada form resmi.'], ['2', 'Pindai QR', 'Arahkan kamera ke QR dari pengajar. SIAKAD-X tidak membaca hasil scan.'], ['3', 'Pastikan lokasi', 'Biarkan portal mengisi lokasi melalui mekanisme resminya.'], ['4', 'Kirim sendiri', 'Periksa halaman, lalu tekan tombol resmi secara sadar.']].forEach(([number, title, text]) => { const item = el('li', '', undefined, doc); item.append(el('span', 'siakadx-workflow-steps__number', number, doc), el('div', '', undefined, doc)); item.lastChild.append(el('strong', '', title, doc), el('p', '', text, doc)); list.appendChild(item); });
  body.appendChild(list); steps.append(header, body); root.appendChild(steps);
  mountRoot(doc, root);

  logger.debug('Attendance helper mounted', { formFound: Boolean(form), cameraControlFound: Boolean(camera), locationFieldsFound: hasLocationFields, cameraPermission, locationPermission });
}

async function permissionState(name) {
  try {
    if (!navigator.permissions?.query) return 'unknown';
    const status = await navigator.permissions.query({ name });
    return status.state;
  } catch { return 'unknown'; }
}
function permissionLabel(state, controlExists) { if (!controlExists) return 'Kontrol tidak terdeteksi'; if (state === 'granted') return 'Izin diberikan'; if (state === 'denied') return 'Izin diblokir'; if (state === 'prompt') return 'Akan meminta izin'; return 'Kontrol tersedia'; }
function readinessItem(doc, label, value, ready) { const item = el('div', `siakadx-readiness__item ${ready ? 'is-ready' : 'is-warning'}`, undefined, doc); item.append(el('span', '', label, doc), el('strong', '', value, doc)); return item; }
