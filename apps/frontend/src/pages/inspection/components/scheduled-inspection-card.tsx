import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, isToday, isPast, parseISO } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  X,
  Clock,
  AlertTriangle,
  Home,
  Cloud,
  CloudRain,
  Sun,
  Thermometer,
  MoreVertical,
  CalendarClock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { InspectionResponse, InspectionStatus } from 'shared-schemas';
import { useUpdateInspection } from '@/api/hooks/useInspections';
import { RescheduleDialog } from './reschedule-dialog';

interface ScheduledInspectionCardProps {
  inspection: InspectionResponse;
  hiveName: string;
  onUpdate?: () => void;
}

const getWeatherIcon = (condition: string | null | undefined) => {
  if (!condition) return <Thermometer className="h-4 w-4 text-gray-500" />;

  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sunny'))
    return <Sun className="h-4 w-4 text-yellow-500" />;
  if (c.includes('rain'))
    return <CloudRain className="h-4 w-4 text-blue-500" />;
  return <Cloud className="h-4 w-4 text-gray-400" />;
};

export const ScheduledInspectionCard: React.FC<
  ScheduledInspectionCardProps
> = ({ inspection, hiveName, onUpdate }) => {
  const { t } = useTranslation(['inspection']);
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const { mutate: updateInspection, isPending } = useUpdateInspection();

  const inspectionDate = parseISO(inspection.date as string);
  const isOverdue = isPast(inspectionDate) && !isToday(inspectionDate);
  const isTodayInspection = isToday(inspectionDate);

  const handleDoInspection = () => {
    navigate(`/inspections/${inspection.id}/edit?from=scheduled`);
  };

  const handleCancelInspection = () => {
    updateInspection(
      {
        id: inspection.id,
        data: {
          status: InspectionStatus.CANCELLED,
        },
      },
      {
        onSuccess: () => {
          setShowCancelDialog(false);
          onUpdate?.();
        },
      },
    );
  };

  const handleReschedule = (newDate: Date) => {
    updateInspection(
      {
        id: inspection.id,
        data: {
          date: newDate.toISOString(),
          status: InspectionStatus.SCHEDULED,
        },
      },
      {
        onSuccess: () => {
          setShowRescheduleDialog(false);
          onUpdate?.();
        },
      },
    );
  };

  const getStatusBadge = () => {
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t('inspection:scheduled.overdue')}
        </Badge>
      );
    }
    if (isTodayInspection) {
      return (
        <Badge
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
        >
          <Clock className="h-3 w-3" />
          {t('inspection:scheduled.today')}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-blue-600 border-blue-600 flex items-center gap-1"
      >
        <Calendar className="h-3 w-3" />
        {t('inspection:status.scheduled')}
      </Badge>
    );
  };

  return (
    <>
      <Card
        className={cn(
          'transition-all hover:shadow-md',
          isOverdue && 'border-red-200 bg-red-50 dark:bg-red-950/20',
          isTodayInspection && 'border-blue-200 bg-blue-50 dark:bg-blue-950/20',
        )}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Date and Time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span className="font-medium text-foreground">
                  {format(inspectionDate, 'MMM d')}
                </span>
                <span>{format(inspectionDate, 'h:mm a')}</span>
              </div>

              {/* Status Badge */}
              <div className="mb-2">
                {getStatusBadge()}
              </div>

              {/* Hive Name */}
              <div className="flex items-center gap-1 text-sm font-medium truncate">
                <Home className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{hiveName}</span>
              </div>

              {/* Weather (if available) */}
              {(inspection.temperature || inspection.weatherConditions) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  {getWeatherIcon(inspection.weatherConditions)}
                  {inspection.temperature && (
                    <span>{inspection.temperature}°</span>
                  )}
                  {inspection.weatherConditions && (
                    <span className="truncate">{inspection.weatherConditions}</span>
                  )}
                </div>
              )}

              {inspection.notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                  {inspection.notes}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isPending}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleDoInspection}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('inspection:actions.doInspection')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowRescheduleDialog(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('inspection:actions.reschedule')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowCancelDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('inspection:actions.cancel')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('inspection:dialogs.cancelInspection.title')}
            </DialogTitle>
            <DialogDescription>
              {t('inspection:dialogs.cancelInspection.description', {
                hiveName,
                date: format(inspectionDate, 'EEEE, MMMM d, yyyy'),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              {t('inspection:dialogs.cancelInspection.keepInspection')}
            </Button>
            <Button onClick={handleCancelInspection} variant="destructive">
              {t('inspection:dialogs.cancelInspection.cancelInspection')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RescheduleDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        inspection={inspection}
        hiveName={hiveName}
        onReschedule={handleReschedule}
      />
    </>
  );
};
