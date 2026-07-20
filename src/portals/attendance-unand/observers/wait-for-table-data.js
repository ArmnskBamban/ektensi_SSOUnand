/** Wait for a dynamic table to contain real rows. */

import { OBSERVER_DEFAULTS } from '../../../config/defaults.js';
import { queryFirst, isPlaceholderRow } from '../../../shared/dom/query.js';

export function countDataRows(table) {
  if (!table) return 0;
  const tbody = table.querySelector('tbody');
  const rows = tbody ? tbody.querySelectorAll('tr') : table.querySelectorAll('tr');
  let count = 0;
  for (const row of rows) {
    if (!tbody && row.querySelector('th')) continue;
    if (!isPlaceholderRow(row)) count += 1;
  }
  return count;
}

export function waitForTableData(options) {
  const { root = document, selector, minimumRows = OBSERVER_DEFAULTS.minimumRows, timeoutMs = OBSERVER_DEFAULTS.timeoutMs, settleMs = OBSERVER_DEFAULTS.settleMs, signal } = options;
  return new Promise((resolve) => {
    let done = false;
    let timeout = null;
    let settle = null;
    const observer = new MutationObserver(() => evaluate());
    const cleanup = () => { observer.disconnect(); if (timeout) clearTimeout(timeout); if (settle) clearTimeout(settle); signal?.removeEventListener('abort', abort); };
    const finish = (timedOut) => {
      if (done) return;
      done = true; cleanup();
      const table = queryFirst(root, selector); resolve({ table, rowCount: table ? countDataRows(table) : 0, timedOut });
    };
    const evaluate = () => {
      if (done) return;
      const table = queryFirst(root, selector);
      if (table && countDataRows(table) >= minimumRows) {
        if (settle) clearTimeout(settle);
        settle = setTimeout(() => finish(false), settleMs);
      }
    };
    const abort = () => finish(false);
    if (signal?.aborted) { finish(false); return; }
    signal?.addEventListener('abort', abort, { once: true });
    observer.observe(root instanceof Document ? root.documentElement : root, { childList: true, subtree: true, characterData: true });
    timeout = setTimeout(() => finish(true), timeoutMs);
    evaluate();
  });
}
