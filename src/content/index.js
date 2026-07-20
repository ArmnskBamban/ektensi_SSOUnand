/** Content script entry for Attendance Unand. */

import { getSettings, onSettingsChange } from '../shared/storage/index.js';
import { setDebugMode, logger } from '../shared/logging/logger.js';
import { createLifecycle } from './lifecycle.js';
import { routeAndMount } from './portal-router.js';
import { applyInterfaceSettings, onSystemThemeChange } from '../shared/ui/theme.js';
import { cleanupAppShell } from '../portals/attendance-unand/ui/app-shell.js';
import { unmountRoots } from '../portals/attendance-unand/ui/mount.js';

let currentSettings = null;
let unsubscribeStorage = null;
let unsubscribeSystemTheme = null;

const lifecycle = createLifecycle({
  async onMount(signal) {
    const settings = currentSettings || (await getSettings());
    await routeAndMount({ document, location, signal, settings });
  },
  onUnmount() {
    unmountRoots(document);
    cleanupAppShell(document);
  }
});

async function reconcile(settings, previous = null) {
  currentSettings = settings;
  setDebugMode(settings.debugMode);
  applyInterfaceSettings(document, settings);

  const portalEnabled = Boolean(settings.enabledPortals?.attendanceUnand);
  if (!settings.enabled || !portalEnabled) {
    await lifecycle.unmount();
    return;
  }

  const structuralChange =
    !previous ||
    previous.enabled !== settings.enabled ||
    previous.enabledPortals?.attendanceUnand !== portalEnabled ||
    previous.compactMode !== settings.compactMode ||
    previous.highContrast !== settings.highContrast;

  if (structuralChange || !lifecycle.isMounted()) {
    await lifecycle.mount();
  }
}

async function bootstrap() {
  try {
    const settings = await getSettings();
    await reconcile(settings);

    unsubscribeStorage = onSettingsChange(async (nextSettings) => {
      const previous = currentSettings;
      await reconcile(nextSettings, previous);
    });

    unsubscribeSystemTheme = onSystemThemeChange((actual) => {
      if (currentSettings?.theme === 'system') {
        document.documentElement.setAttribute('data-siakadx-theme', actual);
      }
    });

    window.addEventListener('pagehide', () => {
      unsubscribeStorage?.();
      unsubscribeSystemTheme?.();
      lifecycle.unmount();
    }, { once: true });
  } catch (error) {
    logger.error('Content script bootstrap failed', error);
    cleanupAppShell(document);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
