import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { mountTakeAttendanceHelper } from '../../src/portals/attendance-unand/features/take-attendance-helper/index.js';

let originalPermissions;

beforeEach(() => {
  originalPermissions = navigator.permissions;
  Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query: vi.fn().mockResolvedValue({ state: 'prompt' }) } });
});

afterEach(() => {
  Object.defineProperty(navigator, 'permissions', { configurable: true, value: originalPermissions });
});

describe('take attendance safety', () => {
  it('mounts helper without reading sensitive input values or submitting', async () => {
    const html = readFileSync(resolve('tests/fixtures/attendance-unand/take-attendance.html'), 'utf8');
    const dom = new JSDOM(html, { url: 'https://attendance.unand.ac.id/mahasiswa/absensi/ambilabsensi' });
    const doc = dom.window.document;
    const sensitive = ['input[name="_token"]', '#hasilscan', '#latitude', '#longitude'].map((selector) => doc.querySelector(selector));
    sensitive.forEach((input) => Object.defineProperty(input, 'value', { configurable: true, get() { throw new Error('Sensitive value was read'); }, set() {} }));
    const form = doc.querySelector('form');
    const submit = vi.spyOn(form, 'submit').mockImplementation(() => {});

    await mountTakeAttendanceHelper({ document: doc, location: dom.window.location, signal: new AbortController().signal, settings: {} });

    expect(doc.querySelector('[data-siakadx-root="take-attendance-helper"]')).not.toBeNull();
    expect(submit).not.toHaveBeenCalled();
  });
});
