/** UI mount helpers for scoped SIAKAD-X roots. */

import { queryFirst } from '../../../shared/dom/query.js';
import { commonSelectors } from '../selectors/common.js';
import { logger } from '../../../shared/logging/logger.js';

export function createRoot(featureId, options = {}, doc = document) {
  const root = doc.createElement('section');
  root.setAttribute('data-siakadx-root', featureId);
  root.className = `siakadx-root ${options.className || ''}`.trim();
  return root;
}

export function findContentMountPoint(doc) {
  const content = queryFirst(doc, ['.content-wrapper .content', '.content-wrapper', ...commonSelectors.contentRoot]);
  return content || doc.body || doc.documentElement;
}

function escapeSelectorValue(value) {
  if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
  return String(value).replace(/[\\"']/g, '\\$&');
}

export function mountRoot(doc, root, position = 'prepend') {
  const featureId = root.getAttribute('data-siakadx-root');
  if (featureId) {
    doc.querySelectorAll(`[data-siakadx-root="${escapeSelectorValue(featureId)}"]`).forEach((node) => {
      if (node !== root) node.remove();
    });
  }
  const mountPoint = findContentMountPoint(doc);
  const pageHeader = doc.getElementById('siakadx-page-header');
  if (position === 'prepend' && pageHeader?.parentElement === mountPoint) {
    pageHeader.insertAdjacentElement('afterend', root);
  } else if (position === 'prepend') {
    mountPoint.prepend(root);
  } else {
    mountPoint.append(root);
  }
  logger.debug('UI root mounted', { featureId });
}

export function unmountRoots(doc, featureId) {
  const selector = featureId
    ? `[data-siakadx-root="${escapeSelectorValue(featureId)}"]`
    : '[data-siakadx-root]:not([data-siakadx-root="app-shell"]):not([data-siakadx-root="page-header"])';
  doc.querySelectorAll(selector).forEach((node) => node.remove());
}

export function el(tag, className, text, doc = document) {
  const element = doc.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
