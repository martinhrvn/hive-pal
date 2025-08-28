import { useState } from 'react';
import { HiveScore } from 'shared-schemas';
import { InspectionCharts } from './inspection-charts';
import { FeedingChart } from './feeding-chart';
import { TreatmentChart } from './treatment-chart';
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

interface HiveChartsProps {
  hiveId: string | undefined;
  hiveScore?: HiveScore | null;
}

export const HiveCharts: React.FC<HiveChartsProps> = ({
  hiveId,
  hiveScore,
}) => {
  const [period, setPeriod] = useState<ChartPeriod>('6months');
  
  if (!hiveId) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={period} onValueChange={(value) => setPeriod(value as ChartPeriod)}>
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InspectionCharts hiveId={hiveId} period={period} />
        <HealthScoreChart hiveScore={hiveScore} />
        <FeedingChart hiveId={hiveId} period={period} />
        <TreatmentChart hiveId={hiveId} period={period} />
      </div>
    </div>
  );
};

export { InspectionCharts } from './inspection-charts';
export { FeedingChart } from './feeding-chart';
export { TreatmentChart } from './treatment-chart';
export { HealthScoreChart } from './health-score-chart';
