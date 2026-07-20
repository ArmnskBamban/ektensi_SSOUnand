import { describe, it, expect } from 'vitest';
import { detectAttendanceUnandPage, isSupportedPage } from '../../src/portals/attendance-unand/routes.js';
import { detectPortalByOrigin } from '../../src/config/portals.js';
import { parseNumber, parseGradeWeight } from '../../src/portals/attendance-unand/normalizers/number.js';
import { containsForbiddenStorageData } from '../../src/shared/storage/index.js';
import { redact } from '../../src/shared/logging/logger.js';

describe('routing and safety helpers', () => {
  it('detects every verified route including advising detail', () => {
    expect(detectAttendanceUnandPage('/home')).toBe('HOME');
    expect(detectAttendanceUnandPage('/mahasiswa/pa/bimbingan-pa-detail-bimbingan-mhs/123')).toBe('ACADEMIC_ADVISING_DETAIL');
    expect(isSupportedPage('ACADEMIC_ADVISING_DETAIL')).toBe(true);
    expect(detectPortalByOrigin('https://attendance.unand.ac.id')).toBe('ATTENDANCE_UNAND');
  });

  it('normalizes Indonesian numbers safely', () => {
    expect(parseNumber('3,75')).toBe(3.75);
    expect(parseNumber('1.234,5')).toBe(1234.5);
    expect(parseGradeWeight('5')).toBeNull();
  });

  it('rejects forbidden storage keys recursively', () => {
    expect(containsForbiddenStorageData({ safe: [{ nested: { token: 'secret' } }] })).toBe(true);
    expect(containsForbiddenStorageData([{ courseCode: 'IF101', grade: 'A' }])).toBe(false);
  });

  it('redacts sensitive data embedded in strings', () => {
    const result = redact('NIM 2411533003 email test@student.unand.ac.id token eyJabc.def.ghi');
    expect(result).not.toContain('2411533003');
    expect(result).not.toContain('test@student.unand.ac.id');
    expect(result).not.toContain('eyJabc.def.ghi');
  });
});
