/**
 * Selectors for Attendance Unand Home page (/home)
 */

export const homeSelectors = {
  /** Verified stable ID for IPK/SKS summary table */
  cumulativeAcademicTable: ['#ipk-kumulatif-table'],
  /** Candidate tables for course history discovery */
  candidateTables: ['table'],
  contentArea: ['.content-wrapper', '.content', 'main']
};

/**
 * Expected headers for course history table (normalized lowercase).
 * Used for header-driven table discovery — do not use nth-child.
 */
export const COURSE_HISTORY_HEADERS = [
  'semester',
  'kode sem',
  'kode',
  'nama',
  'jenis',
  'bobot',
  'nilai',
  'sks',
  'krs',
  'krs status'
];

/**
 * Minimum header match score (0–1) to accept a table as course history.
 */
export const COURSE_HISTORY_MATCH_THRESHOLD = 0.6;