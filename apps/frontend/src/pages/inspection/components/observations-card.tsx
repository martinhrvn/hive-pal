import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

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
    honeyFrames?: number | null;
    emptyFrames?: number | null;
  };
};

// ─── Stat tile: a labelled number ────────────────────────────────────────────

type StatTileProps = {
  label: string;
  value: number | string;
  sub?: string;
};

const StatTile = ({ label, value, sub }: StatTileProps) => (
  <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
    {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
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
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {count} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

export const ObservationsCard = ({
  observations = {},
}: ObservationsCardProps) => {
  const { t } = useTranslation('inspection');

  // Frame composition — sum of all 6 frame type values entered
  const frameEntries: { key: keyof typeof observations; label: string; color: string }[] = [
    { key: 'eggsFrames',           label: t('observations.eggsFrames'),           color: 'bg-yellow-400' },
    { key: 'uncappedBroodFrames',  label: t('observations.uncappedBroodFrames'),  color: 'bg-orange-400' },
    { key: 'cappedBroodFrames',    label: t('observations.cappedBroodFrames'),    color: 'bg-amber-600'  },
    { key: 'droneBroodFrames',     label: t('observations.droneBroodFrames'),     color: 'bg-amber-800'  },
    { key: 'pollenFrames',         label: t('observations.pollenFrames'),         color: 'bg-green-500'  },
    { key: 'honeyFrames',          label: t('observations.honeyFrames'),          color: 'bg-yellow-500' },
    { key: 'emptyFrames',          label: t('observations.emptyFrames'),          color: 'bg-slate-300'  },
  ];

  const allFramesSum = frameEntries.reduce(
    (sum, { key }) => sum + ((observations[key] as number | null | undefined) ?? 0),
    0,
  );
  const hasFrameCounts = allFramesSum > 0;

  // Numeric stats to show (only render tiles that have a recorded value)
  const numericStats: { label: string; value: number; sub?: string }[] = [
    observations.strength   == null ? null : { label: t('observations.strength'),  value: observations.strength  },
    observations.queenCells == null ? null : { label: t('observations.queenCells'), value: observations.queenCells },
  ].filter(Boolean) as { label: string; value: number; sub?: string }[];

  // Boolean flags
  const booleanFlags: { label: string; value: boolean }[] = [
    observations.queenSeen        == null ? null : { label: t('fields.queenSeen'),              value: observations.queenSeen       },
    observations.swarmCells       == null ? null : { label: t('observations.swarmCells'),        value: observations.swarmCells      },
    observations.supersedureCells == null ? null : { label: t('observations.supersedureCells'),  value: observations.supersedureCells },
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
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t('observationsCard.title')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">

          {/* Numeric stats */}
          {numericStats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

          {/* Boolean flags when there are no numeric stats */}
          {numericStats.length === 0 && booleanFlags.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('observations.frameCounts.title')}
                {observations.totalFrames != null && (
                  <span className="ml-2 font-normal">
                    ({t('observations.frameCounts.totalFrames', { count: observations.totalFrames })})
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {frameEntries.map(({ key, label, color }) => {
                  const count = (observations[key] as number | null | undefined) ?? 0;
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
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {t('observationsCard.broodPattern')}
              </h4>
              <Badge variant="outline" className="capitalize">
                {t(`observations.broodPatternOptions.${observations.broodPattern}`, {
                  defaultValue: observations.broodPattern.replace(/_/g, ' '),
                })}
              </Badge>
            </div>
          )}

          {/* Additional Observations */}
          {(observations.additionalObservations?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {t('observationsCard.additionalObservations')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {observations.additionalObservations!.map(obs => (
                  <Badge key={obs} variant="secondary">
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
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {t('observationsCard.reminders')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {observations.reminderObservations!.map(obs => (
                  <Badge key={obs} variant="destructive">
                    {t(`observations.reminder.${obs}`, {
                      defaultValue: obs.replace(/_/g, ' '),
                    })}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
};
