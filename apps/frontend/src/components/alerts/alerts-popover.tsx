import { useTranslation } from 'react-i18next';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AlertItem } from './alert-item';
import type { AlertResponse, AlertSeverity } from 'shared-schemas';
import { cn } from '@/lib/utils';

interface AlertsPopoverProps {
  alerts: AlertResponse[];
  className?: string;
}

const severityConfig = {
  LOW: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    label: 'alert',
  },
  MEDIUM: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    label: 'alert',
  },
  HIGH: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    label: 'alert',
  },
};

export function AlertsPopover({ alerts, className }: AlertsPopoverProps) {
  const { t } = useTranslation('common');
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Get the highest priority alert for display
  const severityOrder: AlertSeverity[] = ['HIGH', 'MEDIUM', 'LOW'];
  const highestSeverity = severityOrder.find(severity =>
    alerts.some(alert => alert.severity === severity),
  );

  if (!highestSeverity) {
    return null;
  }

  const config = severityConfig[highestSeverity];
  const Icon = config.icon;
  const alertCount = alerts.length;
  const pluralLabel = alertCount === 1 ? t('common:alerts.alert') : t('common:alerts.alerts');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2',
            className,
          )}
        >
          <Icon className={cn('h-4 w-4', config.color)} />
          <span className="text-gray-600 dark:text-gray-400">
            {alertCount} {pluralLabel}
          </span>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <Icon className={cn('h-4 w-4', config.color)} />
            <h4 className="font-medium text-sm">
              {alertCount} {alertCount === 1 ? t('common:alerts.activeAlert') : t('common:alerts.activeAlerts')}
            </h4>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {alerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} showActions={false} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
