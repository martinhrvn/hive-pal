import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/use-date-format';
import { CalendarDays, CheckCircle, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/common/status-pill';
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
  const { t, i18n } = useTranslation(['common', 'inspection']);
  const { formatTime } = useDateFormat();
  const inspectionDate = getInspectionDisplayDate(inspection);
  const shortDate = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
  }).format(inspectionDate);
  const checkpointPrefix = t('common:swarmManagement.planner.checkpointPrefix');
  const checkpointLabel = inspection.notes?.startsWith(checkpointPrefix)
    ? inspection.notes.split('\n')[0]?.trim()
    : null;

  return (
    <div className="flex items-start justify-between gap-2 rounded-md border bg-card p-2 text-sm">
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 text-muted-foreground tabular-nums">
          <span>{shortDate}</span>
          {!inspection.isAllDay && <span>{formatTime(inspectionDate)}</span>}
          <StatusPill tone="info" size="sm">
            {t('inspection:status.pending', 'Scheduled')}
          </StatusPill>
        </div>
        <span className="font-medium text-foreground">
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
          <Button variant="ghost" size="icon" className="size-7 shrink-0 -mr-1">
            <MoreVertical className="size-4" />
            <span className="sr-only">
              {t('common:actions.openMenu', 'Open menu')}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onDoInspection(inspection)}>
            <CheckCircle className="size-4 mr-2" />
            {t('common:timeline.doInspection')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onReschedule(inspection)}>
            <CalendarDays className="size-4 mr-2" />
            {t('common:timeline.reschedule')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
