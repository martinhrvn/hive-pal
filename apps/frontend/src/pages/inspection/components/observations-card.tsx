import { ClipboardList, Check, X, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { FRAME_FIELDS } from '@/constants/frame-fields';
import { InspectionSection } from './inspection-section';
import { cn } from '@/lib/utils';
import { ScoreLevelCue } from '@/components/common/score-level-cue';
import {
  getScoreLevel,
  RATING_LEVEL_THRESHOLDS,
  scoreLevelStyles,
} from '@/lib/score-level';

type ObservationsCardProps = {
  observations?: {
    strength?: number | null;
    uncappedBrood?: number | null;
    cappedBrood?: number | null;
    honeyStores?: number | null;
    pollenStores?: number | null;
    queenCells?: number | null;
    queenSeen?: boolean | null;
    swarmCells?: boolean | null;
    supersedureCells?: boolean | null;
    broodPattern?: string | null;
    additionalObservations?: string[];
    reminderObservations?: string[];
    totalFrames?: number | null;
    eggsFrames?: number | null;
    uncappedBroodFrames?: number | null;
    cappedBroodFrames?: number | null;
    droneBroodFrames?: number | null;
    pollenFrames?: number | null;
    nectarFrames?: number | null;
    honeyFrames?: number | null;
    emptyFrames?: number | null;
  };
  inspectionType?: 'subjective' | 'data_driven';
};

// ─── Section subheading ─────────────────────────────────────────────────────

const SubHeading = ({ children }: { children: React.ReactNode }) => (
  <h4 className="font-overline text-stone-500 dark:text-stone-400 mb-3">
    {children}
  </h4>
);

// ─── Rating row (0–10) — subjective mode ────────────────────────────────────

type RatingRowProps = { label: string; value: number };

const RatingRow = ({ label, value }: RatingRowProps) => {
  const { t } = useTranslation('inspection');
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  const level = getScoreLevel(value, RATING_LEVEL_THRESHOLDS);
  const styles = level ? scoreLevelStyles[level] : null;

  return (
    <div className="grid grid-cols-[minmax(7rem,12rem)_1fr_auto] items-center gap-3 py-2">
      <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
        {label}
      </span>
      <div className="relative h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-[width]', styles?.bar)}
          style={{ width: `${pct}%` }}
        />
        {/* mid tick */}
        <div
          className="absolute inset-y-0 left-1/2 w-px bg-stone-300/70 dark:bg-stone-700/70"
          aria-hidden
        />
      </div>
      <span
        className={cn(
          'flex items-center justify-end gap-1.5 font-display tabular-nums text-base leading-none min-w-[4.25rem] text-right',
          styles?.text,
        )}
      >
        <ScoreLevelCue value={value} thresholds={RATING_LEVEL_THRESHOLDS} />
        {value}
        <span className="text-stone-400 dark:text-stone-500 font-normal text-sm">
          {' '}
          {t('units.outOfTen')}
        </span>
      </span>
    </div>
  );
};

// ─── Stat tile — data-driven counts ─────────────────────────────────────────

type StatTileProps = { label: string; value: number | string };

const StatTile = ({ label, value }: StatTileProps) => (
  <div className="relative rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 px-3 py-2.5">
    <div className="font-overline text-stone-500 dark:text-stone-400 truncate">
      {label}
    </div>
    <div className="mt-1 font-display text-2xl tabular-nums leading-none text-stone-900 dark:text-stone-50">
      {value}
    </div>
  </div>
);

// ─── Frame composition bar ──────────────────────────────────────────────────

type FrameBarProps = {
  label: string;
  count: number;
  allFramesSum: number;
  color: string;
};

const FrameBar = ({ label, count, allFramesSum, color }: FrameBarProps) => {
  const pct = allFramesSum > 0 ? Math.round((count / allFramesSum) * 100) : 0;
  return (
    <div className="grid grid-cols-[10rem_1fr_auto] items-center gap-3 py-1.5">
      <span className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
        {label}
      </span>
      <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-[width]', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-overline tabular-nums text-stone-500 dark:text-stone-400 min-w-[3.5rem] text-right">
        {count} · {pct}%
      </span>
    </div>
  );
};

// ─── Boolean flag chip ──────────────────────────────────────────────────────

type FlagChipProps = {
  label: string;
  value: boolean;
  positiveIsGood?: boolean;
  icon?: React.ReactNode;
};

const FlagChip = ({
  label,
  value,
  positiveIsGood = true,
  icon,
}: FlagChipProps) => {
  // Visual color: "good" = success; "concern" = warning
  const good = positiveIsGood ? value : !value;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
        good
          ? 'border-success/30 bg-success-muted text-success-foreground'
          : 'border-warning/30 bg-warning-muted text-warning-foreground',
      )}
    >
      <span
        className={cn(
          'inline-flex size-4 items-center justify-center rounded-full',
          good
            ? 'bg-success/15 text-success-foreground'
            : 'bg-warning/15 text-warning-foreground',
        )}
      >
        {value ? <Check className="size-3" /> : <X className="size-3" />}
      </span>
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );
};

// ─── Card ──────────────────────────────────────────────────────────────────

export const ObservationsCard = ({
  observations = {},
  inspectionType = 'data_driven',
}: ObservationsCardProps) => {
  const { t } = useTranslation('inspection');
  const isSubjective = inspectionType === 'subjective';

  const frameEntries = FRAME_FIELDS.map(ff => ({
    key: ff.obsKey as keyof typeof observations,
    label: t(`observations.${ff.obsKey}`),
    color: ff.tailwindColor,
  }));

  const allFramesSum = frameEntries.reduce(
    (sum, { key }) =>
      sum + ((observations[key] as number | null | undefined) ?? 0),
    0,
  );
  const hasFrameCounts = allFramesSum > 0;

  // Numeric observations (treated as 0-10 ratings in subjective mode)
  const numericStats: { label: string; value: number }[] = [
    observations.strength == null
      ? null
      : { label: t('observations.strength'), value: observations.strength },
    observations.uncappedBrood == null
      ? null
      : {
          label: t('observations.uncappedBrood'),
          value: observations.uncappedBrood,
        },
    observations.cappedBrood == null
      ? null
      : {
          label: t('observations.cappedBrood'),
          value: observations.cappedBrood,
        },
    observations.honeyStores == null
      ? null
      : {
          label: t('observations.honeyStores'),
          value: observations.honeyStores,
        },
    observations.pollenStores == null
      ? null
      : {
          label: t('observations.pollenStores'),
          value: observations.pollenStores,
        },
    observations.queenCells == null
      ? null
      : { label: t('observations.queenCells'), value: observations.queenCells },
  ].filter(Boolean) as { label: string; value: number }[];

  // Boolean flags — queen seen is good when true, swarm/supersedure are concerns when true
  type Flag = {
    key: string;
    label: string;
    value: boolean;
    positiveIsGood: boolean;
    icon?: React.ReactNode;
  };
  const booleanFlags: Flag[] = [
    observations.queenSeen == null
      ? null
      : {
          key: 'queenSeen',
          label: t('fields.queenSeen'),
          value: observations.queenSeen,
          positiveIsGood: true,
          icon: <Crown className="size-3" />,
        },
    observations.swarmCells == null
      ? null
      : {
          key: 'swarmCells',
          label: t('observations.swarmCells'),
          value: observations.swarmCells,
          positiveIsGood: false,
        },
    observations.supersedureCells == null
      ? null
      : {
          key: 'supersedureCells',
          label: t('observations.supersedureCells'),
          value: observations.supersedureCells,
          positiveIsGood: false,
        },
  ].filter(Boolean) as Flag[];

  const hasContent =
    hasFrameCounts ||
    numericStats.length > 0 ||
    booleanFlags.length > 0 ||
    observations.broodPattern ||
    (observations.additionalObservations?.length ?? 0) > 0 ||
    (observations.reminderObservations?.length ?? 0) > 0;

  if (!hasContent) return null;

  return (
    <InspectionSection
      title={t('observationsCard.title', { defaultValue: 'Observations' })}
      icon={<ClipboardList className="size-4" />}
    >
      <div className="space-y-7">
        {/* Numeric observations */}
        {numericStats.length > 0 &&
          (isSubjective ? (
            <div>
              <SubHeading>
                {t('observationsCard.ratings', { defaultValue: 'Ratings' })}
              </SubHeading>
              <div className="border-t border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-900">
                {numericStats.map(({ label, value }) => (
                  <RatingRow key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 @sm/sec:grid-cols-3 @lg/sec:grid-cols-4 gap-2.5">
              {numericStats.map(({ label, value }) => (
                <StatTile key={label} label={label} value={value} />
              ))}
            </div>
          ))}

        {/* Boolean flags */}
        {booleanFlags.length > 0 && (
          <div>
            <SubHeading>
              {t('observationsCard.signals', { defaultValue: 'Signals' })}
            </SubHeading>
            <div className="flex flex-wrap gap-2">
              {booleanFlags.map(
                ({ key, label, value, positiveIsGood, icon }) => (
                  <FlagChip
                    key={key}
                    label={label}
                    value={value}
                    positiveIsGood={positiveIsGood}
                    icon={icon}
                  />
                ),
              )}
            </div>
          </div>
        )}

        {/* Frame composition (data-driven only) */}
        {hasFrameCounts && (
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <SubHeading>{t('observations.frameCounts.title')}</SubHeading>
              {observations.totalFrames != null && (
                <span className="font-overline text-stone-400 tabular-nums">
                  {t('observations.frameCounts.totalFrames', {
                    count: observations.totalFrames,
                  })}
                </span>
              )}
            </div>
            <div className="border-t border-stone-200 dark:border-stone-800 pt-2 divide-y divide-stone-100 dark:divide-stone-900">
              {frameEntries.map(({ key, label, color }) => {
                const count =
                  (observations[key] as number | null | undefined) ?? 0;
                if (count === 0) return null;
                return (
                  <FrameBar
                    key={key}
                    label={label}
                    count={count}
                    allFramesSum={allFramesSum}
                    color={color}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Brood Pattern */}
        {observations.broodPattern && (
          <div>
            <SubHeading>{t('observationsCard.broodPattern')}</SubHeading>
            <Badge
              variant="outline"
              className="capitalize border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300"
            >
              {t(
                `observations.broodPatternOptions.${observations.broodPattern}`,
                {
                  defaultValue: observations.broodPattern.replace(/_/g, ' '),
                },
              )}
            </Badge>
          </div>
        )}

        {/* Additional Observations */}
        {(observations.additionalObservations?.length ?? 0) > 0 && (
          <div>
            <SubHeading>
              {t('observationsCard.additionalObservations')}
            </SubHeading>
            <div className="flex flex-wrap gap-2">
              {observations.additionalObservations!.map(obs => (
                <Badge
                  key={obs}
                  variant="secondary"
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 font-normal"
                >
                  {t(`observations.additional.${obs}`, {
                    defaultValue: obs.replace(/_/g, ' '),
                  })}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Reminder Observations */}
        {(observations.reminderObservations?.length ?? 0) > 0 && (
          <div>
            <SubHeading>{t('observationsCard.reminders')}</SubHeading>
            <div className="flex flex-wrap gap-2">
              {observations.reminderObservations!.map(obs => (
                <Badge
                  key={obs}
                  variant="outline"
                  className="border-destructive/30 bg-destructive/10 text-destructive-foreground"
                >
                  {t(`observations.reminder.${obs}`, {
                    defaultValue: obs.replace(/_/g, ' '),
                  })}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </InspectionSection>
  );
};
