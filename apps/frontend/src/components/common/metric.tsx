import * as React from 'react';
import { cn } from '@/lib/utils';

const toneClass = {
  default: 'text-foreground',
  honey: 'text-honey-foreground',
  success: 'text-success-foreground',
  warning: 'text-warning-foreground',
  danger: 'text-destructive-foreground',
  muted: 'text-muted-foreground',
  scoreGood: 'text-score-good-foreground',
  scoreFair: 'text-score-fair-foreground',
  scorePoor: 'text-score-poor-foreground',
} as const;

// Sizes respond to the nearest `@container` ancestor (named or not).
const sizeClass = {
  md: 'text-xl @sm:text-2xl',
  lg: 'text-2xl @lg:text-3xl',
} as const;

export type MetricTone = keyof typeof toneClass;

type MetricProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  tone?: MetricTone;
  size?: keyof typeof sizeClass;
  /** Rendered before the value, e.g. an icon. */
  icon?: React.ReactNode;
  /** Rendered after the unit, e.g. a trend indicator. */
  adornment?: React.ReactNode;
  className?: string;
};

/** A large display number with a small overline label underneath. */
export function Metric({
  label,
  value,
  unit,
  tone = 'default',
  size = 'md',
  icon,
  adornment,
  className,
}: MetricProps) {
  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <div
        className={cn(
          'flex items-baseline gap-1 font-display leading-none tabular-nums',
          sizeClass[size],
          toneClass[tone],
        )}
      >
        {icon}
        <span>{value}</span>
        {unit != null && (
          <span className="text-sm font-normal tracking-tight text-muted-foreground">
            {unit}
          </span>
        )}
        {adornment}
      </div>
      <span className="font-overline text-muted-foreground">{label}</span>
    </div>
  );
}
