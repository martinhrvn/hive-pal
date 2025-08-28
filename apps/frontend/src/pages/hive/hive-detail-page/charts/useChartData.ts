import { useMemo } from 'react';
import { subMonths, startOfYear } from 'date-fns';
import { useInspections, useActions } from '@/api/hooks';
import {
  InspectionStatus,
  InspectionResponse,
  ActionResponse,
} from 'shared-schemas';
import { ChartPeriod } from './index';

function getStartDate(period: ChartPeriod): Date | null {
  const now = new Date();

  switch (period) {
    case '1month':
      return subMonths(now, 1);
    case '3months':
      return subMonths(now, 3);
    case '6months':
      return subMonths(now, 6);
    case 'ytd':
      return startOfYear(now);
    case 'all':
      return null;
  }
}

export function useInspectionChartData<R>(
  hiveId: string | undefined,
  period: ChartPeriod,
  transform: (inspection: InspectionResponse) => R,
  additionalFilter?: (inspection: InspectionResponse) => boolean,
) {
  const { data: inspections } = useInspections(hiveId ? { hiveId } : undefined);

  return useMemo(() => {
    if (!inspections) return [];

    const startDate = getStartDate(period);

    return inspections
      .filter(inspection => {
        // Base filters
        if (inspection.status === InspectionStatus.SCHEDULED) return false;
        if (!inspection.score) return false;

        // Date filter
        if (startDate && new Date(inspection.date) < startDate) return false;

        // Additional custom filter
        if (additionalFilter && !additionalFilter(inspection)) return false;

        return true;
      })
      .map(transform)
      .reverse();
  }, [inspections, period, transform, additionalFilter]);
}

export function useActionChartData<R>(
  hiveId: string | undefined,
  period: ChartPeriod,
  actionType: string | ((action: ActionResponse) => boolean),
  transform: (actions: ActionResponse[]) => R,
) {
  const { data: actions } = useActions(hiveId ? { hiveId } : undefined, {
    enabled: !!hiveId,
  });

  return useMemo(() => {
    if (!actions) return transform([]);

    const startDate = getStartDate(period);

    const filteredActions = actions.filter(action => {
      // Type filter
      if (typeof actionType === 'string') {
        if (action.type !== actionType) return false;
      } else if (!actionType(action)) {
        return false;
      }

      // Date filter
      if (startDate && new Date(action.date) < startDate) return false;

      return true;
    });

    return transform(filteredActions);
  }, [actions, period, actionType, transform]);
}
