/**
 * Popup controller — status, enable toggle, open options.
 */

import { MESSAGE_TYPES } from '../shared/messaging/types.js';

const statusBadge = document.getElementById('status-badge');
const portalStatus = document.getElementById('portal-status');
const enabledToggle = /** @type {HTMLInputElement} */ (
  document.getElementById('enabled-toggle')
);
const btnOptions = document.getElementById('btn-options');
const btnReload = document.getElementById('btn-reload');

/**
 * @param {string} type
 * @param {unknown} [payload]
 */
async function send(type, payload) {
  return chrome.runtime.sendMessage({ type, payload });
}

async function load() {
  try {
    const res = await send(MESSAGE_TYPES.GET_SETTINGS);
    if (!res?.ok) {
      setStatus('error', 'Gagal memuat');
      return;
    }

    const settings = res.data;
    enabledToggle.checked = Boolean(settings.enabled);

    if (settings.enabled) {
      setStatus('on', 'Aktif');
    } else {
      setStatus('off', 'Nonaktif');
    }

    // Active tab URL is available without "tabs" permission for the active tab
    // when using chrome.tabs.query from the popup in many Chromium builds.
    // Fallback gracefully if unavailable.
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      const tab = tabs?.[0];
      if (tab?.url) {
        const url = new URL(tab.url);
        if (url.hostname === 'attendance.unand.ac.id') {
          portalStatus.textContent = 'Attendance Unand';
        } else if (url.hostname === 'sso.unand.ac.id') {
          portalStatus.textContent = 'SSO Unand (gerbang login)';
        } else if (url.hostname === 'portal.unand.ac.id') {
          portalStatus.textContent = 'Portal Akademik (belum didukung)';
        } else {
          portalStatus.textContent = 'Bukan portal yang didukung';
        }
      } else {
        portalStatus.textContent = 'Buka portal Attendance Unand';
      }
    } catch {
      portalStatus.textContent = 'Buka portal Attendance Unand';
    }
  } catch {
    setStatus('error', 'Error');
    portalStatus.textContent = '—';
  }
}

/**
 * @param {'on' | 'off' | 'idle' | 'error'} kind
 * @param {string} text
 */
function setStatus(kind, text) {
  statusBadge.textContent = text;
  statusBadge.className = 'popup__badge';
  if (kind === 'on') statusBadge.classList.add('popup__badge--on');
  if (kind === 'off') statusBadge.classList.add('popup__badge--off');
}

enabledToggle.addEventListener('change', async () => {
  const res = await send(MESSAGE_TYPES.UPDATE_SETTINGS, {
    enabled: enabledToggle.checked
  });
  if (res?.ok) {
    setStatus(enabledToggle.checked ? 'on' : 'off', enabledToggle.checked ? 'Aktif' : 'Nonaktif');
  }
});

btnOptions?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

btnReload?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.reload(tab.id);
    window.close();
  }
});

load();