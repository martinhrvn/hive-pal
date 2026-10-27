import { useActions, useHive } from '@/api/hooks';
import { Section } from '@/components/common/section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  calculateFeedingTotals,
  getFeedingSeasonProgress,
  type FeedingSeasonProgress,
  type FeedingTotals,
} from '@/utils/feeding-calculations';
import { formatSeasonRange, getSeasonDisplayName } from '@/utils/season-format';
import { Info, Target } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ActionType } from 'shared-schemas';
import { useUnitFormat } from '@/hooks/use-unit-format';
import { useTranslation } from 'react-i18next';

interface FeedingSectionProps {
  hiveId: string;
  variant?: 'card' | 'inline';
}

const progressTone = (percentage: number): 'success' | 'info' | 'warning' => {
  if (percentage >= 100) return 'success';
  if (percentage >= 75) return 'info';
  return 'warning';
};

// `Progress` hardcodes its indicator to `bg-primary`, so the fill colour is
// overridden per status tone (semantic tokens, light + dark safe).
const PROGRESS_BAR_CLASS = {
  success: '[&_[data-slot="progress-indicator"]]:bg-success',
  info: '[&_[data-slot="progress-indicator"]]:bg-info',
  warning: '[&_[data-slot="progress-indicator"]]:bg-warning',
} as const;

const PROGRESS_TEXT_CLASS = {
  success: 'text-success-foreground',
  info: 'text-info-foreground',
  warning: 'text-warning-foreground',
} as const;

const progressBarClass = (percentage: number) =>
  PROGRESS_BAR_CLASS[progressTone(percentage)];

const progressTextColor = (percentage: number) =>
  PROGRESS_TEXT_CLASS[progressTone(percentage)];

const MobileFeedingSummary = ({
  totals,
  progress,
  seasonLabel,
}: {
  totals: FeedingTotals;
  progress: FeedingSeasonProgress | null;
  seasonLabel: string | null;
}) => {
  const { t } = useTranslation('hive');
  const { formatWeight } = useUnitFormat();
  const percentage = progress?.percentage ?? 0;
  const percentageLabel = percentage.toFixed(0);

  return (
    <div className="sm:hidden space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-muted-foreground">
              {t('feeding.yearLabel')}
            </span>
            <span className="ml-1 text-sm font-semibold">
              {formatWeight(totals.currentYearSugarKg).label}
            </span>
          </div>
          {progress && (
            <div>
              <span className="text-xs text-muted-foreground">
                {seasonLabel}
              </span>
              <span className="ml-1 text-sm font-semibold">
                {formatWeight(progress.sugarKg).label}
              </span>
            </div>
          )}
        </div>
        {progress && (
          <span
            className={`text-sm font-bold ${progressTextColor(percentage)}`}
          >
            {percentageLabel}%
          </span>
        )}
      </div>
      {progress && percentage < 100 && (
        <Progress
          value={percentage}
          className={`h-1.5 ${progressBarClass(percentage)}`}
        />
      )}
    </div>
  );
};

const InlineFeedingSummary = ({
  totals,
  progress,
  seasonLabel,
}: {
  totals: FeedingTotals;
  progress: FeedingSeasonProgress | null;
  seasonLabel: string | null;
}) => {
  const { t } = useTranslation('hive');
  const { formatWeight } = useUnitFormat();
  const percentage = progress?.percentage ?? 0;
  const percentageLabel = percentage.toFixed(0);

  return (
    <div data-test="hive-feeding-summary">
      <MobileFeedingSummary
        totals={totals}
        progress={progress}
        seasonLabel={seasonLabel}
      />
      {/* Desktop compact view */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">
            {t('feeding.yearLabel')}
          </span>
          <span className="text-sm font-semibold">
            {formatWeight(totals.currentYearSugarKg).label}
          </span>
        </div>
        {progress && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{seasonLabel}</span>
            <span className="text-sm font-semibold">
              {formatWeight(progress.sugarKg).label}
            </span>
          </div>
        )}
        {progress && (
          <>
            <span
              className={`text-sm font-bold ${progressTextColor(percentage)}`}
            >
              {percentageLabel}%
            </span>
            {percentage < 100 && (
              <Progress
                value={percentage}
                className={`h-1.5 w-16 ${progressBarClass(percentage)}`}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const YearTotalsBlock = ({ totals }: { totals: FeedingTotals }) => {
  const { t } = useTranslation('hive');
  const { formatWeight, formatVolume } = useUnitFormat();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {t('feeding.yearTotal', { year: new Date().getFullYear() })}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('feeding.yearTotalTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-3xl font-bold">
        {formatWeight(totals.currentYearSugarKg).label}
      </div>
      {totals.currentYearSyrupLiters > 0 && (
        <div className="text-xs text-muted-foreground">
          {t('feeding.syrupAmount', {
            amount: formatVolume(totals.currentYearSyrupLiters).label,
          })}
        </div>
      )}
    </div>
  );
};

const SeasonTotalsBlock = ({
  progress,
  seasonLabel,
  seasonRange,
}: {
  progress: FeedingSeasonProgress;
  seasonLabel: string | null;
  seasonRange: string;
}) => {
  const { t } = useTranslation('hive');
  const { formatWeight, formatVolume } = useUnitFormat();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">{seasonLabel}</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {progress.isActive
                  ? t('feeding.seasonActiveTooltip')
                  : t('feeding.seasonLatestTooltip')}
              </p>
              <p className="text-xs mt-1">{seasonRange}</p>
              <p className="text-xs mt-1">{t('feeding.sugarCalculations')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-3xl font-bold">
        {formatWeight(progress.sugarKg).label}
      </div>
      {progress.syrupLiters > 0 && (
        <div className="text-xs text-muted-foreground">
          {t('feeding.syrupAmount', {
            amount: formatVolume(progress.syrupLiters).label,
          })}
        </div>
      )}
    </div>
  );
};

const ProgressBlock = ({ progress }: { progress: FeedingSeasonProgress }) => {
  const { t } = useTranslation('hive');
  const { formatWeight } = useUnitFormat();
  const percentage = progress.percentage;
  const percentageLabel = percentage.toFixed(0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {t('feeding.targetProgress')}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Target className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('feeding.targetProgressTooltip')}</p>
              <p className="text-xs mt-1">
                {t('feeding.targetSugarEquivalent', {
                  amount: formatWeight(progress.targetKg).label,
                })}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-3xl font-bold">{percentageLabel}%</div>
      <div className="text-sm text-muted-foreground">
        {formatWeight(progress.sugarKg).label} /{' '}
        {formatWeight(progress.targetKg).label}
      </div>
      <Progress
        value={Math.min(percentage, 100)}
        className={`h-2 ${progressBarClass(percentage)}`}
      />
      {progress.remainingKg > 0 && (
        <div className="text-xs text-muted-foreground">
          {t('feeding.remaining', {
            amount: formatWeight(progress.remainingKg).label,
          })}
        </div>
      )}
    </div>
  );
};

const FeedingCard = ({
  totals,
  progress,
  seasonLabel,
  seasonRange,
}: {
  totals: FeedingTotals;
  progress: FeedingSeasonProgress | null;
  seasonLabel: string | null;
  seasonRange: string | null;
}) => {
  return (
    <Card className="p-3 sm:p-6" data-test="hive-feeding-summary">
      <MobileFeedingSummary
        totals={totals}
        progress={progress}
        seasonLabel={seasonLabel}
      />

      {/* Desktop view */}
      <div className="hidden sm:block space-y-8">
        <div className={progress ? 'grid grid-cols-2 gap-6' : ''}>
          <YearTotalsBlock totals={totals} />
          {progress && seasonRange && (
            <SeasonTotalsBlock
              progress={progress}
              seasonLabel={seasonLabel}
              seasonRange={seasonRange}
            />
          )}
        </div>
        {progress && <ProgressBlock progress={progress} />}
      </div>
    </Card>
  );
};

export const FeedingSection: React.FC<FeedingSectionProps> = ({
  hiveId,
  variant = 'card',
}) => {
  const { t, i18n } = useTranslation(['hive', 'common']);
  const { data: actions, isLoading } = useActions(
    hiveId ? { hiveId, type: ActionType.FEEDING } : undefined,
    {
      enabled: !!hiveId,
    },
  );
  const { data: hive } = useHive(hiveId);

  if (!hiveId || isLoading) {
    return (
      <Section title={t('card.feeding')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))}
        </div>
      </Section>
    );
  }

  if (!actions || actions.length === 0) {
    // Don't show the card at all if no feeding records
    return null;
  }

  const totals = calculateFeedingTotals(actions);
  const progress = getFeedingSeasonProgress(
    actions,
    hive?.settings,
    hive?.apiarySettings,
  );
  const seasonLabel = progress
    ? getSeasonDisplayName(progress.season, t)
    : null;
  const seasonRange = progress
    ? formatSeasonRange(progress.season, i18n.language)
    : null;

  if (variant === 'inline') {
    return (
      <InlineFeedingSummary
        totals={totals}
        progress={progress}
        seasonLabel={seasonLabel}
      />
    );
  }

  return (
    <FeedingCard
      totals={totals}
      progress={progress}
      seasonLabel={seasonLabel}
      seasonRange={seasonRange}
    />
  );
};
