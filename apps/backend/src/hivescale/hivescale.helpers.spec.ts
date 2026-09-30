import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  hiveHubChannelsPatchSchema,
  hiveHubConfigPatchSchema,
} from 'shared-schemas';
import { parseRelaySlot } from './hivescale.controller';
import { hiveInsideSlots } from './hivescale.service';
import { deviceIdsInRecords, parseSdMeasurements } from './sd-import.parser';

describe('parseRelaySlot', () => {
  it('defaults to hive 1', () => {
    expect(parseRelaySlot(undefined)).toBe(1);
    expect(parseRelaySlot('')).toBe(1);
  });

  it('accepts every hive a device can report', () => {
    expect(parseRelaySlot('3')).toBe(3);
    expect(parseRelaySlot('18')).toBe(18);
  });

  it('rejects out-of-range and non-integer slots', () => {
    for (const raw of ['0', '19', '1.5', 'abc']) {
      expect(() => parseRelaySlot(raw)).toThrow(BadRequestException);
    }
  });
});

describe('hiveInsideSlots', () => {
  it('finds the hives that report a HiveInside node', () => {
    expect(
      hiveInsideSlots({
        hives: [
          { index: 4, ble: { present: true, sensor_type: 'HiveInside' } },
          { index: 1, ble: { present: true, sensor_type: 'RuuviTag' } },
          { index: 7, ble: { present: true, board: 'nrf54lm20a' } },
          { index: 9, ble: { present: false, sensor_type: 'HiveInside' } },
          { index: 2 },
        ],
      }),
    ).toEqual([4, 7]);
  });

  it('falls back to the legacy slots without per-hive data', () => {
    expect(hiveInsideSlots(undefined)).toEqual([1, 2]);
    expect(hiveInsideSlots({})).toEqual([1, 2]);
  });
});

describe('SD import device detection', () => {
  it('lists the devices stamped into the backup', () => {
    const file = Buffer.from(
      [
        JSON.stringify({ device_id: 'hub-a', measured_at: 1 }),
        JSON.stringify({ device_id: 'hub-b', measured_at: 2 }),
        JSON.stringify({ device_id: 'hub-a', measured_at: 3 }),
        JSON.stringify({ measured_at: 4 }),
      ].join('\n'),
    );
    const { records } = parseSdMeasurements(file, 'measurements.ndjson');
    expect(deviceIdsInRecords(records)).toEqual(['hub-a', 'hub-b']);
  });
});

describe('shared HiveHub schemas', () => {
  it('accepts per-hive names and links for hives 1..18', () => {
    const parsed = hiveHubChannelsPatchSchema.parse({
      names: { '1': 'North', '18': '' },
      hive_ids: { '3': 'a-uuid', '4': null },
    });
    expect(parsed.names).toEqual({ '1': 'North', '18': '' });
  });

  it('rejects hive indexes outside 1..18', () => {
    expect(
      hiveHubChannelsPatchSchema.safeParse({ names: { '19': 'x' } }).success,
    ).toBe(false);
    expect(
      hiveHubChannelsPatchSchema.safeParse({ hive_ids: { '0': 'x' } }).success,
    ).toBe(false);
  });

  it('refuses to switch off every HiveTraffic emitter bank', () => {
    expect(
      hiveHubConfigPatchSchema.safeParse({
        beecounter_bank1_enabled: false,
        beecounter_bank2_enabled: false,
        beecounter_bank3_enabled: false,
      }).success,
    ).toBe(false);
    expect(
      hiveHubConfigPatchSchema.safeParse({ beecounter_bank1_enabled: false })
        .success,
    ).toBe(true);
  });

  it('bounds the night window and inspection timeout', () => {
    expect(
      hiveHubConfigPatchSchema.safeParse({
        beecounter_night_start_minute: 1440,
      }).success,
    ).toBe(false);
    expect(
      hiveHubConfigPatchSchema.safeParse({ inspection_timeout_minutes: 0 })
        .success,
    ).toBe(false);
  });
});
