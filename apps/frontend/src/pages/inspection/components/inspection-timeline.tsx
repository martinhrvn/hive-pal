import { addWeeks, isWithinInterval, subWeeks } from 'date-fns';
import { useState } from 'react';
import {
  CalendarIcon,
  ActivityIcon,
  DropletsIcon,
  EggIcon,
  ChevronDownIcon,
  FileTextIcon,
  Clock,
  MoreVertical,
  Eye,
  Edit,
} from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InspectionResponse, InspectionStatus } from 'shared-schemas';
import { ScheduledInspectionCard } from './scheduled-inspection-card';
import { useHives } from '@/api/hooks';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import { useQueryClient } from '@tanstack/react-query';
import { ScoreLevelCue } from '@/components/common/score-level-cue';
import { useDateFormat } from '@/hooks/use-date-format';
import { formatRelativeTime } from '@/utils/relative-time';
import {
  getScoreLevelTextClass,
  SCORE_LEVEL_THRESHOLDS,
  type ScoreThresholds,
} from '@/lib/score-level';

type InspectionTimelineProps = {
  inspections: InspectionResponse[];
};

const STRENGTH_THRESHOLDS: ScoreThresholds = { good: 7, fair: 4 };
const HONEY_THRESHOLDS: ScoreThresholds = { good: 7, fair: 3 };

const formatWeather = (
  temperature: number | null | undefined,
  conditions: string | null | undefined,
): string =>
  [temperature == null ? null : `${temperature}°`, conditions || null]
    .filter(Boolean)
    .join(', ');

/** Highest-priority brood metric: 0–10 ratings when available. */
const calculateBroodScore = (inspection: InspectionResponse): number | null => {
  const cappedBrood = inspection.observations?.cappedBrood ?? null;
  const uncappedBrood = inspection.observations?.uncappedBrood ?? null;

  if (cappedBrood !== null && uncappedBrood !== null) {
    return Number(((cappedBrood + uncappedBrood) / 2).toFixed(1));
  }
  return cappedBrood ?? uncappedBrood;
};

export const InspectionTimeline: React.FC<InspectionTimelineProps> = ({
  inspections,
}) => {
  const { t, i18n } = useTranslation('inspection');
  const {
    formatDate: formatDateByPreference,
    formatTime: formatTimeByPreference,
  } = useDateFormat();
  const { canEditApiary } = useApiaryPermission();
  const [showAll, setShowAll] = useState(false);
  const MAX_DISPLAYED = 5;
  const { data: hives } = useHives();
  const hiveById = new Map((hives ?? []).map(hive => [hive.id, hive] as const));
  const queryClient = useQueryClient();

  // Separate scheduled and completed inspections
  const scheduledInspections = inspections.filter(
    inspection => inspection.status === InspectionStatus.SCHEDULED,
  );

  const completedInspections = inspections.filter(
    inspection => inspection.status !== InspectionStatus.SCHEDULED,
  );

  // Sort inspections by date
  const sortedScheduled = [...scheduledInspections].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(), // Earliest first for scheduled
  );

  const sortedCompleted = [...completedInspections].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(), // Newest first for completed
  );

  // Combine scheduled (at top) and completed
  const sortedInspections = [...sortedScheduled, ...sortedCompleted];

  const displayedInspections = showAll
    ? sortedInspections
    : sortedInspections.slice(0, MAX_DISPLAYED);

  const getHiveName = (hiveId: string) => {
    const hive = hiveById.get(hiveId);
    return hive ? hive.name : t('inspection:timeline.unknownHive');
  };

  const handleInspectionUpdate = () => {
    // Invalidate inspection queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['inspections'] });
  };

  const formatDate = (date: Date | string): string => {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    const twoWeeksAgo = subWeeks(new Date(), 2);
    const twoWeeksFromNow = addWeeks(new Date(), 2);

    if (
      isWithinInterval(parsedDate, { start: twoWeeksAgo, end: twoWeeksFromNow })
    ) {
      return (
        formatRelativeTime(parsedDate, i18n.language) ??
        formatDateByPreference(parsedDate)
      );
    }
    return formatDateByPreference(parsedDate);
  };

  const formatTime = (date: Date | string) => formatTimeByPreference(date);

  return (
    <div className="space-y-4">
      {displayedInspections.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          {t('inspection:timeline.noInspections')}
        </p>
      ) : (
        <>
          {/* Show scheduled inspections header if any exist */}
          {sortedScheduled.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              <span>{t('inspection:timeline.scheduledInspections')}</span>
            </div>
          )}

          {displayedInspections.map((inspection, index) => {
            const prevInspection =
              index > 0 ? displayedInspections[index - 1] : null;
            const showDivider =
              prevInspection?.status === InspectionStatus.SCHEDULED &&
              inspection.status !== InspectionStatus.SCHEDULED;
            const broodScore = calculateBroodScore(inspection);
            const strength = inspection.observations?.strength ?? null;
            const honeyStores = inspection.observations?.honeyStores ?? null;

            return (
              <div key={inspection.id}>
                {/* Show divider between scheduled and completed inspections */}
                {showDivider && (
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-6 mb-4">
                    <CalendarIcon className="size-4" />
                    <span>{t('inspection:timeline.completedInspections')}</span>
                  </div>
                )}

                {(() => {
                  // Use ScheduledInspectionCard for scheduled inspections
                  if (inspection.status === InspectionStatus.SCHEDULED) {
                    return (
                      <ScheduledInspectionCard
                        inspection={inspection}
                        hiveName={getHiveName(inspection.hiveId)}
                        onUpdate={handleInspectionUpdate}
                      />
                    );
                  }

                  // Regular card for completed inspections
                  return (
                    <Card className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatDate(inspection.date)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(inspection.date)}
                            </span>
                            {inspection.status ===
                              InspectionStatus.CANCELLED && (
                              <Badge
                                variant="outline"
                                className="border-muted-foreground/40 text-muted-foreground"
                              >
                                {t('inspection:timeline.cancelled')}
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="size-4" />
                                <span className="sr-only">
                                  {t('common:actions.openMenu')}
                                </span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem asChild>
                                <Link to={`/inspections/${inspection.id}`}>
                                  <Eye className="size-4 mr-2" />
                                  {t('inspection:timeline.viewDetails')}
                                </Link>
                              </DropdownMenuItem>
                              {canEditApiary(
                                hiveById.get(inspection.hiveId)?.apiaryId,
                              ) &&
                                inspection.status !==
                                  InspectionStatus.CANCELLED && (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      to={`/inspections/${inspection.id}/edit`}
                                    >
                                      <Edit className="size-4 mr-2" />
                                      {t('inspection:timeline.edit')}
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Key metrics */}
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <ActivityIcon className="size-4 text-muted-foreground" />
                            <span className="text-sm">
                              {t('inspection:timeline.strength')}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${getScoreLevelTextClass(
                                strength,
                                STRENGTH_THRESHOLDS,
                              )}`}
                            >
                              <ScoreLevelCue
                                value={strength}
                                thresholds={STRENGTH_THRESHOLDS}
                                iconClassName="size-3"
                              />
                              {strength ?? '—'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <DropletsIcon className="size-4 text-muted-foreground" />
                            <span className="text-sm">
                              {t('inspection:timeline.honey')}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${getScoreLevelTextClass(
                                honeyStores,
                                HONEY_THRESHOLDS,
                              )}`}
                            >
                              <ScoreLevelCue
                                value={honeyStores}
                                thresholds={HONEY_THRESHOLDS}
                                iconClassName="size-3"
                              />
                              {honeyStores ?? '—'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <EggIcon className="size-4 text-muted-foreground" />
                            <span className="text-sm">
                              {t('inspection:timeline.brood')}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${getScoreLevelTextClass(
                                broodScore,
                                SCORE_LEVEL_THRESHOLDS,
                              )}`}
                            >
                              <ScoreLevelCue
                                value={broodScore}
                                thresholds={SCORE_LEVEL_THRESHOLDS}
                                iconClassName="size-3"
                              />
                              {broodScore ?? '—'}
                            </span>
                          </div>
                        </div>

                        {/* Weather if available */}
                        {(inspection.temperature ||
                          inspection.weatherConditions) && (
                          <div className="text-sm text-muted-foreground mb-2">
                            {t('inspection:timeline.weather')}{' '}
                            {formatWeather(
                              inspection.temperature,
                              inspection.weatherConditions,
                            )}
                          </div>
                        )}

                        {/* Queen seen indicator */}
                        {inspection.observations?.queenSeen !== null && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">
                              {t('inspection:timeline.queen')}{' '}
                            </span>
                            <span
                              className={
                                inspection.observations?.queenSeen
                                  ? 'text-success-foreground'
                                  : 'text-warning-foreground'
                              }
                            >
                              {inspection.observations?.queenSeen
                                ? t('inspection:timeline.queenSeen')
                                : t('inspection:timeline.queenNotSeen')}
                            </span>
                          </div>
                        )}

                        {/* Notes indicator */}
                        {inspection.notes && (
                          <div className="mt-2 text-sm flex items-center gap-1">
                            <FileTextIcon
                              size={14}
                              className="text-muted-foreground"
                            />
                            <span className="text-muted-foreground">
                              {t('inspection:timeline.notesAvailable')}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })()}
              </div>
            );
          })}

          {/* Show more/less button */}
          {sortedInspections.length > MAX_DISPLAYED && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="text-sm"
              >
                {showAll
                  ? t('inspection:timeline.showFewer')
                  : t('inspection:timeline.showAllCount', {
                      count: sortedInspections.length,
                    })}
                <ChevronDownIcon
                  className={`ml-2 h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
                />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
