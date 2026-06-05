import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type CalloutVariant = 'amber' | 'rose' | 'emerald' | 'neutral';

const VARIANT_CLASSES: Record<CalloutVariant, string> = {
  amber: 'border-amber-300 bg-amber-50 dark:bg-amber-950/30',
  rose: 'border-rose-300 bg-rose-50/60 dark:bg-rose-950/30',
  emerald: 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30',
  neutral: '',
};

const ICON_TINT: Record<CalloutVariant, string> = {
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  neutral: 'text-foreground',
};

interface CalloutCardProps {
  readonly title: string;
  readonly icon?: React.ReactNode;
  readonly variant?: CalloutVariant;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function CalloutCard({
  title,
  icon,
  variant = 'amber',
  children,
  className,
}: CalloutCardProps) {
  return (
    <Card className={cn(VARIANT_CLASSES[variant], className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon && (
            <span className={cn('inline-flex', ICON_TINT[variant])}>
              {icon}
            </span>
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}
