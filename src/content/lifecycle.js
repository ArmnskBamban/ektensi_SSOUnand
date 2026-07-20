/** Serialized and cancellation-aware lifecycle manager for content features. */

import { logger } from '../shared/logging/logger.js';

/**
 * @param {{
 *   onMount: (signal: AbortSignal) => Promise<void> | void,
 *   onUnmount?: () => Promise<void> | void
 * }} handlers
 */
export function createLifecycle(handlers) {
  /** @type {AbortController | null} */
  let controller = null;
  let mounted = false;
  let generation = 0;
  let queue = Promise.resolve();

  /** @param {() => Promise<void> | void} task */
  const run = (task) => {
    queue = queue.then(task, task);
    return queue;
  };

  const cleanup = async () => {
    controller?.abort();
    try {
      await handlers.onUnmount?.();
    } catch (error) {
      logger.error('Lifecycle unmount failed', error);
    } finally {
      controller = null;
      mounted = false;
    }
  };

  const api = {
    mount() {
      const requestGeneration = ++generation;

      // Abort an in-flight parser/observer immediately. Cleanup remains serialized,
      // so rapid toggles cannot leave duplicate roots or stale UI behind.
      controller?.abort();

      return run(async () => {
        await cleanup();
        if (requestGeneration !== generation) return;

        const localController = new AbortController();
        controller = localController;

        try {
          await handlers.onMount(localController.signal);
          if (
            !localController.signal.aborted &&
            requestGeneration === generation
          ) {
            mounted = true;
          } else {
            await cleanup();
          }
        } catch (error) {
          localController.abort();
          controller = null;
          mounted = false;
          logger.error('Lifecycle mount failed', error);
          await cleanup();
        }
      });
    },

    unmount() {
      generation += 1;
      controller?.abort();
      return run(cleanup);
    },

    isMounted() {
      return mounted;
    },

    get signal() {
      return controller?.signal || AbortSignal.abort();
    }
  };

  return api;
}

export { debounce } from '../shared/utils/debounce.js';
