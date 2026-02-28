import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AlertResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { useAlertActions } from './use-alert-actions';

interface AlertItemProps {
  alert: AlertResponse;
  showActions?: boolean;
  className?: string;
}

export function AlertItem({
  alert,
  showActions = true,
  className,
}: AlertItemProps) {
  const { isLoading, config, Icon, handleDismiss, handleResolve, timeAgo } =
    useAlertActions(alert);

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors',
        config.bgColor,
        className,
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight text-foreground">
          {alert.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {showActions && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResolve}
            disabled={isLoading}
            className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
          >
            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isLoading}
            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
      )}
    </div>
  );
}
