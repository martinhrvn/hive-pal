import { useState, useEffect, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCalendar } from '@/api/hooks/useCalendar';
import { InspectionResponse } from 'shared-schemas';
import {
  format,
  startOfDay,
  addDays,
  isBefore,
  isSameDay,
  subDays,
  addWeeks,
  subWeeks,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get inspections for a broader date range to cover the 7-day view
  const startDate = format(startOfDay(selectedDate), 'yyyy-MM-dd');
  const endDate = format(addDays(startOfDay(selectedDate), 6), 'yyyy-MM-dd');

  // Also fetch events for the entire month for the calendar marking
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

  const { data: calendarEvents, isLoading } = useCalendar({
    startDate,
    endDate,
  });

  const { data: monthEvents } = useCalendar({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Generate 7 days starting from selected date
  const generateDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(startOfDay(selectedDate), i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (date: Date) => {
    if (!calendarEvents) return { inspections: [], standaloneActions: [] };

    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEvents = calendarEvents.find(event => event.date === dateKey);

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

  const days = generateDays();

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

  const handlePreviousWeek = useCallback(() => {
    setSelectedDate(subWeeks(selectedDate, 1));
  }, [selectedDate]);

  const handleNextWeek = useCallback(() => {
    setSelectedDate(addWeeks(selectedDate, 1));
  }, [selectedDate]);

  const handlePreviousDay = useCallback(() => {
    setSelectedDate(subDays(selectedDate, 1));
  }, [selectedDate]);

  const handleNextDay = useCallback(() => {
    setSelectedDate(addDays(selectedDate, 1));
  }, [selectedDate]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return; // Don't intercept when user is typing in inputs
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePreviousDay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextDay();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handlePreviousWeek();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleNextWeek();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setSelectedDate(new Date());
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedDate,
    handlePreviousDay,
    handleNextDay,
    handlePreviousWeek,
    handleNextWeek,
  ]);

  return (
    <Page>
      <MainContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')} - 7 Day View
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousDay}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Day
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextDay}
                className="flex items-center gap-1"
              >
                Next Day
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                className="flex items-center gap-1"
              >
                Next Week
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4">
              {days.map(day => {
                const { inspections: dayInspections, standaloneActions } =
                  getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const totalEvents =
                  dayInspections.length + standaloneActions.length;

                return (
                  <Card
                    key={day.toISOString()}
                    className={isToday ? 'ring-2 ring-blue-200' : ''}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {format(day, 'EEEE, MMMM d')}
                          {isToday && (
                            <Badge variant="outline" className="text-xs">
                              Today
                            </Badge>
                          )}
                        </span>
                        {totalEvents > 0 && (
                          <div className="flex gap-2">
                            {dayInspections.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {dayInspections.length} inspection
                                {dayInspections.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {standaloneActions.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {standaloneActions.length} action
                                {standaloneActions.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {totalEvents === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No events scheduled
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {/* Render Inspections */}
                          {dayInspections.map(inspection => (
                            <div
                              key={`inspection-${inspection.id}`}
                              className={`p-3 rounded-lg border ${getStatusColor(inspection)}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(inspection)}
                                    <Link
                                      to={`/hives/${inspection.hiveId}`}
                                      className="font-medium hover:underline flex items-center gap-1"
                                    >
                                      Hive {inspection.hiveId}
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      inspection
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {inspection.status.toLowerCase()}
                                    </Badge>
                                  </div>
                                  {inspection.notes && (
                                    <p className="text-sm mt-2 opacity-90">
                                      {inspection.notes}
                                    </p>
                                  )}
                                  <div className="mt-2 flex gap-2">
                                    <Link
                                      to={`/inspections/${inspection.id}`}
                                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                    >
                                      View Inspection
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  </div>
                                </div>
                              </div>

                              {inspection.actions &&
                                inspection.actions.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-current/20">
                                    <p className="text-xs opacity-75">
                                      Actions:{' '}
                                      {inspection.actions
                                        .map(a => a.type)
                                        .join(', ')}
                                    </p>
                                  </div>
                                )}
                            </div>
                          ))}

                          {/* Render Standalone Actions */}
                          {standaloneActions.map(action => (
                            <div
                              key={`action-${action.id}`}
                              className="p-3 rounded-lg border bg-purple-50 text-purple-900 border-purple-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Link
                                      to={`/hives/${action.hiveId}`}
                                      className="font-medium hover:underline flex items-center gap-1"
                                    >
                                      Hive {action.hiveId}
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {action.type.toLowerCase()}
                                    </Badge>
                                  </div>
                                  {action.notes && (
                                    <p className="text-sm mt-2 opacity-90">
                                      {action.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </MainContent>

      <Sidebar>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date: Date | undefined) => {
                if (date) {
                  setSelectedDate(date);
                  // Optionally scroll to top when a new date is selected
                  window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="mt-4 space-y-2 text-xs">
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
          </CardContent>
        </Card>
      </Sidebar>
    </Page>
  );
};
