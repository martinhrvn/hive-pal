import { useMemo } from 'react';
import { subMonths } from 'date-fns';
import { useInspections } from '@/api/hooks';
import { InspectionStatus, ObservationSchemaType } from 'shared-schemas';
import { TrendIndicator } from '@/components/common/trend-indicator';
import { largestRemainder } from '@/utils/math';

// ─── Field config ─────────────────────────────────────────────────────────────

type NumericObsKey = keyof Pick<
  NonNullable<ObservationSchemaType>,
  | 'eggsFrames'
  | 'uncappedBroodFrames'
  | 'cappedBroodFrames'
  | 'droneBroodFrames'
  | 'pollenFrames'
  | 'nectarFrames'
  | 'honeyFrames'
  | 'emptyFrames'
  | 'strength'
  | 'queenCells'
>;

// Keys used to compute the brood nest total (denominator for percentages)
const FRAME_COUNT_KEYS: NumericObsKey[] = [
  'eggsFrames',
  'uncappedBroodFrames',
  'cappedBroodFrames',
  'droneBroodFrames',
  'pollenFrames',
  'nectarFrames',
  'honeyFrames',
  'emptyFrames',
];

const TREND_FIELDS: {
  key: NumericObsKey;
  shortLabel: string;
  color: string;
  isFrameCount: boolean;
}[] = [
  { key: 'strength',            shortLabel: 'Strength', color: '#6366f1', isFrameCount: false },
  { key: 'eggsFrames',          shortLabel: 'Eggs',     color: '#facc15', isFrameCount: true  },
  { key: 'uncappedBroodFrames', shortLabel: 'Uncapped', color: '#fb923c', isFrameCount: true  },
  { key: 'cappedBroodFrames',   shortLabel: 'Capped',   color: '#b45309', isFrameCount: true  },
  { key: 'droneBroodFrames',    shortLabel: 'Drone',    color: '#92400e', isFrameCount: true  },
  { key: 'pollenFrames',        shortLabel: 'Pollen',   color: '#22c55e', isFrameCount: true  },
  { key: 'nectarFrames',        shortLabel: 'Nectar',   color: '#f97316', isFrameCount: true  },
  { key: 'honeyFrames',         shortLabel: 'Honey',    color: '#eab308', isFrameCount: true  },
  { key: 'emptyFrames',         shortLabel: 'Space',    color: '#cbd5e1', isFrameCount: true  },
  { key: 'queenCells',          shortLabel: 'Q. Cells', color: '#f43f5e', isFrameCount: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStartDate(): Date {
  return subMonths(new Date(), 6);
}

function frameSum(obs: NonNullable<ObservationSchemaType>): number {
  return FRAME_COUNT_KEYS.reduce(
    (sum, key) => sum + ((obs[key] as number | null | undefined) ?? 0),
    0,
  );
}

interface ChipData {
  shortLabel: string;
  color: string;
  current: number;
  delta: number | null;
  unit: '%' | '';
}

interface ChipDataWithKey extends ChipData {
  fieldKey: NumericObsKey;
}

// ─── Stat items ───────────────────────────────────────────────────────────────

const CompactStatItem = ({ shortLabel, color, current, delta, unit }: ChipData) => (
  <div className="min-w-[80px]">
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs text-muted-foreground">{shortLabel}</span>
    </div>
    <div className="flex items-baseline gap-1 mt-0.5">
      <span className="text-xl font-bold tabular-nums">{current}{unit}</span>
      <TrendIndicator delta={delta} unit={unit} iconSize="h-3 w-3" />
    </div>
  </div>
);

const MobileStatItem = ({ shortLabel, color, current, delta, unit }: ChipData) => (
  <div className="flex items-baseline gap-0.5">
    <span className="h-1.5 w-1.5 rounded-full self-center shrink-0" style={{ backgroundColor: color }} />
    <span className="text-xs text-muted-foreground">{shortLabel}:</span>
    <span className="text-sm font-semibold tabular-nums">{current}{unit}</span>
    <TrendIndicator delta={delta} unit={unit} iconSize="h-3 w-3" showDelta={false} />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const HiveHeaderStats = ({ hiveId }: { hiveId: string }) => {
  const { data: inspections } = useInspections({ hiveId });

  const chips = useMemo<ChipDataWithKey[]>(() => {
    if (!inspections) return [];

    const startDate = getStartDate();

    const eligible = inspections
      .filter(i => {
        if (i.status === InspectionStatus.SCHEDULED) return false;
        if (new Date(i.date) < startDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const result: ChipDataWithKey[] = [];

    // ── Frame count fields: all anchored to the same two inspections ──
    // so percentages share a common denominator and can't exceed 100% in total.
    const withFrameData = eligible.filter(
      i => i.observations != null && frameSum(i.observations) > 0,
    );

    if (withFrameData.length >= 1) {
      const latest   = withFrameData[0];
      const previous = withFrameData[1];

      const frameFields = TREND_FIELDS.filter(f => f.isFrameCount);

      const currentCounts  = frameFields.map(f => (latest.observations?.[f.key]   as number | null | undefined) ?? 0);
      const previousCounts = previous
        ? frameFields.map(
            f =>
              (previous.observations?.[f.key] as number | null | undefined) ?? 0,
          )
        : null;

      // Round all fields together so their percentages always sum to exactly 100
      const currentPcts  = largestRemainder(currentCounts,  frameSum(latest.observations!));
      const previousPcts =
        previousCounts && previous?.observations
          ? largestRemainder(previousCounts, frameSum(previous.observations))
          : null;

      frameFields.forEach((field, i) => {
        // Skip fields with no data in either inspection
        if (currentCounts[i] === 0 && (previousCounts?.[i] ?? 0) === 0) return;

        result.push({
          fieldKey: field.key,
          shortLabel: field.shortLabel,
          color: field.color,
          current: currentPcts[i],
          delta: previousPcts ? currentPcts[i] - previousPcts[i] : null,
          unit: '%',
        });
      });
    }

    // ── Raw fields: find the two most recent inspections per field ──
    for (const field of TREND_FIELDS.filter(f => !f.isFrameCount)) {
      const withData = eligible.filter(i => i.observations?.[field.key] != null);
      if (withData.length < 1) continue;

      const current  = withData[0].observations![field.key];
      const previous = withData[1]?.observations?.[field.key];

      result.push({
        fieldKey: field.key,
        shortLabel: field.shortLabel,
        color: field.color,
        current,
        delta: previous != null ? current - previous : null,
        unit: '',
      });
    }

    // Preserve the TREND_FIELDS order regardless of which block produced each chip
    result.sort(
      (a, b) =>
        TREND_FIELDS.findIndex(f => f.key === a.fieldKey) -
        TREND_FIELDS.findIndex(f => f.key === b.fieldKey),
    );

    return result;
  }, [inspections]);

  if (chips.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">Brood Nest Stats</p>
      {/* Mobile: compact inline list — shown below md (768px) */}
      <div className="md:hidden flex items-center gap-x-3 gap-y-1 flex-wrap">
        {chips.map(chip => (
          <MobileStatItem
            key={chip.fieldKey}
            shortLabel={chip.shortLabel}
            color={chip.color}
            current={chip.current}
            delta={chip.delta}
            unit={chip.unit}
          />
        ))}
      </div>

      {/* Desktop: wraps to at most 2 rows before handing off to mobile view */}
      <div className="hidden md:flex md:flex-wrap gap-x-4 gap-y-3">
        {chips.map(chip => (
          <CompactStatItem
            key={chip.fieldKey}
            shortLabel={chip.shortLabel}
            color={chip.color}
            current={chip.current}
            delta={chip.delta}
            unit={chip.unit}
          />
        ))}
      </div>
    </div>
  );
};
