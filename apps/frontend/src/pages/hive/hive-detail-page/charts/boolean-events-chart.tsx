import { format, parseISO } from 'date-fns';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BaseInspectionChart } from './base-inspection-chart';
import { ChartPeriod } from './index';
import { InspectionResponse } from 'shared-schemas';

interface BooleanEventsChartProps {
  hiveId: string | undefined;
  period: ChartPeriod;
}

// Y-axis categories — numeric position for each event type
const EVENT_ROWS = [
  { key: 'queenSeen',        label: 'Queen Seen',         y: 3, color: '#a855f7' },
  { key: 'swarmCells',       label: 'Swarm Cells',        y: 2, color: '#f43f5e' },
  { key: 'supersedureCells', label: 'Supersedure Cells',  y: 1, color: '#f97316' },
] as const;

type EventKey = (typeof EVENT_ROWS)[number]['key'];

function hasEventData(inspection: InspectionResponse): boolean {
  const obs = inspection.observations;
  return (
    obs != null &&
    (obs.queenSeen != null || obs.swarmCells != null || obs.supersedureCells != null)
  );
}

export const BooleanEventsChart: React.FC<BooleanEventsChartProps> = ({
  hiveId,
  period,
}) => {
  return (
    <BaseInspectionChart
      hiveId={hiveId}
      period={period}
      title="Events"
      description="Boolean events recorded per inspection — dots indicate the event was observed"
      config={Object.fromEntries(
        EVENT_ROWS.map(ev => [ev.key, { label: ev.label, color: ev.color }]),
      )}
      dataTransformer={inspection => ({
        date: format(parseISO(inspection.date), 'MMM dd'),
        queenSeen: inspection.observations?.queenSeen ?? null,
        swarmCells: inspection.observations?.swarmCells ?? null,
        supersedureCells: inspection.observations?.supersedureCells ?? null,
      })}
      filterFn={hasEventData}
    >
      {(rawData) => {
        // Build one scatter point per (date, event) where the event is true
        const scatterByEvent: Record<EventKey, { date: string; y: number }[]> = {
          queenSeen: [],
          swarmCells: [],
          supersedureCells: [],
        };

        for (const row of rawData) {
          for (const ev of EVENT_ROWS) {
            if (row[ev.key] === true) {
              scatterByEvent[ev.key].push({ date: row.date as string, y: ev.y });
            }
          }
        }

        const yTicks = EVENT_ROWS.map(ev => ev.y);
        const yTickFormatter = (v: number) =>
          EVENT_ROWS.find(ev => ev.y === v)?.label ?? '';

        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
            <YAxis
              dataKey="y"
              type="number"
              domain={[0, 4]}
              ticks={yTicks}
              tickFormatter={yTickFormatter}
              width={120}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(_, name) => {
                    const ev = EVENT_ROWS.find(e => e.key === name);
                    return ev ? ev.label : name;
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {EVENT_ROWS.map(ev => (
              <Scatter
                key={ev.key}
                name={ev.key}
                data={scatterByEvent[ev.key]}
                fill={ev.color}
              >
                {scatterByEvent[ev.key].map(point => (
                  <Cell key={point.date} fill={ev.color} />
                ))}
              </Scatter>
            ))}
          </ScatterChart>
        );
      }}
    </BaseInspectionChart>
  );
};
