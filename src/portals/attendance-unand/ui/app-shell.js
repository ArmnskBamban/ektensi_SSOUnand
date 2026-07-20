/**
 * Reversible application shell for Attendance Unand.
 * The original portal stays in the DOM; CSS takeover is controlled by classes.
 */

import { ATTENDANCE_UNAND_ROUTES, PAGE_LABELS } from '../routes.js';
import { queryFirst } from '../../../shared/dom/query.js';
import { commonSelectors } from '../selectors/common.js';

const SHELL_ID = 'siakadx-app-shell';
const PAGE_HEADER_ID = 'siakadx-page-header';

const NAVIGATION = [
  {
    section: 'Akademik',
    items: [
      { page: 'HOME', label: 'Ringkasan Akademik', href: ATTENDANCE_UNAND_ROUTES.home, icon: 'home' }
    ]
  },
  {
    section: 'Perkuliahan',
    items: [
      { page: 'TAKE_ATTENDANCE', label: 'Ambil Absensi', href: ATTENDANCE_UNAND_ROUTES.takeAttendance, icon: 'scan' },
      { page: 'ATTENDANCE_REPORT', label: 'Laporan Kehadiran', href: ATTENDANCE_UNAND_ROUTES.attendanceReport, icon: 'report' }
    ]
  },
  {
    section: 'Bimbingan',
    items: [
      { page: 'ACADEMIC_ADVISING_LIST', label: 'Bimbingan Akademik', href: ATTENDANCE_UNAND_ROUTES.academicAdvisingList, icon: 'message' },
      { page: 'THESIS_ADVISING', label: 'Bimbingan TA', href: ATTENDANCE_UNAND_ROUTES.thesisAdvising, icon: 'book' }
    ]
  }
];

const ICONS = {
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
  scan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M8 9h8v6H8z"/></svg>',
  report: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V10M12 20V4M19 20v-7M3 20h18"/></svg>',
  message: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v12H8l-4 3z"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a3 3 0 013-3h13v17H7a3 3 0 000 6h13M7 2v17"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21h-4v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 00.3-1.9A1.7 1.7 0 003 14H3v-4h.1a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.6V3h4v.1a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.6 1H21v4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg>'
};

function icon(name) {
  const span = document.createElement('span');
  span.className = 'siakadx-icon';
  span.innerHTML = ICONS[name] || '';
  return span;
}

function linkItem(item, currentPage) {
  const link = document.createElement('a');
  link.className = 'siakadx-shell__nav-link';
  link.href = item.href;
  link.appendChild(icon(item.icon));
  const label = document.createElement('span');
  label.textContent = item.label;
  link.appendChild(label);
  if (item.page === currentPage || (currentPage === 'ACADEMIC_ADVISING_DETAIL' && item.page === 'ACADEMIC_ADVISING_LIST')) {
    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');
  }
  return link;
}

/**
 * @param {Document} doc
 * @param {import('../routes.js').AttendanceUnandPage} page
 * @param {import('../../../shared/storage/schema.js').SiakadXSettings} settings
 * @param {AbortSignal} signal
 */
export function mountAppShell(doc, page, settings, signal) {
  cleanupAppShell(doc);
  applyVisualPreferences(doc, settings);

  doc.documentElement.classList.add('siakadx-active');
  doc.body?.classList.add('siakadx-active');

  const shell = doc.createElement('div');
  shell.id = SHELL_ID;
  shell.setAttribute('data-siakadx-root', 'app-shell');
  shell.className = 'siakadx-shell';

  const overlay = doc.createElement('button');
  overlay.type = 'button';
  overlay.className = 'siakadx-shell__overlay';
  overlay.setAttribute('aria-label', 'Tutup navigasi');
  shell.appendChild(overlay);

  const sidebar = doc.createElement('aside');
  sidebar.className = 'siakadx-shell__sidebar';
  sidebar.setAttribute('aria-label', 'Navigasi SIAKAD-X');

  const brand = doc.createElement('a');
  brand.className = 'siakadx-shell__brand';
  brand.href = ATTENDANCE_UNAND_ROUTES.home;
  const brandMark = doc.createElement('span');
  brandMark.className = 'siakadx-shell__brand-mark';
  brandMark.textContent = 'SX';
  const brandText = doc.createElement('span');
  brandText.innerHTML = '<strong>SIAKAD-X</strong><small>Universitas Andalas</small>';
  brand.append(brandMark, brandText);
  sidebar.appendChild(brand);

  const nav = doc.createElement('nav');
  nav.className = 'siakadx-shell__nav';
  for (const group of NAVIGATION) {
    const section = doc.createElement('section');
    section.className = 'siakadx-shell__nav-section';
    const heading = doc.createElement('h2');
    heading.textContent = group.section;
    section.appendChild(heading);
    for (const item of group.items) section.appendChild(linkItem(item, page));
    nav.appendChild(section);
  }
  sidebar.appendChild(nav);

  const sidebarFooter = doc.createElement('div');
  sidebarFooter.className = 'siakadx-shell__sidebar-footer';
  const privacy = doc.createElement('span');
  privacy.textContent = 'Berjalan lokal di browser';
  sidebarFooter.appendChild(privacy);
  sidebar.appendChild(sidebarFooter);
  shell.appendChild(sidebar);

  const topbar = doc.createElement('header');
  topbar.className = 'siakadx-shell__topbar';
  const menuButton = doc.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'siakadx-shell__icon-button siakadx-shell__menu-button';
  menuButton.setAttribute('aria-label', 'Buka navigasi');
  menuButton.appendChild(icon('menu'));

  const title = doc.createElement('div');
  title.className = 'siakadx-shell__topbar-title';
  const eyebrow = doc.createElement('span');
  eyebrow.textContent = 'Attendance Unand';
  const heading = doc.createElement('strong');
  heading.textContent = PAGE_LABELS[page] || 'SIAKAD-X';
  title.append(eyebrow, heading);

  const actions = doc.createElement('div');
  actions.className = 'siakadx-shell__topbar-actions';

  const nativeButton = doc.createElement('button');
  nativeButton.type = 'button';
  nativeButton.className = 'siakadx-shell__action';
  nativeButton.append(icon('eye'), doc.createTextNode('Tampilan asli'));
  nativeButton.setAttribute('aria-pressed', 'false');

  const settingsLink = doc.createElement('a');
  settingsLink.className = 'siakadx-shell__action';
  settingsLink.href = chrome.runtime.getURL('options/index.html');
  settingsLink.target = '_blank';
  settingsLink.rel = 'noopener';
  settingsLink.append(icon('settings'), doc.createTextNode('Pengaturan'));

  actions.append(nativeButton, settingsLink);
  topbar.append(menuButton, title, actions);
  shell.appendChild(topbar);
  doc.body?.appendChild(shell);

  const content = queryFirst(doc, commonSelectors.contentRoot);
  if (content) {
    content.setAttribute('data-siakadx-content', 'true');
    const pageHeader = doc.createElement('div');
    pageHeader.id = PAGE_HEADER_ID;
    pageHeader.setAttribute('data-siakadx-root', 'page-header');
    pageHeader.className = 'siakadx-page-header';
    const pageTitle = doc.createElement('div');
    const h1 = doc.createElement('h1');
    h1.textContent = PAGE_LABELS[page] || 'SIAKAD-X';
    const p = doc.createElement('p');
    p.textContent = pageDescription(page);
    pageTitle.append(h1, p);
    const status = doc.createElement('span');
    status.className = 'siakadx-page-header__status';
    status.textContent = 'Terhubung ke portal resmi';
    pageHeader.append(pageTitle, status);
    content.insertBefore(pageHeader, content.firstChild);
  }

  const toggleMenu = (open) => {
    doc.documentElement.classList.toggle('siakadx-nav-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  };
  menuButton.addEventListener('click', () => toggleMenu(!doc.documentElement.classList.contains('siakadx-nav-open')), { signal });
  overlay.addEventListener('click', () => toggleMenu(false), { signal });

  nativeButton.addEventListener('click', () => {
    const active = !doc.documentElement.classList.contains('siakadx-native-view');
    doc.documentElement.classList.toggle('siakadx-native-view', active);
    nativeButton.setAttribute('aria-pressed', String(active));
    nativeButton.lastChild.textContent = active ? 'Kembali ke SIAKAD-X' : 'Tampilan asli';
  }, { signal });

  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') toggleMenu(false);
  }, { signal });
}

function pageDescription(page) {
  const descriptions = {
    HOME: 'Ringkasan IP, IPK, SKS, dan riwayat mata kuliah dalam satu tempat.',
    TAKE_ATTENDANCE: 'Alur presensi yang lebih jelas tanpa mengubah proses resmi.',
    ATTENDANCE_REPORT: 'Filter, ringkasan, dan detail kehadiran per semester.',
    ACADEMIC_ADVISING_LIST: 'Riwayat periode bimbingan akademik dan status verifikasi.',
    ACADEMIC_ADVISING_DETAIL: 'Detail bimbingan tetap berasal dari halaman resmi portal.',
    THESIS_ADVISING: 'Status dan informasi bimbingan tugas akhir.'
  };
  return descriptions[page] || 'Lapisan antarmuka modern untuk portal akademik.';
}

/**
 * @param {Document} doc
 * @param {import('../../../shared/storage/schema.js').SiakadXSettings} settings
 */
export function applyVisualPreferences(doc, settings) {
  const root = doc.documentElement;
  root.classList.toggle('siakadx-compact', Boolean(settings.compactMode));
  root.classList.toggle('siakadx-high-contrast', Boolean(settings.highContrast));
}

/** @param {Document} doc */
export function cleanupAppShell(doc) {
  doc.getElementById(SHELL_ID)?.remove();
  doc.getElementById(PAGE_HEADER_ID)?.remove();
  doc.querySelectorAll('[data-siakadx-content]').forEach((element) => element.removeAttribute('data-siakadx-content'));
  doc.querySelectorAll('[data-siakadx-native-source]').forEach((element) => element.removeAttribute('data-siakadx-native-source'));
  doc.querySelectorAll('[data-siakadx-native-form]').forEach((element) => element.removeAttribute('data-siakadx-native-form'));
  doc.querySelectorAll('[data-siakadx-scanner-preview]').forEach((element) => element.removeAttribute('data-siakadx-scanner-preview'));
  for (const name of ['siakadx-active', 'siakadx-nav-open', 'siakadx-native-view', 'siakadx-compact', 'siakadx-high-contrast']) {
    doc.documentElement.classList.remove(name);
    doc.body?.classList.remove(name);
  }
}

/** @param {Element | null} element */
export function markNativeSource(element) {
  if (element) element.setAttribute('data-siakadx-native-source', 'true');
}
