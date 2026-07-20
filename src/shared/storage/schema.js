/** Storage schema definitions for SIAKAD-X v1. */

/** @typedef {'system' | 'light' | 'dark'} ThemePreference */
/**
 * @typedef {Object} AttendanceReportPrefs
 * @property {boolean} rememberLastFilter
 * @property {string | undefined} faculty
 * @property {string | undefined} semester
 */
/**
 * @typedef {Object} SiakadXSettings
 * @property {boolean} enabled
 * @property {{ attendanceUnand: boolean, portalAkademikUnand: boolean }} enabledPortals
 * @property {ThemePreference} theme
 * @property {boolean} compactMode
 * @property {boolean} highContrast
 * @property {boolean} debugMode
 * @property {number} attendanceThreshold
 * @property {AttendanceReportPrefs} attendanceReport
 */
/** @template T @typedef {{ value: T, updatedAt: string, parserVersion: string }} CacheEntry */
/**
 * @typedef {Object} SiakadXStorageV1
 * @property {1} schemaVersion
 * @property {SiakadXSettings} settings
 * @property {{
 *  academicSummary?: CacheEntry<import('../../portals/attendance-unand/parsers/types.js').CumulativeAcademicSummary>,
 *  courseHistory?: CacheEntry<import('../../portals/attendance-unand/parsers/types.js').CourseHistoryRecord[]>,
 *  advisingPeriods?: CacheEntry<import('../../portals/attendance-unand/parsers/types.js').AcademicAdvisingPeriod[]>
 * }} cache
 * @property {{ dismissedNotices: string[] }} ui
 */

export function createDefaultStorage() {
  return {
    schemaVersion: 1,
    settings: {
      enabled: true,
      enabledPortals: { attendanceUnand: true, portalAkademikUnand: false },
      theme: 'system',
      compactMode: false,
      highContrast: false,
      debugMode: false,
      attendanceThreshold: 75,
      attendanceReport: { rememberLastFilter: false, faculty: undefined, semester: undefined }
    },
    cache: {},
    ui: { dismissedNotices: [] }
  };
}

export function isValidStorageV1(value) {
  if (!value || typeof value !== 'object') return false;
  const data = /** @type {Record<string, unknown>} */ (value);
  if (data.schemaVersion !== 1 || !data.settings || typeof data.settings !== 'object' || !data.cache || typeof data.cache !== 'object') return false;
  const settings = /** @type {Record<string, unknown>} */ (data.settings);
  return typeof settings.enabled === 'boolean' && ['system', 'light', 'dark'].includes(String(settings.theme));
}

export const FORBIDDEN_STORAGE_KEYS = [
  'password', 'pass', 'token', '_token', 'access_token', 'refresh_token',
  'cookie', 'authorization', 'session', 'latitude', 'longitude', 'hasilscan',
  'qr', 'nim', 'email', 'studentid', 'student_id', 'studentname', 'student_name'
];
