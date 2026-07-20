/**
 * Debounce utility function.
 * Shared across content scripts, features, and UI components.
 */

/**
 * Debounce a function call.
 * @param {(...args: any[]) => void} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 * @returns {(...args: any[]) => void} Debounced function
 */
export function debounce(fn, ms) {
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timer = null;

  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, ms);
  };
}