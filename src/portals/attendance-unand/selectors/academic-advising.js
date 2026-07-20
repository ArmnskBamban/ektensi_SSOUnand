/**
 * Selectors for Bimbingan Akademik pages
 */

export const advisingSelectors = {
  table: ['#table-bimbingan'],
  detailLink: ['a', 'a[href*="bimbingan"]']
};

/**
 * Header aliases for academic advising list table
 */
export const ADVISING_HEADER_ALIASES = {
  rowNumber: ['no', 'nomor'],
  status: ['status bimbingan', 'status'],
  semester: ['semester', 'smt'],
  year: ['tahun', 'tahun ajaran'],
  verification: ['verifikasi', 'status verifikasi']
};

/**
 * Expected primary headers (for match scoring)
 */
export const ADVISING_EXPECTED_HEADERS = [
  'no',
  'status bimbingan',
  'semester',
  'tahun',
  'verifikasi'
];