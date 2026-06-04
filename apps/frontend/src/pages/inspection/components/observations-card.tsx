import { ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { FRAME_FIELDS } from '@/constants/frame-fields';
import { InspectionSection } from './inspection-section';
import { cn } from '@/lib/utils';

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
};

// ─── Stat tile — editorial typography ────────────────────────────────────────

type StatTileProps = {
  label: string;
  value: number | string;
  sub?: string;
};

const StatTile = ({ label, value, sub }: StatTileProps) => (
  <div className="group/tile relative rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 px-3 py-2.5 hover:border-amber-300/60 dark:hover:border-amber-700/60 transition-colors">
    <div className="font-overline text-stone-500 dark:text-stone-400 truncate">
      {label}
    </div>
    <div className="mt-1 font-display text-2xl tabular-nums leading-none text-stone-900 dark:text-stone-50">
      {value}
    </div>
    {sub && (
      <div className="mt-1 text-[10px] uppercase tracking-wider text-stone-400">
        {sub}
      </div>
    )}
  </div>
);

// ─── Frame composition bar ────────────────────────────────────────────────────

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

// ─── Subheading ─────────────────────────────────────────────────────────────

const SubHeading = ({ children }: { children: React.ReactNode }) => (
  <h4 className="font-overline text-stone-500 dark:text-stone-400 mb-2.5">
    {children}
  </h4>
);

// ─── Card ─────────────────────────────────────────────────────────────────────

export const ObservationsCard = ({
  observations = {},
}: ObservationsCardProps) => {
  const { t } = useTranslation('inspection');

  const frameEntries = FRAME_FIELDS.map((ff) => ({
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

  const numericStats: { label: string; value: number; sub?: string }[] = [
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
  ].filter(Boolean) as { label: string; value: number; sub?: string }[];

  const booleanFlags: { label: string; value: boolean }[] = [
    observations.queenSeen == null
      ? null
      : { label: t('fields.queenSeen'), value: observations.queenSeen },
    observations.swarmCells == null
      ? null
      : {
          label: t('observations.swarmCells'),
          value: observations.swarmCells,
        },
    observations.supersedureCells == null
      ? null
      : {
          label: t('observations.supersedureCells'),
          value: observations.supersedureCells,
        },
  ].filter(Boolean) as { label: string; value: boolean }[];

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
      icon={<ClipboardList className="h-4 w-4" />}
    >
      <div className="space-y-7">
        {/* Numeric stats — masonry-style grid */}
        {(numericStats.length > 0 || booleanFlags.length > 0) && (
          <div className="grid grid-cols-2 @sm/sec:grid-cols-3 @lg/sec:grid-cols-4 gap-2.5">
            {numericStats.map(({ label, value, sub }) => (
              <StatTile key={label} label={label} value={value} sub={sub} />
            ))}
            {booleanFlags.map(({ label, value }) => (
              <StatTile
                key={label}
                label={label}
                value={value ? t('fields.yes') : t('fields.no')}
              />
            ))}
          </div>
        )}

        {/* Frame composition */}
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
              {observations.additionalObservations!.map((obs) => (
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
              {observations.reminderObservations!.map((obs) => (
                <Badge
                  key={obs}
                  variant="outline"
                  className="border-red-300/70 bg-red-50/50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
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
