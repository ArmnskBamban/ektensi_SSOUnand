/**
 * Common layout selectors for Attendance Unand (AdminLTE-like).
 * Arrays are ordered fallback candidates.
 */

export const commonSelectors = {
  header: ['.main-header.navbar', 'header.main-header', '.main-header'],
  sidebar: ['.main-sidebar', 'aside.main-sidebar', '.main-sidebar'],
  sidebarNavigation: ['.nav-sidebar', '[role="menu"]', '.sidebar-menu'],
  footer: ['.main-footer', 'footer.main-footer'],
  contentRoot: ['.content-wrapper', 'main', '[role="main"]', '.content']
};