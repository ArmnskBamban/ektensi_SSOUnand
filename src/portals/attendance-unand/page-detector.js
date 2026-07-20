/**
 * Page detector for Attendance Unand.
 * Combines pathname detection with DOM marker validation.
 */

import {
  detectAttendanceUnandPage,
  isSupportedPage,
  PAGE_LABELS
} from './routes.js';
import { commonSelectors } from './selectors/common.js';
import { queryFirst } from '../../shared/dom/query.js';

/**
 * @typedef {Object} PageDetectionResult
 * @property {import('./routes.js').AttendanceUnandPage} page
 * @property {string} label
 * @property {boolean} isSupported
 * @property {boolean} domValid
 * @property {string[]} markersFound
 * @property {string | null} reason
 */

/**
 * Validate that the document looks like a real Attendance Unand page
 * (not a login redirect or error page).
 *
 * @param {Document} document
 * @returns {{ valid: boolean, markers: string[] }}
 */
export function validateAttendanceDom(document) {
  if (!document || !document.body) {
    return { valid: false, markers: [] };
  }

  const markers = [];

  const header = queryFirst(document, commonSelectors.header);
  if (header) markers.push('header');

  const sidebar = queryFirst(document, commonSelectors.sidebar);
  if (sidebar) markers.push('sidebar');

  const content = queryFirst(document, commonSelectors.contentRoot);
  if (content) markers.push('content');

  // At least one layout marker should be present for AdminLTE-like layout
  const valid = markers.length >= 1;

  return { valid, markers };
}

/**
 * Full page detection: pathname + DOM validation.
 *
 * @param {{ location: Location | { pathname: string, origin: string }, document: Document }} input
 * @returns {PageDetectionResult}
 */
export function detectPage(input) {
  const { location, document } = input;

  if (!location || !document) {
    return {
      page: 'UNKNOWN',
      label: PAGE_LABELS.UNKNOWN,
      isSupported: false,
      domValid: false,
      markersFound: [],
      reason: 'Missing location or document'
    };
  }

  const page = detectAttendanceUnandPage(location.pathname);
  const { valid: domValid, markers } = validateAttendanceDom(document);
  const supported = isSupportedPage(page);

  let reason = null;
  if (page === 'UNKNOWN') {
    reason = 'Pathname tidak cocok dengan route terverifikasi';
  } else if (!domValid) {
    reason = 'Layout portal tidak terdeteksi (mungkin redirect login atau error)';
  }

  return {
    page,
    label: PAGE_LABELS[page],
    isSupported: supported && domValid,
    domValid,
    markersFound: markers,
    reason
  };
}