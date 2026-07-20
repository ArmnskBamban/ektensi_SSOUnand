/**
 * Wait for an element to appear in the DOM with MutationObserver.
 * Honors AbortSignal; disconnects cleanly on timeout or abort.
 */

import { OBSERVER_DEFAULTS } from '../../../config/defaults.js';
import { queryFirst } from '../../../shared/dom/query.js';

/**
 * @typedef {Object} WaitForElementOptions
 * @property {ParentNode} [root]
 * @property {string | readonly string[]} selector
 * @property {number} [timeoutMs]
 * @property {number} [settleMs]
 * @property {AbortSignal} [signal]
 */

/**
 * Wait until a selector matches an element.
 * @param {WaitForElementOptions} options
 * @returns {Promise<Element | null>}
 */
export function waitForElement(options) {
  const {
    root = document,
    selector,
    timeoutMs = OBSERVER_DEFAULTS.timeoutMs,
    settleMs = OBSERVER_DEFAULTS.settleMs,
    signal
  } = options;

  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }

    /** @type {ReturnType<typeof setTimeout> | null} */
    let timeoutId = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let settleId = null;
    /** @type {MutationObserver | null} */
    let observer = null;
    let settled = false;

    function cleanup() {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (settleId !== null) clearTimeout(settleId);
      if (observer) observer.disconnect();
      signal?.removeEventListener('abort', onAbort);
    }

    function finish(/** @type {Element | null} */ el) {
      cleanup();
      resolve(el);
    }

    function onAbort() {
      finish(null);
    }

    function check() {
      const el = queryFirst(root, selector);
      if (el) {
        // Debounce: wait settleMs of stability
        if (settleId !== null) clearTimeout(settleId);
        settleId = setTimeout(() => {
          const still = queryFirst(root, selector);
          finish(still);
        }, settleMs);
      }
    }

    signal?.addEventListener('abort', onAbort);

    // Immediate check
    const immediate = queryFirst(root, selector);
    if (immediate) {
      finish(immediate);
      return;
    }

    observer = new MutationObserver(() => {
      check();
    });

    const observeTarget =
      root instanceof Document ? root.documentElement : /** @type {Node} */ (root);

    observer.observe(observeTarget, {
      childList: true,
      subtree: true
    });

    timeoutId = setTimeout(() => {
      // Final check before timeout
      const el = queryFirst(root, selector);
      finish(el);
    }, timeoutMs);
  });
}