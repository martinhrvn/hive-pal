import { InspectionResponseDto } from 'api-client';
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
  ChevronRightIcon,
  ActivityIcon,
  DropletsIcon,
  EggIcon,
  ChevronDownIcon,
  FileTextIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type InspectionTimelineProps = {
  inspections: InspectionResponseDto[];
};

export const InspectionTimeline: React.FC<InspectionTimelineProps> = ({
  inspections,
}) => {
  const [showAll, setShowAll] = useState(false);
  const MAX_DISPLAYED = 5;

  // Sort inspections by date (newest first)
  const sortedInspections = [...inspections].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const displayedInspections = showAll
    ? sortedInspections
    : sortedInspections.slice(0, MAX_DISPLAYED);

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
  const calculateBroodScore = (inspection: InspectionResponseDto) => {
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
          {displayedInspections.map(inspection => (
            <Card key={inspection.id} className="overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-muted-foreground" />
                    <span className="font-medium">
                      {formatDate(inspection.date)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      at {formatTime(inspection.date)}
                    </span>
                  </div>
                  <Link
                    to={`/inspections/${inspection.id}`}
                    className="text-primary flex items-center space-x-1 text-sm font-medium hover:underline"
                  >
                    <span>View details</span>
                    <ChevronRightIcon size={16} />
                  </Link>
                </div>
              </div>

              <div className="p-4">
                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <ActivityIcon size={16} className="text-muted-foreground" />
                    <span className="text-sm">Strength:</span>
                    <span
                      className={`font-semibold ${getStrengthColor(inspection.observations?.strength ?? null)}`}
                    >
                      {inspection.observations?.strength ?? '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropletsIcon size={16} className="text-muted-foreground" />
                    <span className="text-sm">Honey:</span>
                    <span
                      className={`font-semibold ${getHoneyColor(inspection.observations?.honeyStores ?? null)}`}
                    >
                      {inspection.observations?.honeyStores ?? '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <EggIcon size={16} className="text-muted-foreground" />
                    <span className="text-sm">Brood:</span>
                    <span
                      className={`font-semibold ${getBroodColor(calculateBroodScore(inspection) as number | null)}`}
                    >
                      {calculateBroodScore(inspection) ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Weather if available */}
                {(inspection.temperature || inspection.weatherConditions) && (
                  <div className="text-sm text-muted-foreground mb-2">
                    Weather:{' '}
                    {inspection.temperature ? `${inspection.temperature}°` : ''}
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
                    <span className="text-muted-foreground">Queen: </span>
                    <span
                      className={
                        inspection.observations?.queenSeen
                          ? 'text-green-600'
                          : 'text-amber-500'
                      }
                    >
                      {inspection.observations?.queenSeen ? 'Seen' : 'Not seen'}
                    </span>
                  </div>
                )}

                {/* Notes indicator */}
                {inspection.notes && (
                  <div className="mt-2 text-sm flex items-center gap-1">
                    <FileTextIcon size={14} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Notes available
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}

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
