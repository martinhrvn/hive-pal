import { HiveStatus } from './hive-status';
import { ChevronRight, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HiveResponse } from 'shared-schemas';
import { useHive } from '@/api/hooks/useHives';
import { useActions } from '@/api/hooks/useActions';
import {
  calculateFeedingTotals,
  isWithinFeedingWindow,
} from '@/utils/feeding-calculations';
import { useMemo } from 'react';

type HiveListProps = {
  hives: HiveResponse[];
};

const HiveCard: React.FC<{ hive: HiveResponse }> = ({ hive }) => {
  const { data: hiveDetails } = useHive(hive.id, { staleTime: 5 * 60 * 1000 });
  const { data: actions } = useActions(
    { hiveId: hive.id },
    { staleTime: 5 * 60 * 1000 },
  );

  const feedingInfo = useMemo(() => {
    if (!actions || !hiveDetails?.settings) return null;

    const isInWindow = isWithinFeedingWindow(hiveDetails.settings);
    if (!isInWindow) return null;

    const totals = calculateFeedingTotals(actions, hiveDetails.settings);
    const optimalAmount = hiveDetails.settings.autumnFeeding?.amountKg ?? 12;

    return {
      fed: totals.autumnSugarKg,
      optimal: optimalAmount,
      percentage: Math.round((totals.autumnSugarKg / optimalAmount) * 100),
    };
  }, [actions, hiveDetails?.settings]);

  const formatLastInspectionDate = (dateString?: string) => {
    if (!dateString) return 'No inspection yet';
    const date = new Date(dateString);
    return `Last inspected ${date.toLocaleDateString()}`;
  };

  return (
    <Card>
      <CardHeader className={'flex justify-between flex-row'}>
        <div className="flex flex-col">
          <CardTitle>{hive.name}</CardTitle>
          <p className="text-xs text-gray-500 font-normal">
            {formatLastInspectionDate(hive.lastInspectionDate)}
          </p>
        </div>
        <HiveStatus status={hive.status} />
      </CardHeader>

      <CardContent className="space-y-3">
        <div className={'flex items-start flex-col'}>
          <div className={'flex items-center text-gray-400'}>
            <p className={'col-start-1 text-xs/6'}>
              {hive.notes ?? 'No notes'}
            </p>
          </div>
        </div>

        {/* Hive Score */}
        {hiveDetails?.hiveScore?.overallScore !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Score:</span>
            <span className="font-medium">
              {hiveDetails.hiveScore.overallScore}/100
            </span>
          </div>
        )}

        {/* Feeding Status (only during feeding window) */}
        {feedingInfo && (
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">Feeding:</span>
            <span className="font-medium">
              {feedingInfo.fed.toFixed(1)}kg / {feedingInfo.optimal}kg
            </span>
            <span className="text-xs text-gray-500">
              ({feedingInfo.percentage}%)
            </span>
          </div>
        )}

        <p className={'col-start-1 flex'}>
          <a href={`/hives/${hive.id}`} className={'flex gap-4'}>
            Show details <ChevronRight />
          </a>
        </p>
      </CardContent>
    </Card>
  );
};

export const HiveList: React.FC<HiveListProps> = ({ hives }) => {
  return (
    <div>
      <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        {hives.map(hive => (
          <HiveCard key={hive.id} hive={hive} />
        ))}
      </div>
    </div>
  );
};
