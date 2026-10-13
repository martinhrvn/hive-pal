import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  delta: number | null;
  unit?: string;
  /** Classes applied to the icon, e.g. "size-3.5" */
  iconClassName?: string;
  /** Whether to render the numeric delta alongside the icon */
  showDelta?: boolean;
}

/**
 * Renders a trend icon (up/down/flat) with an optional delta value.
 * Used wherever an observation is compared across two inspections.
 */
export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  delta,
  unit = '',
  iconClassName = 'size-3',
  showDelta = true,
}) => {
  const isUp = delta != null && delta > 0;
  const isDown = delta != null && delta < 0;
  let Icon: typeof TrendingUp | typeof TrendingDown | typeof Minus;
  if (isUp) {
    Icon = TrendingUp;
  } else if (isDown) {
    Icon = TrendingDown;
  } else {
    Icon = Minus;
  }

  let deltaStr: string | null;
  if (delta == null || delta === 0) {
    deltaStr = null;
  } else if (isUp) {
    deltaStr = `+${delta}${unit}`;
  } else {
    deltaStr = `${delta}${unit}`;
  }

  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Icon className={iconClassName} />
      {showDelta && deltaStr && (
        <span className="tabular-nums">{deltaStr}</span>
      )}
    </span>
  );
};
