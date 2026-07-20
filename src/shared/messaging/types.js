/**
 * Messaging contract constants and helpers.
 * Do not send ad-hoc string message types.
 */

export const MESSAGE_TYPES = {
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  GET_PAGE_STATUS: 'GET_PAGE_STATUS',
  SAVE_PARSED_DATA: 'SAVE_PARSED_DATA',
  GET_CACHED_DATA: 'GET_CACHED_DATA',
  CLEAR_CACHE: 'CLEAR_CACHE',
  CLEAR_ALL_DATA: 'CLEAR_ALL_DATA',
  PING: 'PING'
};

/**
 * @typedef {Object} MessageRequest
 * @property {string} type
 * @property {string} [requestId]
 * @property {unknown} [payload]
 */

/**
 * @typedef {Object} MessageError
 * @property {string} code
 * @property {string} message
 */

/**
 * @typedef {Object} MessageResponse
 * @property {boolean} ok
 * @property {string} [requestId]
 * @property {unknown} [data]
 * @property {MessageError | null} [error]
 */

/**
 * Create a success response.
 * @param {string | undefined} requestId
 * @param {unknown} data
 * @returns {MessageResponse}
 */
export function okResponse(requestId, data) {
  return { ok: true, requestId, data, error: null };
}

/**
 * Create an error response.
 * @param {string | undefined} requestId
 * @param {string} code
 * @param {string} message
 * @returns {MessageResponse}
 */
export function errResponse(requestId, code, message) {
  return {
    ok: false,
    requestId,
    data: null,
    error: { code, message }
  };
}

/**
 * Validate that a message has a known type.
 * @param {unknown} message
 * @returns {message is MessageRequest}
 */
export function isValidMessage(message) {
  if (!message || typeof message !== 'object') return false;
  const m = /** @type {Record<string, unknown>} */ (message);
  if (typeof m.type !== 'string') return false;
  return Object.values(MESSAGE_TYPES).includes(/** @type {any} */ (m.type));
}