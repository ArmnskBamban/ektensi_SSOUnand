/** Attendance Unand portal adapter. */

import { mountHomeDashboard } from './features/home-dashboard/index.js';
import { mountTakeAttendanceHelper } from './features/take-attendance-helper/index.js';
import { mountAttendanceReport } from './features/attendance-report/index.js';
import { mountAcademicAdvising, mountAcademicAdvisingDetail } from './features/academic-advising/index.js';
import { mountThesisAdvising } from './features/thesis-advising/index.js';
import { unmountRoots } from './ui/mount.js';
import { mountAppShell } from './ui/app-shell.js';
import { logger } from '../../shared/logging/logger.js';

export async function mountAttendanceUnand(input) {
  const { page, document: doc, location, signal, settings } = input;
  unmountRoots(doc);
  if (signal.aborted) return;

  mountAppShell(doc, page, settings, signal);
  logger.info('Mounting Attendance Unand feature', { page });

  const context = { document: doc, location, signal, settings };
  switch (page) {
    case 'HOME':
      await mountHomeDashboard(context);
      break;
    case 'TAKE_ATTENDANCE':
      await mountTakeAttendanceHelper(context);
      break;
    case 'ATTENDANCE_REPORT':
      await mountAttendanceReport(context);
      break;
    case 'ACADEMIC_ADVISING_LIST':
      await mountAcademicAdvising(context);
      break;
    case 'ACADEMIC_ADVISING_DETAIL':
      await mountAcademicAdvisingDetail(context);
      break;
    case 'THESIS_ADVISING':
      await mountThesisAdvising(context);
      break;
    default:
      logger.debug('No feature for page', { page });
  }
}

export { detectAttendanceUnandPage, ATTENDANCE_UNAND_ROUTES } from './routes.js';
export { detectPage } from './page-detector.js';
