import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLifecycle } from '../../src/content/lifecycle.js';
import {
  mountAppShell,
  cleanupAppShell
} from '../../src/portals/attendance-unand/ui/app-shell.js';
import { createDefaultStorage } from '../../src/shared/storage/schema.js';

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('content lifecycle', () => {
  it('aborts an in-flight mount immediately when disabled', async () => {
    let observedSignal;
    let cleanupCount = 0;
    let startedResolve;
    const started = new Promise((resolve) => {
      startedResolve = resolve;
    });

    const lifecycle = createLifecycle({
      onMount(signal) {
        observedSignal = signal;
        startedResolve();
        return new Promise((resolve) => {
          signal.addEventListener('abort', resolve, { once: true });
        });
      },
      onUnmount() {
        cleanupCount += 1;
      }
    });

    const mounting = lifecycle.mount();
    await started;
    const unmounting = lifecycle.unmount();

    expect(observedSignal.aborted).toBe(true);
    await Promise.all([mounting, unmounting]);
    expect(lifecycle.isMounted()).toBe(false);
    expect(cleanupCount).toBeGreaterThanOrEqual(1);
  });
});

describe('reversible app shell', () => {
  const originalChrome = globalThis.chrome;

  beforeEach(() => {
    globalThis.chrome = {
      runtime: {
        getURL: vi.fn((path) => `chrome-extension://test/${path}`)
      }
    };
    document.documentElement.className = '';
    document.body.className = '';
    document.body.innerHTML = `
      <header class="main-header"></header>
      <aside class="main-sidebar"></aside>
      <main class="content-wrapper"><div class="content"><p>Konten asli</p></div></main>
      <footer class="main-footer"></footer>
    `;
  });

  afterEach(() => {
    cleanupAppShell(document);
    globalThis.chrome = originalChrome;
  });

  it('keeps a return control available in native view and restores cleanly', async () => {
    const controller = new AbortController();
    mountAppShell(document, 'HOME', createDefaultStorage().settings, controller.signal);

    expect(document.documentElement.classList.contains('siakadx-active')).toBe(true);
    expect(document.querySelector('#siakadx-app-shell')).not.toBeNull();

    const nativeButton = [...document.querySelectorAll('.siakadx-shell__action')]
      .find((element) => element.tagName === 'BUTTON');
    expect(nativeButton).toBeTruthy();

    nativeButton.click();
    await nextTask();
    expect(document.documentElement.classList.contains('siakadx-native-view')).toBe(true);
    expect(nativeButton.textContent).toContain('Kembali ke SIAKAD-X');

    nativeButton.click();
    expect(document.documentElement.classList.contains('siakadx-native-view')).toBe(false);

    cleanupAppShell(document);
    expect(document.querySelector('#siakadx-app-shell')).toBeNull();
    expect(document.documentElement.classList.contains('siakadx-active')).toBe(false);
  });
});
