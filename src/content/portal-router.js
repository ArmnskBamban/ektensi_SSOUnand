/**
 * Routes content script to the correct portal adapter.
 */

import { detectPortalByOrigin } from '../config/portals.js';
import { detectPage } from '../portals/attendance-unand/page-detector.js';
import { mountAttendanceUnand } from '../portals/attendance-unand/index.js';
import { logger } from '../shared/logging/logger.js';

/**
 * @typedef {Object} RouterResult
 * @property {string} portalId
 * @property {string} page
 * @property {boolean} mounted
 * @property {string | null} reason
 */

/**
 * Detect portal + page and mount appropriate features.
 *
 * @param {{ document: Document, location: Location, signal: AbortSignal, settings: import('../shared/storage/schema.js').SiakadXSettings }} input
 * @returns {Promise<RouterResult>}
 */
export async function routeAndMount(input) {
  const { document, location, signal, settings } = input;

  if (!settings.enabled) {
    return {
      portalId: 'DISABLED',
      page: 'UNKNOWN',
      mounted: false,
      reason: 'SIAKAD-X dinonaktifkan'
    };
  }

  const portalId = detectPortalByOrigin(location.origin);

  if (portalId === 'ATTENDANCE_UNAND') {
    if (!settings.enabledPortals?.attendanceUnand) {
      return {
        portalId,
        page: 'UNKNOWN',
        mounted: false,
        reason: 'Portal Attendance Unand dinonaktifkan di pengaturan'
      };
    }

    const detection = detectPage({ location, document });
    logger.debug('Page detected', {
      page: detection.page,
      domValid: detection.domValid,
      markers: detection.markersFound
    });

    if (!detection.isSupported) {
      return {
        portalId,
        page: detection.page,
        mounted: false,
        reason: detection.reason || 'Halaman tidak didukung'
      };
    }

    try {
      await mountAttendanceUnand({
        page: detection.page,
        document,
        location,
        signal,
        settings
      });
      return {
        portalId,
        page: detection.page,
        mounted: true,
        reason: null
      };
    } catch (err) {
      logger.error('Mount Attendance Unand failed', {
        message: err instanceof Error ? err.message : String(err)
      });
      return {
        portalId,
        page: detection.page,
        mounted: false,
        reason: 'Gagal memasang fitur SIAKAD-X'
      };
    }
  }

  if (portalId === 'SSO_UNAND') {
    // MVP: no redesign of SSO; detect only
    return {
      portalId,
      page: 'SSO',
      mounted: false,
      reason: 'SSO Unand hanya gerbang login — tidak dimodifikasi di MVP'
    };
  }

  if (portalId === 'PORTAL_AKADEMIK_UNAND') {
    return {
      portalId,
      page: 'DISCOVERY_PENDING',
      mounted: false,
      reason: 'Portal Akademik belum dipetakan (DISCOVERY_PENDING)'
    };
  }

  return {
    portalId: 'UNKNOWN_PORTAL',
    page: 'UNKNOWN',
    mounted: false,
    reason: 'Portal tidak dikenali'
  };
}