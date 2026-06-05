import { useTranslation } from 'react-i18next';
import { CalendarDays, CheckCircle, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InspectionResponse } from 'shared-schemas';
import { getInspectionDisplayDate } from '@/utils/inspection-display-date';

interface UpcomingInspectionListItemProps {
  inspection: InspectionResponse;
  hiveName: string;
  onDoInspection: (inspection: InspectionResponse) => void;
  onReschedule: (inspection: InspectionResponse) => void;
}

/**
 * Compact card row for a single upcoming inspection, shown in the apiary
 * header and inspection status summary widgets.
 */
export const UpcomingInspectionListItem: React.FC<
  UpcomingInspectionListItemProps
> = ({ inspection, hiveName, onDoInspection, onReschedule }) => {
  const { t } = useTranslation(['common', 'inspection']);
  const inspectionDate = getInspectionDisplayDate(inspection);
  const checkpointPrefix = t('common:swarmManagement.planner.checkpointPrefix');
  const checkpointLabel = inspection.notes?.startsWith(checkpointPrefix)
    ? inspection.notes.split('\n')[0]?.trim()
    : null;

  return (
    <div className="flex items-start justify-between gap-2 text-sm p-2 rounded-md bg-blue-50 border border-blue-100">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{format(inspectionDate, 'MMM d')}</span>
          {!inspection.isAllDay && (
            <span>{format(inspectionDate, 'HH:mm')}</span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
            {t('inspection:status.pending', 'Scheduled')}
          </span>
        </div>
        <span className="font-medium text-blue-700">
          {t('common:timeline.inspectHive', { hiveName })}
        </span>
        {checkpointLabel && (
          <span className="truncate text-xs text-muted-foreground">
            {checkpointLabel}
          </span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1">
            <MoreVertical className="h-3 w-3" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onDoInspection(inspection)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('common:timeline.doInspection')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onReschedule(inspection)}>
            <CalendarDays className="h-4 w-4 mr-2" />
            {t('common:timeline.reschedule')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
