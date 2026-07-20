import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { parseCumulativeAcademic } from '../../src/portals/attendance-unand/parsers/cumulative-academic-parser.js';
import { parseCourseHistory } from '../../src/portals/attendance-unand/parsers/course-history-parser.js';
import { parseAcademicAdvisingList, sanitizeDetailUrl } from '../../src/portals/attendance-unand/parsers/academic-advising-parser.js';
import { parseAttendanceReport, findAttendanceReportTable } from '../../src/portals/attendance-unand/parsers/attendance-report-parser.js';

const fixture = (name) => new JSDOM(readFileSync(resolve(`tests/fixtures/attendance-unand/${name}`), 'utf8'), { url: 'https://attendance.unand.ac.id/home' }).window.document;

describe('Attendance Unand parsers', () => {
  it('parses horizontal IPS/IPK/SKS table', () => {
    const result = parseCumulativeAcademic(fixture('home-ready.html'));
    expect(result.status).toBe('success');
    expect(result.data.currentSemester).toBe(4);
    expect(result.data.currentIps).toBeCloseTo(3.8);
    expect(result.data.currentIpk).toBeCloseTo(3.59);
    expect(result.data.passedCredits).toBe(83);
    expect(result.data.semesters).toHaveLength(4);
  });

  it('returns empty for placeholder table', () => {
    expect(parseCumulativeAcademic(fixture('home-empty.html')).status).toBe('empty');
  });

  it('parses course history by header names', () => {
    const result = parseCourseHistory(fixture('home-ready.html'));
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(3);
    expect(result.data[0]).toMatchObject({ courseCode: 'IF101', credits: 3, gradeWeight: 4, semesterNumber: 1 });
  });

  it('survives reordered course headers', () => {
    const result = parseCourseHistory(fixture('home-reordered-headers.html'));
    expect(result.status).toBe('success');
    expect(result.data[0]).toMatchObject({ courseCode: 'IF202', courseName: 'Algoritma', gradeLabel: 'A-', credits: 3 });
  });

  it('parses advising list and only keeps internal detail routes', () => {
    const result = parseAcademicAdvisingList(fixture('advising-list.html'));
    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(2);
    expect(result.data[0].detailUrl).toContain('/mahasiswa/pa/bimbingan-pa-detail-bimbingan-mhs/101');
    expect(sanitizeDetailUrl('https://evil.example/detail')).toBeNull();
  });

  it('parses attendance results and decimal comma percentages', () => {
    const doc = fixture('report-ready.html');
    expect(findAttendanceReportTable(doc)?.id).toBe('attendance-result');
    const result = parseAttendanceReport(doc);
    expect(result.status).toBe('success');
    expect(result.data[0]).toMatchObject({ courseCode: 'IF201', present: 13, percentage: 92.86 });
    expect(result.data[1].percentage).toBeCloseTo(66.67);
  });
});
