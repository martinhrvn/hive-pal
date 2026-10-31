import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useCalendar } from '@/api/hooks/useCalendar';
import { useOverdueInspections } from '@/api/hooks/useInspections';
import { useHives } from '@/api/hooks/useHives';
import { InspectionResponse } from 'shared-schemas';
import { format, isBefore, isSameDay, startOfDay } from 'date-fns';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { getDateLocale } from '@/utils/locale-utils.ts';
import { cn } from '@/lib/utils';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
} from '@/components/sidebar';

type InspectionState = 'completed' | 'overdue' | 'today' | 'upcoming';

const inspectionStateClass: Record<InspectionState, string> = {
  completed: 'border-success/25 bg-success-muted text-success-foreground',
  overdue: 'border-destructive/25 bg-destructive/5 text-destructive-foreground',
  today: 'border-warning/30 bg-warning-muted text-warning-foreground',
  upcoming: 'bg-muted/50 text-foreground/80',
};

const getInspectionState = (
  inspection: InspectionResponse,
  todayStart: Date,
): InspectionState => {
  if (inspection.status === 'COMPLETED') return 'completed';
  const date = new Date(inspection.date);
  if (isBefore(date, todayStart)) return 'overdue';
  if (isSameDay(date, todayStart)) return 'today';
  return 'upcoming';
};

// ActionType enum value → common:actionTypes key, e.g. BOX_CONFIGURATION → boxConfiguration.
const actionTypeKey = (type: string) =>
  type.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const DOT_CLASS =
  'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:rounded-full';

export const CalendarSidebar = () => {
  const { t, i18n } = useTranslation(['common', 'inspection']);
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

  const hiveNameMap = useMemo(
    () => new Map(hives?.map(hive => [hive.id, hive.name])),
    [hives],
  );
  const getHiveName = (hiveId: string) =>
    hiveNameMap.get(hiveId) ??
    t('common:calendar.unknownHive', { defaultValue: 'Unknown hive' });

  // One pass over the month: calendar dot modifiers + a by-date lookup.
  const { modifiers, eventsByDate } = useMemo(() => {
    const inspectionsOnly: Date[] = [];
    const actionsOnly: Date[] = [];
    const both: Date[] = [];
    const byDate = new Map<string, NonNullable<typeof monthEvents>[number]>();
    for (const event of monthEvents ?? []) {
      byDate.set(event.date, event);
      const hasInspections = event.inspections.length > 0;
      const hasActions = event.standaloneActions.length > 0;
      const date = new Date(event.date);
      if (hasInspections && hasActions) both.push(date);
      else if (hasInspections) inspectionsOnly.push(date);
      else if (hasActions) actionsOnly.push(date);
    }
    return {
      modifiers: {
        hasInspectionsOnly: inspectionsOnly,
        hasActionsOnly: actionsOnly,
        hasBoth: both,
      },
      eventsByDate: byDate,
    };
  }, [monthEvents]);

  const dayEvents = eventsByDate.get(format(selectedDate, 'yyyy-MM-dd'));
  const inspections = dayEvents?.inspections ?? [];
  const standaloneActions = dayEvents?.standaloneActions ?? [];
  const totalEvents = inspections.length + standaloneActions.length;
  const todayStart = startOfDay(new Date());
  const isToday = isSameDay(selectedDate, todayStart);

  const dayTitle = (
    <span className="inline-flex w-full items-center gap-2">
      {formatDayHeader(selectedDate)}
      {isToday && (
        <span className="rounded-full bg-honey-muted px-1.5 py-px text-xs font-medium normal-case tracking-normal text-honey-foreground">
          {t('common:calendar.today', { defaultValue: 'Today' })}
        </span>
      )}
      {totalEvents > 0 && (
        <span className="ml-auto text-xs font-medium normal-case tracking-normal tabular-nums text-muted-foreground">
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
          modifiers={modifiers}
          modifiersClassNames={{
            hasInspectionsOnly: cn(DOT_CLASS, 'after:w-1 after:bg-honey'),
            hasActionsOnly: cn(DOT_CLASS, 'after:w-1 after:bg-success'),
            hasBoth: cn(
              DOT_CLASS,
              'after:w-2 after:bg-gradient-to-r after:from-honey after:to-success',
            ),
          }}
        />

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-honey" />
            {t('common:calendar.inspections')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success" />
            {t('common:calendar.actions')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-2 rounded-full bg-gradient-to-r from-honey to-success" />
            {t('common:calendar.both')}
          </span>
        </div>
      </ActionSidebarGroup>

      <ActionSidebarGroup title={dayTitle}>
        {totalEvents === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">
            {t('common:calendar.noEvents', { defaultValue: 'No events' })}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto px-1">
            {inspections.map(inspection => {
              const state = getInspectionState(inspection, todayStart);
              return (
                <div
                  key={`inspection-${inspection.id}`}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-xs',
                    inspectionStateClass[state],
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    {state === 'overdue' && (
                      <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                    )}
                    {state === 'today' && (
                      <Clock className="size-3 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/hives/${inspection.hiveId}`}
                        className="font-medium hover:underline truncate"
                      >
                        {getHiveName(inspection.hiveId)}
                      </Link>
                      <span className="ml-1.5 font-overline opacity-70">
                        {t(
                          `inspection:status.${inspection.status.toLowerCase()}`,
                          { defaultValue: inspection.status.toLowerCase() },
                        )}
                      </span>
                      {inspection.notes && (
                        <p className="mt-0.5 opacity-80 truncate">
                          {inspection.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {standaloneActions.map(action => (
              <div
                key={`action-${action.id}`}
                className="rounded-md border border-success/25 bg-success-muted px-2 py-1.5 text-xs text-success-foreground"
              >
                {action.hiveId ? (
                  <Link
                    to={`/hives/${action.hiveId}`}
                    className="font-medium hover:underline truncate"
                  >
                    {getHiveName(action.hiveId)}
                  </Link>
                ) : null}
                <span className="ml-1.5 font-overline opacity-70">
                  {t(`common:actionTypes.${actionTypeKey(action.type)}`, {
                    defaultValue: action.type.toLowerCase().replace(/_/g, ' '),
                  })}
                </span>
                {action.notes && (
                  <p className="mt-0.5 opacity-80 truncate">{action.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </ActionSidebarGroup>

      {overdueInspections && overdueInspections.length > 0 && (
        <ActionSidebarGroup
          className="bg-destructive/[0.03]"
          title={
            <span className="inline-flex items-center gap-1.5 text-destructive-foreground">
              <AlertTriangle className="size-3" />
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
                className={cn(
                  'rounded-md border px-2 py-1.5 text-xs',
                  inspectionStateClass.overdue,
                )}
              >
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/hives/${inspection.hiveId}`}
                      className="font-medium hover:underline truncate"
                    >
                      {getHiveName(inspection.hiveId)}
                    </Link>
                    <span className="ml-1.5 font-overline opacity-70">
                      {formatDayHeader(new Date(inspection.date))}
                    </span>
                    {inspection.notes && (
                      <p className="mt-0.5 opacity-80 truncate">
                        {inspection.notes}
                      </p>
                    )}
                    <Link
                      to={`/inspections/${inspection.id}`}
                      className="group mt-1 inline-flex items-center gap-1 font-medium hover:underline"
                    >
                      {t('common:calendar.viewInspection', {
                        defaultValue: 'View Inspection',
                      })}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
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
