import {
  addWeeks,
  isWithinInterval,
  subWeeks,
  format,
  formatDistanceToNow,
} from 'date-fns';
import { useState, useCallback } from 'react';
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
import { useNavigate } from 'react-router-dom';
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
import { useQueryClient } from '@tanstack/react-query';

type InspectionTimelineProps = {
  inspections: InspectionResponse[];
};

export const InspectionTimeline: React.FC<InspectionTimelineProps> = ({
  inspections,
}) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const MAX_DISPLAYED = 5;
  const { data: hives } = useHives();
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
    const hive = hives?.find(h => h.id === hiveId);
    return hive ? hive.name : 'Unknown Hive';
  };

  const handleInspectionUpdate = () => {
    // Invalidate inspection queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['inspections'] });
  };

  const formatDate = useCallback((date: Date | string): string => {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    const twoWeehsAgo = subWeeks(new Date(), 2);
    const twoWeeksFromNow = addWeeks(new Date(), 2);

    if (
      isWithinInterval(parsedDate, { start: twoWeehsAgo, end: twoWeeksFromNow })
    ) {
      return formatDistanceToNow(parsedDate, { addSuffix: true });
    }
    return format(parsedDate, 'MMM d, yyyy');
  }, []);

  const formatTime = useCallback((date: Date | string) => {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return format(parsedDate, 'h:mm a');
  }, []);

  // Helpers for color classes
  const getStrengthColor = (value: number | null) => {
    if (value === null) return '';
    if (value >= 7) return 'text-green-600';
    if (value >= 4) return 'text-amber-500';
    return 'text-red-500';
  };

  const getHoneyColor = (value: number | null) => {
    if (value === null) return '';
    if (value >= 7) return 'text-green-600';
    if (value >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBroodColor = (value: number | null) => {
    if (value === null) return '';
    if (value >= 6) return 'text-green-600';
    if (value >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  // Get the highest priority metrics if available
  const calculateBroodScore = (inspection: InspectionResponse) => {
    const cappedBrood = inspection.observations?.cappedBrood ?? null;
    const uncappedBrood = inspection.observations?.uncappedBrood ?? null;

    if (cappedBrood !== null && uncappedBrood !== null) {
      return ((cappedBrood + uncappedBrood) / 2).toFixed(1);
    }
    return cappedBrood !== null ? cappedBrood : uncappedBrood;
  };

  return (
    <div className="space-y-4">
      {displayedInspections.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          No inspections recorded yet.
        </p>
      ) : (
        <>
          {/* Show scheduled inspections header if any exist */}
          {sortedScheduled.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Scheduled Inspections</span>
            </div>
          )}

          {displayedInspections.map((inspection, index) => {
            const prevInspection =
              index > 0 ? displayedInspections[index - 1] : null;
            const showDivider =
              prevInspection?.status === InspectionStatus.SCHEDULED &&
              inspection.status !== InspectionStatus.SCHEDULED;

            return (
              <div key={inspection.id}>
                {/* Show divider between scheduled and completed inspections */}
                {showDivider && (
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-6 mb-4">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Completed Inspections</span>
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
                            <CalendarIcon
                              size={16}
                              className="text-muted-foreground"
                            />
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
                                className="text-gray-600 border-gray-600"
                              >
                                Cancelled
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
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/inspections/${inspection.id}`)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View details
                              </DropdownMenuItem>
                              {inspection.status !==
                                InspectionStatus.CANCELLED && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(
                                      `/inspections/${inspection.id}/edit`,
                                    )
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Key metrics */}
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <ActivityIcon
                              size={16}
                              className="text-muted-foreground"
                            />
                            <span className="text-sm">Strength:</span>
                            <span
                              className={`font-semibold ${getStrengthColor(inspection.observations?.strength ?? null)}`}
                            >
                              {inspection.observations?.strength ?? '—'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <DropletsIcon
                              size={16}
                              className="text-muted-foreground"
                            />
                            <span className="text-sm">Honey:</span>
                            <span
                              className={`font-semibold ${getHoneyColor(inspection.observations?.honeyStores ?? null)}`}
                            >
                              {inspection.observations?.honeyStores ?? '—'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <EggIcon
                              size={16}
                              className="text-muted-foreground"
                            />
                            <span className="text-sm">Brood:</span>
                            <span
                              className={`font-semibold ${getBroodColor(calculateBroodScore(inspection) as number | null)}`}
                            >
                              {calculateBroodScore(inspection) ?? '—'}
                            </span>
                          </div>
                        </div>

                        {/* Weather if available */}
                        {(inspection.temperature ||
                          inspection.weatherConditions) && (
                          <div className="text-sm text-muted-foreground mb-2">
                            Weather:{' '}
                            {inspection.temperature
                              ? `${inspection.temperature}°`
                              : ''}
                            {inspection.weatherConditions
                              ? inspection.temperature
                                ? `, ${inspection.weatherConditions}`
                                : inspection.weatherConditions
                              : ''}
                          </div>
                        )}

                        {/* Queen seen indicator */}
                        {inspection.observations?.queenSeen !== null && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">
                              Queen:{' '}
                            </span>
                            <span
                              className={
                                inspection.observations?.queenSeen
                                  ? 'text-green-600'
                                  : 'text-amber-500'
                              }
                            >
                              {inspection.observations?.queenSeen
                                ? 'Seen'
                                : 'Not seen'}
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
                              Notes available
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
                  ? 'Show fewer'
                  : `Show all ${sortedInspections.length} inspections`}
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
