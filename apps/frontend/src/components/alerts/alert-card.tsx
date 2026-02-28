import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AlertResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { useAlertActions } from './use-alert-actions';

interface AlertCardProps {
  alert: AlertResponse;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export function AlertCard({
  alert,
  showActions = true,
  compact = false,
  className,
}: AlertCardProps) {
  const { isLoading, config, Icon, handleDismiss, handleResolve, timeAgo } =
    useAlertActions(alert);

  return (
    <Card
      className={cn(
        'border-l-4',
        config.borderColor,
        config.bgColor,
        className,
      )}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.color)} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p
                  className={cn(
                    'font-medium leading-tight',
                    compact ? 'text-sm' : 'text-base',
                  )}
                >
                  {alert.message}
                </p>

                {!compact && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">
                      {alert.severity.toLowerCase()}
                    </span>
                    <span>•</span>
                    <span>{timeAgo}</span>
                    {alert.type && (
                      <>
                        <span>•</span>
                        <span className="capitalize">
                          {alert.type.replace('_', ' ')}
                        </span>
                      </>
                    )}
                  </div>
                )}
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

            {compact && (
              <div className="mt-1 text-xs text-muted-foreground">
                {timeAgo}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
