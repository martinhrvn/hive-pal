import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AlertSeverity } from 'shared-schemas';
import { cn } from '@/lib/utils';

interface AlertBadgeProps {
  severity: AlertSeverity;
  count?: number;
  className?: string;
}

const severityConfig = {
  LOW: {
    icon: Info,
    variant: 'secondary' as const,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  MEDIUM: {
    icon: AlertTriangle,
    variant: 'default' as const,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  HIGH: {
    icon: AlertCircle,
    variant: 'destructive' as const,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

export function AlertBadge({ severity, count, className }: AlertBadgeProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  if (count && count === 0) {
    return null;
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1',
        config.bgColor,
        config.borderColor,
        className,
      )}
    >
      <Icon className={cn('h-3 w-3', config.color)} />
      {count ? count : severity}
    </Badge>
  );
}
