import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// How often an open tab asks the browser to re-check for a newly deployed
// service worker. Without this a long-lived tab only notices a deployment on
// its next navigation.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

// Keeps the toast from stacking up if the effect runs again.
const TOAST_ID = 'pwa-update-available';

/**
 * Registers the service worker and offers the user a new version once one has
 * been deployed. This is the app's single registration point — see main.tsx.
 *
 * The worker is built in 'prompt' mode, so a new version installs and then
 * waits: nothing changes under the user's feet until they accept here.
 */
export function PWAUpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      if (import.meta.env.PROD) {
        window.setInterval(() => {
          registration.update().catch(() => {
            // Offline or a transient network error — retry on the next tick.
          });
        }, UPDATE_CHECK_INTERVAL_MS);
      }

      console.debug('[PWA] service worker registered:', swUrl);
    },
    onRegisterError(error) {
      console.error('[PWA] service worker registration error', error);
    },
    onOfflineReady() {
      console.debug('[PWA] app ready to work offline');
    },
  });

  useEffect(() => {
    if (!needRefresh) return;

    toast(t('pwa.updateAvailable', 'A new version is available'), {
      id: TOAST_ID,
      duration: Infinity,
      action: {
        label: t('pwa.reload', 'Reload'),
        // `true` activates the waiting worker and reloads the page.
        onClick: () => updateServiceWorker(true),
      },
    });
  }, [needRefresh, updateServiceWorker, t]);

  return null;
}
