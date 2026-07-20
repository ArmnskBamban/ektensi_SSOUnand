/**
 * Default settings and constants for SIAKAD-X
 */

/** Schema version for storage migrations */
export const STORAGE_SCHEMA_VERSION = 1;

/** Extension name */
export const EXTENSION_NAME = 'SIAKAD-X';

/** Institution */
export const INSTITUTION_NAME = 'Universitas Andalas';

/** Primary language */
export const PRIMARY_LANGUAGE = 'id-ID';

/** Timezone */
export const TIMEZONE = 'Asia/Jakarta';

/** Parser version for cache invalidation */
export const PARSER_VERSION = '1.0.0';

/**
 * Default user settings
 * @type {import('../shared/storage/schema.js').SiakadXSettings}
 */
export const DEFAULT_SETTINGS = {
  enabled: true,
  enabledPortals: {
    attendanceUnand: true,
    portalAkademikUnand: false
  },
  theme: 'system',
  compactMode: false,
  highContrast: false,
  debugMode: false,
  attendanceThreshold: 75,
  attendanceReport: {
    rememberLastFilter: false,
    faculty: undefined,
    semester: undefined
  }
};

/**
 * Cache TTL in milliseconds
 */
export const CACHE_TTL = {
  academicSummary: 30 * 60 * 1000, // 30 minutes
  courseHistory: 30 * 60 * 1000,
  advisingPeriods: 60 * 60 * 1000, // 1 hour
  pageStatus: 5 * 60 * 1000 // 5 minutes
};

/**
 * Observer defaults for dynamic tables
 */
export const OBSERVER_DEFAULTS = {
  timeoutMs: 10000,
  settleMs: 250,
  minimumRows: 1
};

/**
 * Temporary grade scale — NOT official Unand scale until validated.
 * Labeled as estimation when used.
 * @type {Record<string, number>}
 */
export const DEFAULT_GRADE_SCALE = {
  A: 4.0,
  'A-': 3.75,
  'B+': 3.5,
  B: 3.0,
  'B-': 2.75,
  'C+': 2.5,
  C: 2.0,
  D: 1.0,
  E: 0.0
};