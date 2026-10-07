/**
 * Browser-local, device_id-scoped HiveScale state.
 *
 * The dashboard layout is cached per device so a beekeeper's arrangement
 * survives a reload. Because the key is built from the device_id — which is
 * stable across re-pairings — this state outlives the pairing itself unless it
 * is cleared explicitly: removing a device in HivePal and claiming the same
 * hardware again used to bring back a layout that was meant to be gone.
 *
 * Kept in its own module rather than in `hivescale-modular-dashboard.tsx` so
 * that file only exports components (react-refresh/only-export-components).
 */

export const DASHBOARD_STORAGE_VERSION = 2;
export const dashboardStoragePrefix = 'hivepal:hivescale-dashboard:';

export const dashboardStorageKey = (
  deviceId: string,
  version = DASHBOARD_STORAGE_VERSION,
) => `${dashboardStoragePrefix}${deviceId}:v${version}`;

/**
 * Forget a device's saved dashboard layout.
 *
 * Clears every version, not just the current one, because
 * `loadDashboardSettings` falls back to older keys — leaving one behind would
 * quietly restore the layout on the next claim.
 */
export const clearStoredDashboardSettings = (deviceId: string) => {
  if (typeof globalThis.window === 'undefined') return;

  for (let version = 1; version <= DASHBOARD_STORAGE_VERSION; version++) {
    try {
      globalThis.localStorage.removeItem(
        dashboardStorageKey(deviceId, version),
      );
    } catch {
      // Ignore localStorage failures, for example private mode.
    }
  }
};
