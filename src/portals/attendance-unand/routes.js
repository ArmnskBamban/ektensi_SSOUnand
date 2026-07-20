/**
 * Verified route registry for Attendance Unand.
 * Do not scatter pathname literals across the codebase.
 */

export const ATTENDANCE_UNAND_ROUTES = {
  home: '/home',
  takeAttendance: '/mahasiswa/absensi/ambilabsensi',
  attendanceReport: '/mahasiswa/absensi/report',
  academicAdvisingList: '/mahasiswa/pa/bimbingan-pa-tahun-ajaran-mhs',
  academicAdvisingDetailPrefix: '/mahasiswa/pa/bimbingan-pa-detail-bimbingan-mhs',
  thesisAdvising: '/mahasiswa/bimbingan-ta'
};

/**
 * @typedef {'HOME' | 'TAKE_ATTENDANCE' | 'ATTENDANCE_REPORT' | 'ACADEMIC_ADVISING_LIST' | 'ACADEMIC_ADVISING_DETAIL' | 'THESIS_ADVISING' | 'UNKNOWN'} AttendanceUnandPage
 */

/**
 * Detect Attendance Unand page from pathname.
 * Must be paired with DOM validation before mounting UI.
 *
 * @param {string} pathname
 * @returns {AttendanceUnandPage}
 */
export function detectAttendanceUnandPage(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return 'UNKNOWN';
  }

  // Normalize: strip trailing slash except for root
  let path = pathname;
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  if (path === ATTENDANCE_UNAND_ROUTES.home) {
    return 'HOME';
  }

  if (path === ATTENDANCE_UNAND_ROUTES.takeAttendance) {
    return 'TAKE_ATTENDANCE';
  }

  if (path === ATTENDANCE_UNAND_ROUTES.attendanceReport) {
    return 'ATTENDANCE_REPORT';
  }

  if (path === ATTENDANCE_UNAND_ROUTES.academicAdvisingList) {
    return 'ACADEMIC_ADVISING_LIST';
  }

  if (path.startsWith(ATTENDANCE_UNAND_ROUTES.academicAdvisingDetailPrefix)) {
    return 'ACADEMIC_ADVISING_DETAIL';
  }

  if (path === ATTENDANCE_UNAND_ROUTES.thesisAdvising) {
    return 'THESIS_ADVISING';
  }

  return 'UNKNOWN';
}

/**
 * Human-readable page labels (Indonesian)
 * @type {Record<AttendanceUnandPage, string>}
 */
export const PAGE_LABELS = {
  HOME: 'Beranda',
  TAKE_ATTENDANCE: 'Ambil Absensi',
  ATTENDANCE_REPORT: 'Laporan Kehadiran',
  ACADEMIC_ADVISING_LIST: 'Bimbingan Akademik',
  ACADEMIC_ADVISING_DETAIL: 'Detail Bimbingan Akademik',
  THESIS_ADVISING: 'Bimbingan TA',
  UNKNOWN: 'Halaman tidak dikenali'
};

/**
 * Pages that have active SIAKAD-X features in MVP
 * @type {readonly AttendanceUnandPage[]}
 */
export const SUPPORTED_PAGES = [
  'HOME',
  'TAKE_ATTENDANCE',
  'ATTENDANCE_REPORT',
  'ACADEMIC_ADVISING_LIST',
  'ACADEMIC_ADVISING_DETAIL',
  'THESIS_ADVISING'
];

/**
 * @param {AttendanceUnandPage} page
 * @returns {boolean}
 */
export function isSupportedPage(page) {
  return SUPPORTED_PAGES.includes(page);
}