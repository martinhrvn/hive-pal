import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useCalendar } from '@/api/hooks/useCalendar';
import { useOverdueInspections } from '@/api/hooks/useInspections';
import { useHives } from '@/api/hooks/useHives';
import { InspectionResponse } from 'shared-schemas';
import { format, isBefore, isSameDay, startOfDay } from 'date-fns';
import {
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDateLocale } from '@/utils/locale-utils.ts';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
} from '@/components/sidebar';

export const CalendarSidebar = () => {
  const { t, i18n } = useTranslation('common');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  const dateLocale = getDateLocale(i18n.language);
  const formatDayHeader = (date: Date) =>
    format(date, 'MMM d', { locale: dateLocale });

  const { data: overdueInspections } = useOverdueInspections();
  const { data: hives } = useHives();

  const hiveNameMap =
    hives?.reduce(
      (acc, hive) => {
        acc[hive.id] = hive.name;
        return acc;
      },
      {} as Record<string, string>,
    ) || {};

  const getHiveName = (hiveId: string) =>
    hiveNameMap[hiveId] || `Hive ${hiveId}`;

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

  const getEventsForSelectedDate = () => {
    if (!monthEvents) return { inspections: [], standaloneActions: [] };
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayEvents = monthEvents.find(event => event.date === dateKey);
    return {
      inspections: dayEvents?.inspections || [],
      standaloneActions: dayEvents?.standaloneActions || [],
    };
  };

  const getStatusTone = (inspection: InspectionResponse) => {
    const inspectionDate = new Date(inspection.date);
    const today = new Date();
    if (inspection.status === 'COMPLETED') {
      return 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300';
    }
    if (isBefore(inspectionDate, startOfDay(today))) {
      return 'border-red-200 bg-red-50/70 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300';
    }
    if (isSameDay(inspectionDate, today)) {
      return 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200';
    }
    return 'border-stone-200 bg-stone-50/70 text-stone-700 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-200';
  };

  const getStatusIcon = (inspection: InspectionResponse) => {
    const inspectionDate = new Date(inspection.date);
    const today = new Date();
    if (inspection.status === 'COMPLETED') return null;
    if (isBefore(inspectionDate, startOfDay(today))) {
      return <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />;
    }
    if (isSameDay(inspectionDate, today)) {
      return <Clock className="h-3 w-3 shrink-0 mt-0.5" />;
    }
    return null;
  };

  const { inspections, standaloneActions } = getEventsForSelectedDate();
  const totalEvents = inspections.length + standaloneActions.length;
  const isToday = isSameDay(selectedDate, new Date());

  const dayTitle = (
    <span className="inline-flex items-center gap-2">
      {formatDayHeader(selectedDate)}
      {isToday && (
        <span className="rounded-full bg-amber-100 dark:bg-amber-950/40 px-1.5 py-px text-[10px] tracking-normal font-medium text-amber-800 dark:text-amber-300 normal-case">
          {t('common:calendar.today', { defaultValue: 'Today' })}
        </span>
      )}
      {totalEvents > 0 && (
        <span className="ml-auto text-[10px] tabular-nums tracking-normal font-medium text-stone-500 normal-case">
          {totalEvents}
        </span>
      )}
    </span>
  );

  return (
    <ActionSidebarContainer>
      <ActionSidebarGroup
        title={t('common:calendar.title', { defaultValue: 'Calendar' })}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          locale={dateLocale}
          onSelect={(date: Date | undefined) => {
            if (date) setSelectedDate(date);
          }}
          className="w-full p-0"
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
              'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-amber-500 after:rounded-full',
            hasActionsOnly:
              'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-emerald-500 after:rounded-full',
            hasBoth:
              'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-1 after:bg-gradient-to-r after:from-amber-500 after:to-emerald-500 after:rounded-full',
          }}
        />

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-[11px] text-stone-500 dark:text-stone-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t('common:calendar.inspections')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('common:calendar.actions')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500" />
            {t('common:calendar.both')}
          </span>
        </div>
      </ActionSidebarGroup>

      <ActionSidebarGroup title={dayTitle}>
        {totalEvents === 0 ? (
          <p className="px-2 text-xs italic text-stone-400 dark:text-stone-500">
            {t('common:calendar.noEvents', { defaultValue: 'No events' })}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto px-1">
            {inspections.map(inspection => (
              <div
                key={`inspection-${inspection.id}`}
                className={`rounded-md border px-2 py-1.5 text-xs ${getStatusTone(inspection)}`}
              >
                <div className="flex items-start gap-1.5">
                  {getStatusIcon(inspection)}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/hives/${inspection.hiveId}`}
                      className="font-medium hover:underline truncate inline-flex items-center gap-1"
                    >
                      {getHiveName(inspection.hiveId)}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-70">
                      {inspection.status.toLowerCase()}
                    </span>
                    {inspection.notes && (
                      <p className="text-[11px] mt-0.5 opacity-80 truncate">
                        {inspection.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {standaloneActions.map(action => (
              <div
                key={`action-${action.id}`}
                className="rounded-md border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30 px-2 py-1.5 text-xs text-emerald-900 dark:text-emerald-300"
              >
                <Link
                  to={`/hives/${action.hiveId}`}
                  className="font-medium hover:underline truncate inline-flex items-center gap-1"
                >
                  {getHiveName(action.hiveId ?? '')}
                  <ExternalLink className="h-2.5 w-2.5" />
                </Link>
                <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-70">
                  {action.type.toLowerCase()}
                </span>
                {action.notes && (
                  <p className="text-[11px] mt-0.5 opacity-80 truncate">
                    {action.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </ActionSidebarGroup>

      {overdueInspections && overdueInspections.length > 0 && (
        <ActionSidebarGroup
          className="bg-red-50/30 dark:bg-red-950/10"
          title={
            <span className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {t('common:calendar.overdueInspections', {
                overdueInspectionsSize: overdueInspections.length,
                defaultValue:
                  'Overdue Inspections ({{overdueInspectionsSize}})',
              })}
            </span>
          }
        >
          <div className="space-y-1.5 max-h-32 overflow-y-auto px-1">
            {overdueInspections.map(inspection => (
              <div
                key={`overdue-${inspection.id}`}
                className="rounded-md border border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/30 px-2 py-1.5 text-xs text-red-900 dark:text-red-300"
              >
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/hives/${inspection.hiveId}`}
                      className="font-medium hover:underline truncate inline-flex items-center gap-1"
                    >
                      {getHiveName(inspection.hiveId)}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider opacity-70">
                      {formatDayHeader(new Date(inspection.date))}
                    </span>
                    {inspection.notes && (
                      <p className="text-[11px] mt-0.5 opacity-80 truncate">
                        {inspection.notes}
                      </p>
                    )}
                    <Link
                      to={`/inspections/${inspection.id}`}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium hover:underline"
                    >
                      {t('common:calendar.viewInspection', {
                        defaultValue: 'View Inspection',
                      })}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ActionSidebarGroup>
      )}
    </ActionSidebarContainer>
  );
};
