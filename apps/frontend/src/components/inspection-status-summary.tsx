import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CalendarDays, Clock } from 'lucide-react';
import {
  useOverdueInspections,
  useDueTodayInspections,
  useUpcomingInspections,
} from '@/api/hooks/useInspections';
import { useScheduledInspectionActions } from '@/api/hooks/useScheduledInspectionActions';
import { useHives } from '@/api/hooks';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UpcomingInspectionListItem } from '@/components/upcoming-inspection-list-item';

export const InspectionStatusSummary: React.FC = () => {
  const { t } = useTranslation(['inspection', 'common']);
  const navigate = useNavigate();

  const { data: overdueInspections, isLoading: overdueLoading } =
    useOverdueInspections();
  const { data: dueTodayInspections, isLoading: dueTodayLoading } =
    useDueTodayInspections();
  const { data: upcomingInspections, isLoading: upcomingLoading } =
    useUpcomingInspections(5); // Limit to 5 upcoming
  const { data: hives } = useHives();

  // Create hive name lookup
  const hiveNameMap = useMemo(() => {
    if (!hives) return new Map<string, string>();
    return new Map(hives.map(hive => [hive.id, hive.name]));
  }, [hives]);

  const getHiveName = (hiveId: string) => hiveNameMap.get(hiveId) || hiveId;

  const {
    setReschedulingInspection,
    handleDoInspection,
    rescheduleDialogElement,
  } = useScheduledInspectionActions(getHiveName);

  const isLoading = overdueLoading || dueTodayLoading || upcomingLoading;
  const overdueCount = overdueInspections?.length ?? 0;
  const dueTodayCount = dueTodayInspections?.length ?? 0;
  const upcomingCount = upcomingInspections?.length ?? 0;

  // Don't show anything if there are no inspections to display
  if (
    !isLoading &&
    overdueCount === 0 &&
    dueTodayCount === 0 &&
    upcomingCount === 0
  ) {
    return null;
  }

  const handleViewOverdue = () => {
    navigate('/inspections?status=OVERDUE');
  };

  const handleViewDueToday = () => {
    navigate(
      '/inspections?status=SCHEDULED&date=' +
        new Date().toISOString().split('T')[0],
    );
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground mb-4">
        {t('common:loading')}...
      </div>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden gap-0 py-0 border-none shadow-none">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('inspection:dashboard.title', 'Upcoming Inspections')}
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/calendar">
              <CalendarDays className="h-4 w-4" />
              {t('inspection:dashboard.viewCalendar', 'View calendar')}
            </Link>
          </Button>
        </div>
        <div className="px-4 pb-3 space-y-3">
          {/* Alerts Section */}
          {(overdueCount > 0 || dueTodayCount > 0) && (
            <div className="space-y-2">
              {overdueCount > 0 && (
                <div
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 cursor-pointer"
                  onClick={handleViewOverdue}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    {overdueCount}{' '}
                    {t('inspection:dashboard.overdue', 'overdue')}
                  </span>
                </div>
              )}

              {dueTodayCount > 0 && (
                <div
                  className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 cursor-pointer"
                  onClick={handleViewDueToday}
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {dueTodayCount}{' '}
                    {t('inspection:dashboard.dueToday', 'due today')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Inspections Section */}
          {upcomingCount > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {t('inspection:dashboard.upcoming', 'Upcoming')}
              </h4>
              <div className="space-y-2">
                {upcomingInspections?.map(inspection => (
                  <UpcomingInspectionListItem
                    key={inspection.id}
                    inspection={inspection}
                    hiveName={getHiveName(inspection.hiveId)}
                    onDoInspection={handleDoInspection}
                    onReschedule={setReschedulingInspection}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no alerts but component is shown due to upcoming */}
          {overdueCount === 0 && dueTodayCount === 0 && upcomingCount === 0 && (
            <p className="text-sm text-muted-foreground">
              {t(
                'inspection:dashboard.noInspections',
                'No scheduled inspections',
              )}
            </p>
          )}
        </div>
      </Card>

      {rescheduleDialogElement}
    </>
  );
};
