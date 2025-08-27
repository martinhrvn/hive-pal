import { AlertBadge } from './alert-badge';
import type { AlertResponse } from 'shared-schemas';

interface AlertsSummaryProps {
  alerts: AlertResponse[];
  className?: string;
}

export function AlertsSummary({ alerts, className }: AlertsSummaryProps) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Count alerts by severity
  const severityCounts = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Show highest severity first
  const severityOrder = ['HIGH', 'MEDIUM', 'LOW'] as const;
  const severityToShow = severityOrder.find(severity => severityCounts[severity] > 0);

  if (!severityToShow) {
    return null;
  }

  const count = severityCounts[severityToShow];

  return (
    <AlertBadge
      severity={severityToShow}
      count={count}
      className={className}
    />
  );
}