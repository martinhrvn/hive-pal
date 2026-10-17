import { useActions, useHive } from '@/api/hooks';
import { Section } from '@/components/common/section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { calculateFeedingTotals } from '@/utils/feeding-calculations';
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

export const FeedingSection: React.FC<FeedingSectionProps> = ({
  hiveId,
  variant = 'card',
}) => {
  const { t } = useTranslation('hive');
  const { data: actions, isLoading } = useActions(
    hiveId ? { hiveId, type: ActionType.FEEDING } : undefined,
    {
      enabled: !!hiveId,
    },
  );
  const { data: hive } = useHive(hiveId);
  const { formatWeight, formatVolume } = useUnitFormat();

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

  const totals = calculateFeedingTotals(actions, hive?.settings);
  const currentMonth = new Date().getMonth() + 1;
  const isAfterAugust = currentMonth >= 8;

  // Calculate feeding progress based on hive settings
  const targetAmount = hive?.settings?.autumnFeeding?.amountKg || 12;
  const currentAmount = totals.autumnSugarKg;
  const progressPercentage = Math.min(
    (currentAmount / targetAmount) * 100,
    100,
  );
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);

  if (variant === 'inline') {
    return (
      <div>
        {/* Mobile compact view */}
        <div className="sm:hidden flex items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-muted-foreground">
                {t('feeding.yearLabel')}
              </span>
              <span className="text-sm font-semibold ml-1">
                {formatWeight(totals.currentYearSugarKg).label}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t('feeding.autumnLabel')}
              </span>
              <span className="text-sm font-semibold ml-1">
                {formatWeight(totals.autumnSugarKg).label}
              </span>
            </div>
          </div>
          <span
            className={`text-sm font-bold ${progressPercentage >= 100 ? 'text-green-600' : progressPercentage >= 75 ? 'text-blue-600' : 'text-orange-600'}`}
          >
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
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
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {t('feeding.autumnLabel')}
            </span>
            <span className="text-sm font-semibold">
              {formatWeight(totals.autumnSugarKg).label}
            </span>
          </div>
          <span
            className={`text-sm font-bold ${progressPercentage >= 100 ? 'text-green-600' : progressPercentage >= 75 ? 'text-blue-600' : 'text-orange-600'}`}
          >
            {progressPercentage.toFixed(0)}%
          </span>
          {progressPercentage < 100 && (
            <Progress
              value={progressPercentage}
              className="h-1.5 w-16"
              color={
                progressPercentage >= 100
                  ? 'bg-green-500'
                  : progressPercentage >= 75
                    ? 'bg-blue-500'
                    : 'bg-orange-500'
              }
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-3 sm:p-6">
      {/* Mobile compact view */}
      <div className="sm:hidden space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-muted-foreground">
                {t('feeding.yearLabel')}
              </span>
              <span className="text-sm font-semibold ml-1">
                {formatWeight(totals.currentYearSugarKg).label}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t('feeding.autumnLabel')}
              </span>
              <span className="text-sm font-semibold ml-1">
                {formatWeight(totals.autumnSugarKg).label}
              </span>
            </div>
          </div>
          <span
            className={`text-sm font-bold ${progressPercentage >= 100 ? 'text-green-600' : progressPercentage >= 75 ? 'text-blue-600' : 'text-orange-600'}`}
          >
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        {progressPercentage < 100 && (
          <Progress
            value={progressPercentage}
            className="h-1.5"
            color={
              progressPercentage >= 100
                ? 'bg-green-500'
                : progressPercentage >= 75
                  ? 'bg-blue-500'
                  : 'bg-orange-500'
            }
          />
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden sm:block space-y-8">
        {/* Total and Autumn Feeding in 2 columns */}
        <div className="grid grid-cols-2 gap-6">
          {/* Current Year Feeding */}
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

          {/* Autumn Feeding */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {t('feeding.autumnFeeding')}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isAfterAugust
                        ? t('feeding.sinceAugustThisYear')
                        : t('feeding.fromLastAugust')}
                    </p>
                    <p className="text-xs mt-1">
                      {t('feeding.sugarCalculations')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-3xl font-bold">
              {formatWeight(totals.autumnSugarKg).label}
            </div>
            {totals.autumnSyrupLiters > 0 && (
              <div className="text-xs text-muted-foreground">
                {t('feeding.syrupAmount', {
                  amount: formatVolume(totals.autumnSyrupLiters).label,
                })}
              </div>
            )}
          </div>
        </div>

        {/* Feeding Progress */}
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
                      amount: formatWeight(targetAmount).label,
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-3xl font-bold">
            {progressPercentage.toFixed(0)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {formatWeight(currentAmount).label} /{' '}
            {formatWeight(targetAmount).label}
          </div>
          <Progress
            value={progressPercentage}
            className="h-2"
            color={
              progressPercentage >= 100
                ? 'bg-green-500'
                : progressPercentage >= 75
                  ? 'bg-blue-500'
                  : 'bg-orange-500'
            }
          />
          {remainingAmount > 0 && (
            <div className="text-xs text-muted-foreground">
              {t('feeding.remaining', {
                amount: formatWeight(remainingAmount).label,
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
