import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCalendar } from '@/api/hooks/useCalendar';
import { useOverdueInspections } from '@/api/hooks/useInspections';
import { useHives } from '@/api/hooks/useHives';
import { InspectionResponse } from 'shared-schemas';
import { format, isBefore, isSameDay, startOfDay } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CalendarSidebar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch events for the entire month for calendar marking
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const monthStart = format(
    new Date(currentYear, currentMonth, 1),
    'yyyy-MM-dd',
  );
  const monthEnd = format(
    new Date(currentYear, currentMonth + 1, 0),
    'yyyy-MM-dd',
  );

  const { data: monthEvents } = useCalendar({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Fetch overdue inspections
  const { data: overdueInspections } = useOverdueInspections();

  // Fetch all hives to create a lookup map for hive names
  const { data: hives } = useHives();

  // Create a lookup map for hive ID to hive name
  const hiveNameMap =
    hives?.reduce(
      (acc, hive) => {
        acc[hive.id] = hive.name;
        return acc;
      },
      {} as Record<string, string>,
    ) || {};

  // Helper function to get hive display name
  const getHiveName = (hiveId: string) => {
    return hiveNameMap[hiveId] || `Hive ${hiveId}`;
  };

  // Get dates that have events for calendar marking
  const datesWithInspections =
    monthEvents
      ?.filter(event => event.inspections.length > 0)
      .map(event => new Date(event.date)) || [];
  const datesWithActions =
    monthEvents
      ?.filter(event => event.standaloneActions.length > 0)
      .map(event => new Date(event.date)) || [];
  const datesWithBoth =
    monthEvents
      ?.filter(
        event =>
          event.inspections.length > 0 && event.standaloneActions.length > 0,
      )
      .map(event => new Date(event.date)) || [];

  // Get events for selected date
  const getEventsForSelectedDate = () => {
    if (!monthEvents) return { inspections: [], standaloneActions: [] };

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayEvents = monthEvents.find(event => event.date === dateKey);

    return {
      inspections: dayEvents?.inspections || [],
      standaloneActions: dayEvents?.standaloneActions || [],
    };
  };

  const getStatusColor = (inspection: InspectionResponse) => {
    const inspectionDate = new Date(inspection.date);
    const today = new Date();

    if (inspection.status === 'COMPLETED') {
      return 'bg-green-100 text-green-800 border-green-200';
    }

    if (isBefore(inspectionDate, startOfDay(today))) {
      return 'bg-red-100 text-red-800 border-red-200';
    }

    if (isSameDay(inspectionDate, today)) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }

    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStatusIcon = (inspection: InspectionResponse) => {
    const inspectionDate = new Date(inspection.date);
    const today = new Date();

    if (inspection.status === 'COMPLETED') {
      return null;
    }

    if (isBefore(inspectionDate, startOfDay(today))) {
      return <AlertTriangle className="h-3 w-3" />;
    }

    if (isSameDay(inspectionDate, today)) {
      return <Clock className="h-3 w-3" />;
    }

    return null;
  };

  const { inspections, standaloneActions } = getEventsForSelectedDate();
  const totalEvents = inspections.length + standaloneActions.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4" />
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date: Date | undefined) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
              className="w-full"
              modifiers={{
                hasInspectionsOnly: datesWithInspections.filter(
                  d => !datesWithBoth.some(b => isSameDay(b, d)),
                ),
                hasActionsOnly: datesWithActions.filter(
                  d => !datesWithBoth.some(b => isSameDay(b, d)),
                ),
                hasBoth: datesWithBoth,
              }}
              modifiersClassNames={{
                hasInspectionsOnly:
                  'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-500 after:rounded-full cursor-pointer hover:bg-blue-50',
                hasActionsOnly:
                  'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-purple-500 after:rounded-full cursor-pointer hover:bg-purple-50',
                hasBoth:
                  'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-1 after:bg-gradient-to-r after:from-blue-500 after:to-purple-500 after:rounded-full cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50',
              }}
            />

            {/* Legend */}
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Inspections</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Actions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <span>Both</span>
              </div>
            </div>
          </div>

          {/* Events for selected date */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">
                {format(selectedDate, 'MMM d')}
                {isSameDay(selectedDate, new Date()) && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Today
                  </Badge>
                )}
              </h4>
              {totalEvents > 0 && (
                <div className="flex gap-1">
                  {inspections.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {inspections.length}
                    </Badge>
                  )}
                  {standaloneActions.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {standaloneActions.length}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {totalEvents === 0 ? (
              <p className="text-xs text-muted-foreground">No events</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* Render Inspections */}
                {inspections.map(inspection => (
                  <div
                    key={`inspection-${inspection.id}`}
                    className={`p-2 rounded border ${getStatusColor(inspection)} text-xs`}
                  >
                    <div className="flex items-start gap-1">
                      {getStatusIcon(inspection)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/hives/${inspection.hiveId}`}
                            className="font-medium hover:underline truncate flex items-center gap-1"
                          >
                            {getHiveName(inspection.hiveId)}
                            <ExternalLink className="h-2 w-2" />
                          </Link>
                          <Badge variant="outline" className="text-xs">
                            {inspection.status.toLowerCase()}
                          </Badge>
                        </div>
                        {inspection.notes && (
                          <p className="text-xs mt-1 opacity-90 truncate">
                            {inspection.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Render Standalone Actions */}
                {standaloneActions.map(action => (
                  <div
                    key={`action-${action.id}`}
                    className="p-2 rounded border bg-purple-50 text-purple-900 border-purple-200 text-xs"
                  >
                    <div className="flex items-start gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/hives/${action.hiveId}`}
                            className="font-medium hover:underline truncate flex items-center gap-1"
                          >
                            {getHiveName(action.hiveId ?? '')}
                            <ExternalLink className="h-2 w-2" />
                          </Link>
                          <Badge variant="outline" className="text-xs">
                            {action.type.toLowerCase()}
                          </Badge>
                        </div>
                        {action.notes && (
                          <p className="text-xs mt-1 opacity-90 truncate">
                            {action.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Overdue Inspections Section */}
            {overdueInspections && overdueInspections.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h4 className="text-sm font-medium text-red-600">
                    Overdue Inspections ({overdueInspections.length})
                  </h4>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {overdueInspections.map(inspection => (
                    <div
                      key={`overdue-${inspection.id}`}
                      className="p-2 rounded border bg-red-50 text-red-900 border-red-200 text-xs"
                    >
                      <div className="flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/hives/${inspection.hiveId}`}
                              className="font-medium hover:underline truncate flex items-center gap-1"
                            >
                              {getHiveName(inspection.hiveId)}
                              <ExternalLink className="h-2 w-2" />
                            </Link>
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(inspection.date), 'MMM d')}
                            </Badge>
                          </div>
                          {inspection.notes && (
                            <p className="text-xs mt-1 opacity-90 truncate">
                              {inspection.notes}
                            </p>
                          )}
                          <div className="mt-1">
                            <Link
                              to={`/inspections/${inspection.id}`}
                              className="text-xs text-red-700 hover:text-red-900 hover:underline flex items-center gap-1"
                            >
                              View Inspection
                              <ExternalLink className="h-2 w-2" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
