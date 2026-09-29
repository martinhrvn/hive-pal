import { useMemo } from 'react';
import {
  useHiveScaleDevices,
  type HiveScaleChannelsPatch,
  type HiveScaleDevice,
} from '@/api/hooks/useHiveScale';

/**
 * Hive slots on a HiveHub device and how they map to HivePal hives.
 *
 * HiveHub stores both halves of the mapping per hive index (1..18): the display
 * name (`channels.names`) and the HivePal hive id (`channels.hive_ids`). The id
 * is what links a slot to a hive; the name is what HiveHub's own dashboard and
 * alert emails show.
 */

export const MAX_HIVE_SLOTS = 18;

/** Hive display name per slot (1..18); '' for an unnamed slot. */
export type HiveMappingBySlot = Record<number, string>;
/** HivePal hive id per slot (1..18); '' for an unlinked slot. */
export type HiveLinksBySlot = Record<number, string>;

const HIVE_MAPPING_STORAGE_PREFIX = 'hivepal:hivescale-hive-mapping:';

export const allHiveSlots = (): number[] =>
  Array.from({ length: MAX_HIVE_SLOTS }, (_, i) => i + 1);

export const emptyHiveMappings = (): HiveMappingBySlot =>
  Object.fromEntries(
    allHiveSlots().map(slot => [slot, '']),
  ) as HiveMappingBySlot;

const hiveMappingStorageKey = (deviceId: string) =>
  `${HIVE_MAPPING_STORAGE_PREFIX}${deviceId}:v1`;

/**
 * Names HivePal used to keep only in the browser, before HiveHub stored names
 * for every hive. Still read as a fallback so nothing is lost on upgrade; the
 * next save writes them to HiveHub.
 */
const readLegacyStoredHiveNames = (deviceId: string): HiveMappingBySlot => {
  const out = emptyHiveMappings();
  if (typeof globalThis.window === 'undefined') return out;
  try {
    const raw = globalThis.localStorage.getItem(
      hiveMappingStorageKey(deviceId),
    );
    if (!raw) return out;
    const parsed = JSON.parse(raw) as unknown;
    const stored =
      parsed && typeof parsed === 'object' && 'mappings' in parsed
        ? (parsed as { mappings?: unknown }).mappings
        : parsed;
    for (const slot of allHiveSlots()) {
      const value = Array.isArray(stored)
        ? stored[slot - 1]
        : stored && typeof stored === 'object'
          ? (stored as Record<string, unknown>)[String(slot)]
          : undefined;
      if (typeof value === 'string') out[slot] = value.trim();
    }
  } catch {
    // Ignore corrupt or unavailable storage.
  }
  return out;
};

/** Forget the legacy browser-only names, e.g. when a device is removed. */
export const clearStoredHiveMappings = (deviceId: string) => {
  if (typeof globalThis.window === 'undefined') return;
  try {
    globalThis.localStorage.removeItem(hiveMappingStorageKey(deviceId));
  } catch {
    // Ignore localStorage failures, for example private mode.
  }
};

/** Hive names for a device: HiveHub first, legacy browser names as fallback. */
export const deviceHiveNames = (
  device: HiveScaleDevice | undefined,
): HiveMappingBySlot => {
  if (!device) return emptyHiveMappings();
  const names = readLegacyStoredHiveNames(device.device_id);
  const server = device.channels?.names ?? {};
  for (const slot of allHiveSlots()) {
    const value = server[String(slot)]?.trim();
    if (value) names[slot] = value;
  }
  names[1] = device.channels?.scale_1?.trim() || names[1];
  names[2] = device.channels?.scale_2?.trim() || names[2];
  return names;
};

/** HivePal hive ids linked to each slot of a device. */
export const deviceHiveLinks = (
  device: HiveScaleDevice | undefined,
): HiveLinksBySlot => {
  const links = emptyHiveMappings();
  for (const [key, hiveId] of Object.entries(
    device?.channels?.hive_ids ?? {},
  )) {
    const slot = Number(key);
    if (slot >= 1 && slot <= MAX_HIVE_SLOTS && hiveId) links[slot] = hiveId;
  }
  return links;
};

/** Display name for a slot, falling back to "Hive N". */
export const hiveSlotName = (
  names: HiveMappingBySlot,
  slot: number,
  fallback = `Hive ${slot}`,
) => names[slot]?.trim() || fallback;

/**
 * The channels PATCH that turns `before` into `after`. Only changed slots are
 * sent; a cleared name or link is sent as '' so HiveHub drops it.
 */
export const channelsPatchFromDraft = (
  before: { names: HiveMappingBySlot; links: HiveLinksBySlot },
  after: { names: HiveMappingBySlot; links: HiveLinksBySlot },
): HiveScaleChannelsPatch => {
  const names: Record<string, string> = {};
  const hiveIds: Record<string, string> = {};
  for (const slot of allHiveSlots()) {
    const name = after.names[slot]?.trim() ?? '';
    if (name !== (before.names[slot]?.trim() ?? '')) names[String(slot)] = name;
    const link = after.links[slot] ?? '';
    if (link !== (before.links[slot] ?? '')) hiveIds[String(slot)] = link;
  }
  const patch: HiveScaleChannelsPatch = {};
  if (Object.keys(names).length) patch.names = names;
  if (Object.keys(hiveIds).length) patch.hive_ids = hiveIds;
  return patch;
};

export interface HiveHubSlotRef {
  device: HiveScaleDevice;
  /** Hive index on the device, 1..18. */
  slot: number;
  /** The slot's display name on HiveHub. */
  name: string;
}

/** Every HiveHub slot linked to the given HivePal hive. */
export const findHiveHubSlotsForHive = (
  devices: HiveScaleDevice[] | undefined,
  hiveId: string | undefined,
): HiveHubSlotRef[] => {
  if (!devices || !hiveId) return [];
  const out: HiveHubSlotRef[] = [];
  for (const device of devices) {
    const links = deviceHiveLinks(device);
    const names = deviceHiveNames(device);
    for (const slot of allHiveSlots()) {
      if (links[slot] === hiveId) {
        out.push({ device, slot, name: hiveSlotName(names, slot) });
      }
    }
  }
  return out;
};

/**
 * HiveHub slots linked to a HivePal hive, for pages outside the HiveHub page.
 * Quiet by design: a HivePal without HiveHub configured answers the device
 * list with an error, which here simply means "no linked slots".
 */
export const useHiveHubSlotsForHive = (hiveId: string | undefined) => {
  const devices = useHiveScaleDevices({ retry: false });
  const slots = useMemo(
    () => findHiveHubSlotsForHive(devices.data, hiveId),
    [devices.data, hiveId],
  );
  return { slots, isLoading: devices.isLoading };
};
