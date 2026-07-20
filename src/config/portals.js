/**
 * Portal registry for SIAKAD-X
 * Only Attendance Unand is fully supported in MVP.
 * Other portals are registered for discovery/status only.
 */

/**
 * @typedef {'LOGIN_GATEWAY' | 'SUPPORTED_ACADEMIC_PORTAL' | 'DISCOVERY_PENDING'} PortalRole
 */

/**
 * @typedef {Object} PortalDefinition
 * @property {string} id
 * @property {string} name
 * @property {readonly string[]} origins
 * @property {PortalRole} role
 * @property {boolean} enabledByDefault
 */

/** @type {Readonly<Record<string, PortalDefinition>>} */
export const PORTALS = {
  ssoUnand: {
    id: 'sso-unand',
    name: 'SSO Unand',
    origins: ['https://sso.unand.ac.id'],
    role: 'LOGIN_GATEWAY',
    enabledByDefault: false
  },
  attendanceUnand: {
    id: 'attendance-unand',
    name: 'Attendance Unand',
    origins: ['https://attendance.unand.ac.id'],
    role: 'SUPPORTED_ACADEMIC_PORTAL',
    enabledByDefault: true
  },
  portalAkademikUnand: {
    id: 'portal-akademik-unand',
    name: 'Portal Akademik Universitas Andalas',
    origins: ['http://portal.unand.ac.id'],
    role: 'DISCOVERY_PENDING',
    enabledByDefault: false
  }
};

/**
 * @typedef {'SSO_UNAND' | 'ATTENDANCE_UNAND' | 'PORTAL_AKADEMIK_UNAND' | 'UNKNOWN_PORTAL'} PortalId
 */

/**
 * Detect which portal the current origin belongs to.
 * @param {string} origin - location.origin
 * @returns {PortalId}
 */
export function detectPortalByOrigin(origin) {
  if (!origin || typeof origin !== 'string') {
    return 'UNKNOWN_PORTAL';
  }

  const normalized = origin.replace(/\/$/, '');

  if (PORTALS.attendanceUnand.origins.includes(normalized)) {
    return 'ATTENDANCE_UNAND';
  }

  if (PORTALS.ssoUnand.origins.includes(normalized)) {
    return 'SSO_UNAND';
  }

  if (PORTALS.portalAkademikUnand.origins.includes(normalized)) {
    return 'PORTAL_AKADEMIK_UNAND';
  }

  return 'UNKNOWN_PORTAL';
}

/**
 * Get portal definition by id string.
 * @param {string} portalId
 * @returns {PortalDefinition | null}
 */
export function getPortalById(portalId) {
  const entries = Object.values(PORTALS);
  return entries.find((p) => p.id === portalId) ?? null;
}

/**
 * List portals that are academic and enabled by default for MVP.
 * @returns {PortalDefinition[]}
 */
export function getDefaultEnabledPortals() {
  return Object.values(PORTALS).filter((p) => p.enabledByDefault);
}