import { describe, expect, it } from 'vitest';
import {
  resolveAlertPreferences,
  selectAlertsToNotify,
  severityRank,
} from './hivehub-alert.rules';
import type { HiveHubInsightHistoryAlert } from './hivescale.service';

function alert(
  id: number,
  severity: string,
  overrides: Partial<HiveHubInsightHistoryAlert> = {},
): HiveHubInsightHistoryAlert {
  return {
    id,
    alert_key: `swarm-imminent-ch${id}`,
    category: 'swarm',
    channel: 1,
    severity,
    peak_severity: severity,
    title: 'Imminent swarm warning',
    description: '',
    confidence: 0.8,
    first_seen_at: '2026-09-01T10:00:00Z',
    last_seen_at: '2026-09-01T11:00:00Z',
    resolved_at: null,
    status: 'active',
    ...overrides,
  };
}

describe('selectAlertsToNotify', () => {
  it('mails new alerts at or above the minimum severity', () => {
    const out = selectAlertsToNotify(
      [alert(1, 'watch'), alert(2, 'warning'), alert(3, 'critical')],
      new Map(),
      'warning',
    );
    expect(out.map((o) => o.alert.id)).toEqual([3, 2]);
    expect(out.every((o) => o.previousSeverity === null)).toBe(true);
  });

  it('does not mail an alert again at the same severity', () => {
    const out = selectAlertsToNotify(
      [alert(1, 'warning')],
      new Map([[1, 'warning']]),
      'watch',
    );
    expect(out).toEqual([]);
  });

  it('mails an alert again when it escalates', () => {
    const out = selectAlertsToNotify(
      [alert(1, 'critical')],
      new Map([[1, 'warning']]),
      'watch',
    );
    expect(out).toHaveLength(1);
    expect(out[0].previousSeverity).toBe('warning');
  });

  it('uses the peak severity and ignores resolved rows', () => {
    const out = selectAlertsToNotify(
      [
        alert(1, 'watch', { peak_severity: 'critical' }),
        alert(2, 'critical', { status: 'resolved' }),
      ],
      new Map(),
      'critical',
    );
    expect(out.map((o) => o.alert.id)).toEqual([1]);
  });
});

describe('resolveAlertPreferences', () => {
  it('is off by default', () => {
    expect(resolveAlertPreferences(null)).toEqual({
      enabled: false,
      minSeverity: 'warning',
    });
  });

  it('keeps users who had the old swarm alert switched on', () => {
    expect(
      resolveAlertPreferences({ swarmAlert: { enabled: true } }).enabled,
    ).toBe(true);
  });

  it('prefers the new settings over the legacy flag', () => {
    expect(
      resolveAlertPreferences({
        swarmAlert: { enabled: true },
        hiveHubAlerts: { enabled: false, minSeverity: 'critical' },
      }),
    ).toEqual({ enabled: false, minSeverity: 'critical' });
  });

  it('falls back to warning for an unknown minimum severity', () => {
    expect(
      resolveAlertPreferences({
        hiveHubAlerts: { enabled: true, minSeverity: 'info' },
      }).minSeverity,
    ).toBe('warning');
  });
});

describe('severityRank', () => {
  it('orders the HiveHub severities', () => {
    expect(severityRank('info')).toBeLessThan(severityRank('watch'));
    expect(severityRank('watch')).toBeLessThan(severityRank('warning'));
    expect(severityRank('warning')).toBeLessThan(severityRank('critical'));
    expect(severityRank('bogus')).toBe(0);
  });
});
