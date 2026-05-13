import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { SlidersHorizontal } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChartPeriod } from './index';
import { useInspectionChartData } from './useChartData';
import { InspectionResponse } from 'shared-schemas';
import { FRAME_FIELDS, FrameFieldKey } from '@/constants/frame-fields';

interface FrameBreakdownChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

type FrameKey = FrameFieldKey;

function hasFrameData(inspection: InspectionResponse): boolean {
  const obs = inspection.observations;
  return (
    obs?.totalFrames != null &&
    obs.totalFrames > 0 &&
    FRAME_FIELDS.some(ft => obs[ft.obsKey] != null)
  );
}

const chartConfig = Object.fromEntries(
  FRAME_FIELDS.map(ft => [ft.key, { label: ft.label, color: ft.color }]),
);

export const FrameBreakdownChart: React.FC<FrameBreakdownChartProps> = ({
  hiveId,
  period,
}) => {
  const [selected, setSelected] = useState<Set<FrameKey>>(
    new Set(FRAME_FIELDS.map(ft => ft.key)),
  );

  const transform = (inspection: InspectionResponse) => {
    const obs = inspection.observations;
    const entry: Record<string, string | number | null> = {
      date: format(parseISO(inspection.date), 'MMM dd'),
    };

    for (const ft of FRAME_FIELDS) {
      entry[ft.key] = obs?.[ft.obsKey] ?? null;
    }

    return entry;
  };

  const chartData = useInspectionChartData(hiveId, period, transform, hasFrameData);

  const toggleField = (key: FrameKey) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (!hiveId || chartData.length === 0) return null;

  const activeTypes = FRAME_FIELDS.filter(ft => selected.has(ft.key));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Frame Composition</CardTitle>
            <CardDescription>Raw frame counts by content over time</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Field selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Fields
                </Button>
              </PopoverTrigger>
               <PopoverContent className="w-48 p-2" align="end">
                 <div className="space-y-1">
                   {FRAME_FIELDS.map(ft => (
                    <label
                      key={ft.key}
                      className="flex items-center gap-2 rounded px-2 py-1 cursor-pointer hover:bg-muted text-sm"
                    >
                      <Checkbox
                        checked={selected.has(ft.key)}
                        onCheckedChange={() => toggleField(ft.key)}
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ft.color }}
                      />
                      {ft.label}
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {activeTypes.map(ft => (
              <Line
                key={ft.key}
                type="monotone"
                dataKey={ft.key}
                stroke={`var(--color-${ft.key})`}
                strokeWidth={2}
                connectNulls
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
