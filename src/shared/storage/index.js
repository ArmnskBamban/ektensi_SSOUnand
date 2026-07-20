/** Safe chrome.storage.local wrapper. */

import { createDefaultStorage, isValidStorageV1, FORBIDDEN_STORAGE_KEYS } from './schema.js';
import { STORAGE_SCHEMA_VERSION } from '../../config/defaults.js';
import { logger } from '../logging/logger.js';

const STORAGE_KEY = 'siakadx';
const forbiddenSet = new Set(FORBIDDEN_STORAGE_KEYS.map((key) => key.toLowerCase()));

export async function getStorage() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const data = result[STORAGE_KEY];
    if (!data) {
      const defaults = createDefaultStorage();
      await setStorage(defaults);
      return defaults;
    }
    if (!isValidStorageV1(data)) return migrateStorage(data);
    return data;
  } catch (error) {
    logger.error('STORAGE_READ_FAILED', error);
    return createDefaultStorage();
  }
}

export async function setStorage(data) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
    return true;
  } catch (error) {
    logger.error('STORAGE_WRITE_FAILED', error);
    return false;
  }
}

export async function getSettings() {
  return (await getStorage()).settings;
}

export async function updateSettings(partial) {
  const storage = await getStorage();
  const threshold = Number(partial.attendanceThreshold ?? storage.settings.attendanceThreshold);
  const theme = partial.theme && ['system', 'light', 'dark'].includes(partial.theme) ? partial.theme : storage.settings.theme;
  storage.settings = {
    ...storage.settings,
    ...partial,
    theme,
    attendanceThreshold: Number.isFinite(threshold) ? Math.min(100, Math.max(0, threshold)) : 75,
    enabledPortals: { ...storage.settings.enabledPortals, ...(partial.enabledPortals || {}) },
    attendanceReport: { ...storage.settings.attendanceReport, ...(partial.attendanceReport || {}) }
  };
  await setStorage(storage);
  return storage.settings;
}

export async function getCache(key, ttlMs) {
  const entry = (await getStorage()).cache[key];
  if (!entry?.updatedAt) return null;
  const age = Date.now() - Date.parse(entry.updatedAt);
  if (!Number.isFinite(age) || age < 0 || age > ttlMs) return null;
  return entry.value;
}

export function containsForbiddenStorageData(value, depth = 0, seen = new WeakSet()) {
  if (depth > 12 || value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => containsForbiddenStorageData(item, depth + 1, seen));
  return Object.entries(value).some(([key, child]) => forbiddenSet.has(key.toLowerCase().replace(/[^a-z0-9_]/g, '')) || containsForbiddenStorageData(child, depth + 1, seen));
}

export async function setCache(key, value, parserVersion) {
  if (containsForbiddenStorageData(value)) {
    logger.warn('Refusing to cache data with a forbidden field', { cacheKey: key });
    return false;
  }
  const storage = await getStorage();
  storage.cache[key] = { value, updatedAt: new Date().toISOString(), parserVersion };
  return setStorage(storage);
}

export async function clearCache() {
  const storage = await getStorage(); storage.cache = {}; return setStorage(storage);
}

export async function clearAllData() {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    return setStorage(createDefaultStorage());
  } catch (error) {
    logger.error('STORAGE_CLEAR_FAILED', error); return false;
  }
}

async function migrateStorage(data) {
  const defaults = createDefaultStorage();
  if (data && typeof data === 'object') {
    const old = /** @type {Record<string, unknown>} */ (data);
    if (old.settings && typeof old.settings === 'object') {
      const settings = /** @type {Record<string, unknown>} */ (old.settings);
      if (typeof settings.enabled === 'boolean') defaults.settings.enabled = settings.enabled;
      if (['system', 'light', 'dark'].includes(String(settings.theme))) defaults.settings.theme = /** @type {import('./schema.js').ThemePreference} */ (settings.theme);
      if (typeof settings.debugMode === 'boolean') defaults.settings.debugMode = settings.debugMode;
      if (typeof settings.compactMode === 'boolean') defaults.settings.compactMode = settings.compactMode;
      if (typeof settings.highContrast === 'boolean') defaults.settings.highContrast = settings.highContrast;
      if (typeof settings.attendanceThreshold === 'number') defaults.settings.attendanceThreshold = Math.min(100, Math.max(0, settings.attendanceThreshold));
    }
  }
  defaults.schemaVersion = STORAGE_SCHEMA_VERSION;
  await setStorage(defaults);
  logger.info('Storage migrated', { schemaVersion: STORAGE_SCHEMA_VERSION });
  return defaults;
}

export function onSettingsChange(callback) {
  function handler(changes, areaName) {
    if (areaName !== 'local' || !changes[STORAGE_KEY]) return;
    const next = changes[STORAGE_KEY].newValue;
    if (isValidStorageV1(next)) callback(next.settings);
  }
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
