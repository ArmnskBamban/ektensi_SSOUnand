/**
 * Background service worker (Manifest V3).
 * Handles messaging, storage operations that need background context.
 * Do not keep critical state only in memory — SW can be killed anytime.
 */

import {
  MESSAGE_TYPES,
  isValidMessage,
  okResponse,
  errResponse
} from '../shared/messaging/types.js';
import {
  getSettings,
  updateSettings,
  getStorage,
  clearCache,
  clearAllData,
  setCache
} from '../shared/storage/index.js';
import { setDebugMode, logger } from '../shared/logging/logger.js';

/**
 * Initialize debug mode from stored settings.
 */
async function init() {
  try {
    const settings = await getSettings();
    setDebugMode(settings.debugMode);
    logger.info('SIAKAD-X background ready', {
      enabled: settings.enabled
    });
  } catch (err) {
    logger.error('Background init failed', {
      message: err instanceof Error ? err.message : String(err)
    });
  }
}

/**
 * Message handler
 * @param {unknown} message
 * @param {chrome.runtime.MessageSender} _sender
 * @param {(response: unknown) => void} sendResponse
 * @returns {boolean} true to keep channel open for async
 */
function handleMessage(message, _sender, sendResponse) {
  if (!isValidMessage(message)) {
    sendResponse(
      errResponse(undefined, 'INVALID_MESSAGE', 'Pesan tidak valid')
    );
    return false;
  }

  const { type, requestId, payload } = message;

  (async () => {
    try {
      switch (type) {
        case MESSAGE_TYPES.PING: {
          sendResponse(okResponse(requestId, { pong: true }));
          break;
        }

        case MESSAGE_TYPES.GET_SETTINGS: {
          const settings = await getSettings();
          sendResponse(okResponse(requestId, settings));
          break;
        }

        case MESSAGE_TYPES.UPDATE_SETTINGS: {
          if (!payload || typeof payload !== 'object') {
            sendResponse(
              errResponse(
                requestId,
                'INVALID_PAYLOAD',
                'Payload pengaturan tidak valid'
              )
            );
            break;
          }
          const settings = await updateSettings(
            /** @type {Partial<import('../shared/storage/schema.js').SiakadXSettings>} */ (
              payload
            )
          );
          setDebugMode(settings.debugMode);
          sendResponse(okResponse(requestId, settings));
          break;
        }

        case MESSAGE_TYPES.GET_CACHED_DATA: {
          const storage = await getStorage();
          // Return cache metadata only — not full raw rows with PII risk
          const cacheMeta = {};
          for (const [key, entry] of Object.entries(storage.cache)) {
            if (entry && typeof entry === 'object') {
              cacheMeta[key] = {
                updatedAt: entry.updatedAt,
                parserVersion: entry.parserVersion,
                hasValue: entry.value != null
              };
            }
          }
          sendResponse(okResponse(requestId, cacheMeta));
          break;
        }

        case MESSAGE_TYPES.SAVE_PARSED_DATA: {
          // Only accept known cache keys; never store sensitive fields
          const p = /** @type {Record<string, unknown>} */ (payload || {});
          const allowedKeys = [
            'academicSummary',
            'courseHistory',
            'advisingPeriods'
          ];
          const key = p.key;
          if (typeof key !== 'string' || !allowedKeys.includes(key)) {
            sendResponse(
              errResponse(
                requestId,
                'INVALID_PAYLOAD',
                'Kunci cache tidak diizinkan'
              )
            );
            break;
          }
          const parserVersion =
            typeof p.parserVersion === 'string' ? p.parserVersion : '1.0.0';
          const ok = await setCache(
            /** @type {any} */ (key),
            p.value,
            parserVersion
          );
          sendResponse(
            ok
              ? okResponse(requestId, { saved: true })
              : errResponse(
                  requestId,
                  'STORAGE_WRITE_FAILED',
                  'Gagal menyimpan cache'
                )
          );
          break;
        }

        case MESSAGE_TYPES.CLEAR_CACHE: {
          const ok = await clearCache();
          sendResponse(
            ok
              ? okResponse(requestId, { cleared: true })
              : errResponse(
                  requestId,
                  'STORAGE_WRITE_FAILED',
                  'Gagal menghapus cache'
                )
          );
          break;
        }

        case MESSAGE_TYPES.CLEAR_ALL_DATA: {
          const ok = await clearAllData();
          sendResponse(
            ok
              ? okResponse(requestId, { cleared: true })
              : errResponse(
                  requestId,
                  'STORAGE_WRITE_FAILED',
                  'Gagal menghapus data'
                )
          );
          break;
        }

        case MESSAGE_TYPES.GET_PAGE_STATUS: {
          // Page status is owned by content script; background just acknowledges
          sendResponse(
            okResponse(requestId, {
              note: 'Page status disediakan oleh content script'
            })
          );
          break;
        }

        default: {
          sendResponse(
            errResponse(
              requestId,
              'UNKNOWN_TYPE',
              `Tipe pesan tidak dikenal: ${type}`
            )
          );
        }
      }
    } catch (err) {
      logger.error('Message handler error', {
        type,
        message: err instanceof Error ? err.message : String(err)
      });
      sendResponse(
        errResponse(
          requestId,
          'HANDLER_ERROR',
          'Terjadi kesalahan saat memproses pesan'
        )
      );
    }
  })();

  return true; // async response
}

chrome.runtime.onMessage.addListener(handleMessage);

// Open options page from action context menu if needed later
chrome.runtime.onInstalled.addListener((details) => {
  logger.info('Extension installed/updated', { reason: details.reason });
  init();
});

init();