/** Theme and density controller. */

import { getSettings, updateSettings } from '../storage/index.js';

export async function getThemePreference() {
  try {
    const settings = await getSettings();
    return settings.theme || 'system';
  } catch {
    return 'system';
  }
}

export function resolveActualTheme(pref) {
  if (pref === 'system') {
    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref === 'dark' ? 'dark' : 'light';
}

export function applyTheme(doc, pref) {
  doc.documentElement.setAttribute('data-siakadx-theme', resolveActualTheme(pref));
  doc.documentElement.setAttribute('data-siakadx-theme-preference', pref);
}

export function applyInterfaceSettings(doc, settings) {
  applyTheme(doc, settings.theme || 'system');
  doc.documentElement.classList.toggle('siakadx-compact', Boolean(settings.compactMode));
  doc.documentElement.classList.toggle('siakadx-high-contrast', Boolean(settings.highContrast));
}

export function onSystemThemeChange(callback) {
  const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  if (!media) return () => {};
  const handler = (event) => callback(event.matches ? 'dark' : 'light');
  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
}

export async function setTheme(doc, pref) {
  await updateSettings({ theme: pref });
  applyTheme(doc, pref);
}
