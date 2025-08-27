import { formatDistance } from 'date-fns';
import { AlertTriangle, AlertCircle, Info, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDismissAlert, useResolveAlert } from '@/api/hooks';
import type { AlertResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AlertItemProps {
  alert: AlertResponse;
  showActions?: boolean;
  className?: string;
}

const severityConfig = {
  LOW: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  MEDIUM: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  HIGH: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

export function AlertItem({ 
  alert, 
  showActions = true, 
  className 
}: AlertItemProps) {
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
        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo}
        </p>
      </div>

      {showActions && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResolve}
            disabled={isLoading}
            className="h-6 w-6 p-0 hover:bg-green-100"
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isLoading}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3 text-gray-600" />
          </Button>
        </div>
      )}
    </div>
  );
}