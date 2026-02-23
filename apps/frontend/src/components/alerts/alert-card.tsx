import { formatDistance } from 'date-fns';
import { AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDismissAlert, useResolveAlert } from '@/api/hooks';
import type { AlertResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AlertCardProps {
  alert: AlertResponse;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

const severityConfig = {
  LOW: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  MEDIUM: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  HIGH: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
};

export function AlertCard({
  alert,
  showActions = true,
  compact = false,
  className,
}: AlertCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const dismissAlert = useDismissAlert();
  const resolveAlert = useResolveAlert();

  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  const handleDismiss = async () => {
    setIsLoading(true);
    try {
      await dismissAlert.mutateAsync(alert.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    setIsLoading(true);
    try {
      await resolveAlert.mutateAsync(alert.id);
    } finally {
      setIsLoading(false);
    }
  };

  const timeAgo = formatDistance(new Date(alert.createdAt), new Date(), {
    addSuffix: true,
  });

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
