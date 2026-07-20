/**
 * Options page controller
 */

import { MESSAGE_TYPES } from '../shared/messaging/types.js';

const els = {
  enabled: /** @type {HTMLInputElement} */ (document.getElementById('enabled')),
  portalAttendance: /** @type {HTMLInputElement} */ (
    document.getElementById('portal-attendance')
  ),
  debugMode: /** @type {HTMLInputElement} */ (
    document.getElementById('debug-mode')
  ),
  theme: /** @type {HTMLSelectElement} */ (document.getElementById('theme')),
  compactMode: /** @type {HTMLInputElement} */ (
    document.getElementById('compact-mode')
  ),
  highContrast: /** @type {HTMLInputElement} */ (
    document.getElementById('high-contrast')
  ),
  attendanceThreshold: /** @type {HTMLInputElement} */ (
    document.getElementById('attendance-threshold')
  ),
  rememberFilter: /** @type {HTMLInputElement} */ (
    document.getElementById('remember-filter')
  ),
  btnClearCache: document.getElementById('btn-clear-cache'),
  btnClearAll: document.getElementById('btn-clear-all'),
  privacyMessage: document.getElementById('privacy-message')
};

/**
 * @param {string} type
 * @param {unknown} [payload]
 */
async function send(type, payload) {
  return chrome.runtime.sendMessage({ type, payload });
}

/**
 * @param {string} text
 */
function showMessage(text) {
  if (!els.privacyMessage) return;
  els.privacyMessage.hidden = false;
  els.privacyMessage.textContent = text;
  setTimeout(() => {
    els.privacyMessage.hidden = true;
  }, 3000);
}

async function loadSettings() {
  const res = await send(MESSAGE_TYPES.GET_SETTINGS);
  if (!res?.ok) return;

  const s = res.data;
  els.enabled.checked = Boolean(s.enabled);
  els.portalAttendance.checked = Boolean(s.enabledPortals?.attendanceUnand);
  els.debugMode.checked = Boolean(s.debugMode);
  els.theme.value = s.theme || 'system';
  els.compactMode.checked = Boolean(s.compactMode);
  els.highContrast.checked = Boolean(s.highContrast);
  els.attendanceThreshold.value = String(s.attendanceThreshold ?? 75);
  els.rememberFilter.checked = Boolean(s.attendanceReport?.rememberLastFilter);
}

/**
 * Persist current form values
 */
async function saveSettings() {
  const threshold = Number(els.attendanceThreshold.value);
  await send(MESSAGE_TYPES.UPDATE_SETTINGS, {
    enabled: els.enabled.checked,
    enabledPortals: {
      attendanceUnand: els.portalAttendance.checked
    },
    debugMode: els.debugMode.checked,
    theme: els.theme.value,
    compactMode: els.compactMode.checked,
    highContrast: els.highContrast.checked,
    attendanceThreshold:
      Number.isFinite(threshold) && threshold >= 0 && threshold <= 100
        ? threshold
        : 75,
    attendanceReport: {
      rememberLastFilter: els.rememberFilter.checked
    }
  });
}

// Bind change events
[
  els.enabled,
  els.portalAttendance,
  els.debugMode,
  els.theme,
  els.compactMode,
  els.highContrast,
  els.attendanceThreshold,
  els.rememberFilter
].forEach((el) => {
  el?.addEventListener('change', () => {
    saveSettings();
  });
});

els.btnClearCache?.addEventListener('click', async () => {
  const res = await send(MESSAGE_TYPES.CLEAR_CACHE);
  showMessage(res?.ok ? 'Cache dihapus.' : 'Gagal menghapus cache.');
});

els.btnClearAll?.addEventListener('click', async () => {
  const confirmed = window.confirm(
    'Hapus semua data lokal SIAKAD-X termasuk pengaturan? Tindakan ini tidak dapat dibatalkan.'
  );
  if (!confirmed) return;
  const res = await send(MESSAGE_TYPES.CLEAR_ALL_DATA);
  showMessage(res?.ok ? 'Semua data lokal dihapus.' : 'Gagal menghapus data.');
  if (res?.ok) await loadSettings();
});

loadSettings();