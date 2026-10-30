import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  getScoreLevel,
  scoreLevelStyles,
  type ScoreThresholds,
  type ScoreLevel,
  SCORE_LEVEL_THRESHOLDS,
} from '@/lib/score-level';

const LEVEL_ICONS = {
  good: CircleCheck,
  fair: TriangleAlert,
  poor: CircleX,
} as const;

const LEVEL_LABEL_KEYS: Record<ScoreLevel, string> = {
  good: 'scoreLevel.good',
  fair: 'scoreLevel.fair',
  poor: 'scoreLevel.poor',
};

type ScoreLevelCueProps = {
  value: number | null | undefined;
  thresholds?: ScoreThresholds;
  className?: string;
  iconClassName?: string;
};

/**
 * Non-color cue for a score level: a distinct icon per level, with the level
 * name available to screen readers.
 */
export const ScoreLevelCue = ({
  value,
  thresholds = SCORE_LEVEL_THRESHOLDS,
  className,
  iconClassName,
}: ScoreLevelCueProps) => {
  const { t } = useTranslation('common');
  const level = getScoreLevel(value, thresholds);

  if (!level) return null;

  const Icon = LEVEL_ICONS[level];
  const label = t(LEVEL_LABEL_KEYS[level]);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        scoreLevelStyles[level].text,
        className,
      )}
    >
      <Icon className={cn('size-3.5 shrink-0', iconClassName)} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
};

ScoreLevelCue.displayName = 'ScoreLevelCue';
