import { useState } from 'react';
import { FeedingChart } from './feeding-chart';
import { FrameBreakdownChart } from './frame-breakdown-chart';
import { BroodNestChart } from './brood-nest-chart';
import { StoresChart } from './stores-chart';
import { StrengthChart } from './strength-chart';
import { QueenCellsChart } from './queen-cells-chart';
import { BooleanEventsChart } from './boolean-events-chart';
import { InspectionCharts } from './inspection-charts';
import { HealthScoreChart } from './health-score-chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

export type ChartPeriod = '1month' | '3months' | '6months' | 'ytd' | 'all';

import type { HiveScore } from 'shared-schemas';

interface HiveChartsProps {
  hiveId: string | undefined;
  inspectionType?: 'subjective' | 'data_driven';
  hiveScore?: HiveScore | null;
}

export const HiveCharts: React.FC<HiveChartsProps> = ({
  hiveId,
  inspectionType,
  hiveScore,
}) => {
  const [period, setPeriod] = useState<ChartPeriod>('6months');
  const isSubjective = (inspectionType ?? 'data_driven') === 'subjective';

  if (!hiveId) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={period}
          onValueChange={value => setPeriod(value as ChartPeriod)}
        >
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last month</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isSubjective ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InspectionCharts hiveId={hiveId} period={period} />
          <HealthScoreChart hiveScore={hiveScore} />
          <FeedingChart hiveId={hiveId} period={period} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Frame composition — full width, toggle + field selector */}
          <FrameBreakdownChart hiveId={hiveId} period={period} />

          {/* Brood nest — full width */}
          <BroodNestChart hiveId={hiveId} period={period} />

          {/* Stores + Strength side by side */}
          <StoresChart hiveId={hiveId} period={period} />
          <StrengthChart hiveId={hiveId} period={period} />

          {/* Queen cells */}
          <QueenCellsChart hiveId={hiveId} period={period} />

          {/* Boolean events */}
          <BooleanEventsChart hiveId={hiveId} period={period} />

          {/* Feeding */}
          <FeedingChart hiveId={hiveId} period={period} />
        </div>
      )}
    </div>
  );
};

export { FeedingChart } from './feeding-chart';
export { FrameBreakdownChart } from './frame-breakdown-chart';
