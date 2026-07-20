/**
 * Selectors for Report Absensi page
 */

export const attendanceReportSelectors = {
  form: ['#absensi-filter-form'],
  facultySelect: ['#fakultas', 'select[name="fakultas"]'],
  semesterSelect: ['#smt', 'select[name="smt"]'],
  submitButton: [
    '#absensi-filter-form button[type="submit"]',
    '#absensi-filter-form input[type="submit"]',
    'button[type="submit"]'
  ],
  resetLink: [
    '#absensi-filter-form a[href*="report"]',
    'a[href*="/mahasiswa/absensi/report"]'
  ],
  /** Result table — structure not yet verified; discovery only */
  resultTable: ['table', '.table']
};

/**
 * Report page state machine
 * @typedef {'FILTER_REQUIRED' | 'LOADING' | 'RESULT_READY' | 'EMPTY_RESULT' | 'PARTIAL' | 'ERROR'} AttendanceReportState
 */