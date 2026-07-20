/**
 * Selectors for Ambil Absensi page.
 *
 * SECURITY: Do NOT read or store values of sensitive fields:
 * - _token (CSRF)
 * - #hasilscan (QR result)
 * - #latitude / #longitude (location)
 *
 * Only check presence of elements for UI helper status.
 */

export const takeAttendanceSelectors = {
  form: [
    'form[action*="ambilabsensi"]',
    'form[method="post"]',
    'form'
  ],
  /** Camera select — presence only, do not spoof */
  cameraSelect: ['#pilihKamera', 'select[name*="kamera"]'],
  /**
   * Sensitive fields — check existence only, NEVER read .value
   */
  scanResultField: ['#hasilscan'],
  latitudeField: ['#latitude'],
  longitudeField: ['#longitude'],
  tokenField: ['input[name="_token"]'],
  submitButton: [
    'form button[type="submit"]',
    'form input[type="submit"]',
    'button[type="submit"]'
  ],
  videoPreview: ['video', '#video', '.camera-preview video']
};