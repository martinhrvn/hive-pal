import { HiveStatus } from './hive-status';
import { Activity, AlertTriangle } from 'lucide-react';
import { TrendIndicator } from '@/components/common/trend-indicator';
import { Card, CardTitle } from '@/components/ui/card';
import { ViewDetailsLink } from '@/components/ui/view-details-link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HiveResponse } from 'shared-schemas';
import { AlertsPopover } from '@/components/alerts';
import { useHive } from '@/api/hooks/useHives';
import { useActions } from '@/api/hooks/useActions';
import {
  calculateFeedingTotals,
  isWithinFeedingWindow,
} from '@/utils/feeding-calculations';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildBoxGradient } from '@/utils/box-gradient';
import { useImageDisplayStore } from '@/stores/image-display-store';
import { useApiary } from '@/hooks/use-apiary';
import { WARNING_LABELS } from '@/utils/warning-labels';

type HiveListProps = {
  hives: HiveResponse[];
};

const HiveCard: React.FC<{ hive: HiveResponse; isSubjective: boolean }> = ({ hive, isSubjective }) => {
  const { t } = useTranslation(['hive']);
  const { data: hiveDetails } = useHive(hive.id, { staleTime: 5 * 60 * 1000 });
  const { data: actions } = useActions(
    { hiveId: hive.id },
    {
      staleTime: 5 * 60 * 1000,
      enabled: isWithinFeedingWindow(hiveDetails?.settings),
    },
  );

  const feedingInfo = useMemo(() => {
    if (!actions) return null;

    // Use settings if available, otherwise the utility functions will use defaults
    const settings = hiveDetails?.settings || undefined;
    const isInWindow = isWithinFeedingWindow(settings);
    if (!isInWindow) return null;

    const totals = calculateFeedingTotals(actions, settings);
    const optimalAmount = settings?.autumnFeeding?.amountKg ?? 12;

    return {
      fed: totals.autumnSugarKg,
      optimal: optimalAmount,
      percentage: Math.round((totals.autumnSugarKg / optimalAmount) * 100),
    };
  }, [actions, hiveDetails?.settings]);

  const formatLastInspectionDate = (dateString?: string) => {
    if (!dateString) return t('hive:card.noInspection');
    const date = new Date(dateString);
    return t('hive:card.lastInspected', { date: date.toLocaleDateString() });
  };

  const featurePhotoUrl = hive.featurePhotoUrl || hiveDetails?.featurePhotoUrl;
  const { mode: imageMode } = useImageDisplayStore();
  const isSide = imageMode === 'side';

  const strengthDisplay = !isSubjective && hive.lastInspectionStrength != null ? (() => {
    const current = hive.lastInspectionStrength;
    const total   = hive.lastInspectionTotalFrames;
    const delta   = hive.previousInspectionStrength != null
      ? current - hive.previousInspectionStrength
      : null;
    return (
      <div className="flex items-center gap-1 text-sm">
        <span className="text-xs text-muted-foreground">{t('hive:card.strength')}</span>
        <span className="font-semibold tabular-nums">
          {current}{total != null && `/${total}`}
        </span>
        <TrendIndicator delta={delta} iconSize="h-3.5 w-3.5" />
      </div>
    );
  })() : null;

  const imageElement = imageMode !== 'hidden' ? (
    featurePhotoUrl ? (
      <img
        src={featurePhotoUrl}
        alt={`${hive.name} feature photo`}
        className={isSide
          ? 'w-full sm:w-[140px] h-32 sm:h-auto min-h-[120px] object-cover flex-shrink-0'
          : 'w-full h-32 object-cover'}
      />
    ) : (
      <div
        className={isSide
          ? 'w-full sm:w-[140px] h-32 sm:h-auto min-h-[120px]  flex-shrink-0'
          : 'w-full h-32 '}
        style={{ background: buildBoxGradient(hiveDetails?.boxes) }}
      />
    )
  ) : null;

  return (
    <Card className={`overflow-hidden gap-0 py-0 ${isSide ? 'flex flex-col sm:flex-row' : ''}`}>
      {imageElement}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 py-3 flex-1 min-w-0">
        {/* Row 1: Name + Status/Score */}
        <div className="min-w-0">
          <CardTitle className="truncate">{hive.name}</CardTitle>
          <p className="text-xs text-gray-500">
            {formatLastInspectionDate(hive.lastInspectionDate)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {isSubjective ? (
              hive.lastInspectionOverallScore != null && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-xs text-muted-foreground">{t('hive:card.score')}</span>
                  <span className="font-semibold tabular-nums">
                    {hive.lastInspectionOverallScore.toFixed(1)}/10
                  </span>
                </div>
              )
            ) : (
              strengthDisplay
            )}
            <HiveStatus status={hive.status} />
          </div>

          {hive.lastInspectionWarnings.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                  aria-label="Inspection warnings"
                >
                  <AlertTriangle className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    {t('hive:card.inspectionWarnings')}
                  </h4>
                  <ul className="space-y-1">
                      {hive.lastInspectionWarnings.map(w => (
                        <li key={w} className="text-sm text-muted-foreground">
                        {WARNING_LABELS[w] ?? w}
                      </li>
                    ))}
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Row 2: Notes + Feeding */}
        <p className="text-xs/5 text-gray-400 truncate">
          {hive.notes ?? t('hive:fields.noNotes')}
        </p>
        {feedingInfo ? (
          <div className="flex items-center justify-end gap-1 text-sm">
            <Activity className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="font-medium">
              {feedingInfo.fed.toFixed(1)}/{feedingInfo.optimal}kg
            </span>
            <span className="text-xs text-gray-500">
              ({feedingInfo.percentage}%)
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Row 3: Alerts + Details link */}
        <AlertsPopover alerts={hive.alerts || []} />
        <div className="flex justify-end items-center">
          <ViewDetailsLink to={`/hives/${hive.id}`}>
            {t('hive:card.showDetails', 'Show details')}
          </ViewDetailsLink>
        </div>
      </div>
    </Card>
  );
};

export const HiveList: React.FC<HiveListProps> = ({ hives }) => {
  const { activeApiary } = useApiary();
  const isSubjective = activeApiary?.settings?.inspectionType === 'subjective';

  return (
    <div>
      <div className={'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        {hives.map(hive => (
          <HiveCard key={hive.id} hive={hive} isSubjective={isSubjective} />
        ))}
      </div>
    </div>
  );
};
