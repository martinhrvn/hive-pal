import type {
  HiveHubAlertPreferences,
  HiveHubAlertSeverity,
} from 'shared-schemas';
import type { HiveHubInsightHistoryAlert } from './hivescale.service';

const SEVERITY_RANK: Record<string, number> = {
  info: 1,
  watch: 2,
  warning: 3,
  critical: 4,
};

export function severityRank(severity: string | null | undefined): number {
  return SEVERITY_RANK[(severity ?? '').toLowerCase()] ?? 0;
}

export interface AlertToNotify {
  alert: HiveHubInsightHistoryAlert;
  /** Severity the user was last mailed about, or null for a new alert. */
  previousSeverity: string | null;
}

/**
 * Pick the active HiveHub alerts a user should be emailed about.
 *
 * An alert is mailed when it reaches `minSeverity` and is either new (never
 * mailed) or has escalated past the severity last mailed. HiveHub gives a
 * recurrence of the same detector a fresh history id, so a swarm warning that
 * resolves and fires again next week is mailed again.
 */
export function selectAlertsToNotify(
  active: HiveHubInsightHistoryAlert[],
  notified: Map<number, string>,
  minSeverity: HiveHubAlertPreferences['minSeverity'],
): AlertToNotify[] {
  const threshold = severityRank(minSeverity);
  const out: AlertToNotify[] = [];
  for (const alert of active) {
    if (alert.status !== 'active') continue;
    const severity = alert.peak_severity || alert.severity;
    const rank = severityRank(severity);
    if (rank < threshold) continue;
    const previous = notified.get(alert.id) ?? null;
    if (previous !== null && rank <= severityRank(previous)) continue;
    out.push({ alert, previousSeverity: previous });
  }
  // Most severe first, so the email subject names the worst one.
  return out.sort(
    (a, b) =>
      severityRank(b.alert.peak_severity || b.alert.severity) -
      severityRank(a.alert.peak_severity || a.alert.severity),
  );
}

/**
 * Alert preferences with defaults applied. Users who had the retired HivePal
 * swarm check switched on keep getting alerts after the upgrade.
 */
export function resolveAlertPreferences(
  preferences: unknown,
): HiveHubAlertPreferences {
  const prefs = (preferences ?? {}) as {
    hiveHubAlerts?: Partial<HiveHubAlertPreferences>;
    swarmAlert?: { enabled?: boolean };
  };
  const minSeverity = prefs.hiveHubAlerts?.minSeverity;
  return {
    enabled: prefs.hiveHubAlerts?.enabled ?? prefs.swarmAlert?.enabled ?? false,
    minSeverity:
      minSeverity === 'watch' ||
      minSeverity === 'warning' ||
      minSeverity === 'critical'
        ? minSeverity
        : 'warning',
  };
}

export type { HiveHubAlertSeverity };
