import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useCreateAction } from '@/api/hooks/useActions';
import {
  ActionResponse,
  ActionType,
  CreateStandaloneAction,
} from 'shared-schemas';
import { toast } from 'sonner';
import { useDateFormat } from '@/hooks/use-date-format';

type MaintenanceComponent = 'BOX' | 'BOTTOM_BOARD' | 'COVER';
type MaintenanceStatus = 'CLEANED' | 'REPLACED';

interface MaintenanceProps {
  hiveId: string;
  component: MaintenanceComponent;
  lastMaintenance?: ActionResponse;
}

/** Shared hook for maintenance action creation */
const useMaintenanceAction = (
  hiveId: string,
  component: MaintenanceComponent,
) => {
  const { t } = useTranslation('inspection');
  const { formatDate } = useDateFormat();
  const [date, setDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const createAction = useCreateAction();

  const handleMaintenance = async (
    status: MaintenanceStatus,
    onSuccess?: () => void,
  ) => {
    const data: CreateStandaloneAction = {
      hiveId,
      type: ActionType.MAINTENANCE,
      details: {
        type: ActionType.MAINTENANCE,
        component,
        status,
      },
      date: date.toISOString(),
    };

    try {
      await createAction.mutateAsync(data);
      toast.success(
        t('inspection:form.actions.maintenance_section.savedToast', {
          status:
            status === 'CLEANED'
              ? t('inspection:form.actions.maintenance_section.cleaned')
              : t('inspection:form.actions.maintenance_section.replaced'),
          date: formatDate(date),
        }),
      );
      onSuccess?.();
    } catch {
      toast.error(t('inspection:form.actions.maintenance_section.saveError'));
    }
  };

  return {
    date,
    setDate,
    showCalendar,
    setShowCalendar,
    handleMaintenance,
    isPending: createAction.isPending,
    formatDate,
  };
};

const getLastMaintenanceLabel = (
  lastMaintenance: ActionResponse | undefined,
  t: (key: string) => string,
  formatDate: (date: Date | string) => string,
) => {
  if (!lastMaintenance) return null;
  const lastDate = formatDate(lastMaintenance.date);
  const lastStatus =
    lastMaintenance.details?.type === 'MAINTENANCE'
      ? lastMaintenance.details.status
      : null;
  const statusKey = lastStatus ? lastStatus.toLowerCase() : 'title';
  const statusLabel = t(
    `inspection:form.actions.maintenance_section.${statusKey}`,
  );
  return `${statusLabel} ${lastDate}`;
};

/** Popover variant — used on cover and bottom board in the stack */
export const MaintenancePopover = ({
  hiveId,
  component,
  lastMaintenance,
}: MaintenanceProps) => {
  const { t } = useTranslation('inspection');
  const [open, setOpen] = useState(false);
  const {
    date,
    setDate,
    showCalendar,
    setShowCalendar,
    handleMaintenance,
    isPending,
    formatDate,
  } = useMaintenanceAction(hiveId, component);

  const label = getLastMaintenanceLabel(lastMaintenance, t, formatDate);

  return (
    <Popover
      open={open}
      onOpenChange={v => {
        setOpen(v);
        if (!v) setShowCalendar(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title={t('inspection:form.actions.maintenance_section.title')}
        >
          <Wrench className="h-3 w-3" />
          {label && <span>{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {t('inspection:form.actions.maintenance_section.title')}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              className={cn(
                'flex items-center gap-1 hover:text-foreground transition-colors',
                showCalendar && 'text-foreground',
              )}
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <CalendarIcon className="h-3 w-3" />
              {formatDate(date)}
            </button>
          </div>

          {showCalendar && (
            <Calendar
              mode="single"
              selected={date}
              onSelect={d => {
                if (d) setDate(d);
                setShowCalendar(false);
              }}
              autoFocus
            />
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                handleMaintenance('CLEANED', () => {
                  setOpen(false);
                  setShowCalendar(false);
                })
              }
            >
              {t('inspection:form.actions.maintenance_section.cleaned')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                handleMaintenance('REPLACED', () => {
                  setOpen(false);
                  setShowCalendar(false);
                })
              }
            >
              {t('inspection:form.actions.maintenance_section.replaced')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Inline variant — used in BoxConfigPanel sidebar */
export const MaintenanceInline = ({
  hiveId,
  component,
  lastMaintenance,
}: MaintenanceProps) => {
  const { t } = useTranslation('inspection');
  const {
    date,
    setDate,
    showCalendar,
    setShowCalendar,
    handleMaintenance,
    isPending,
    formatDate,
  } = useMaintenanceAction(hiveId, component);

  const label = getLastMaintenanceLabel(lastMaintenance, t, formatDate);

  return (
    <div className="space-y-3">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          className={cn(
            'flex items-center gap-1 hover:text-foreground transition-colors',
            showCalendar && 'text-foreground',
          )}
          onClick={() => setShowCalendar(!showCalendar)}
        >
          <CalendarIcon className="h-3 w-3" />
          {formatDate(date)}
        </button>
      </div>

      {showCalendar && (
        <Calendar
          mode="single"
          selected={date}
          onSelect={d => {
            if (d) setDate(d);
            setShowCalendar(false);
          }}
          autoFocus
        />
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleMaintenance('CLEANED')}
        >
          {t('inspection:form.actions.maintenance_section.cleaned')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleMaintenance('REPLACED')}
        >
          {t('inspection:form.actions.maintenance_section.replaced')}
        </Button>
      </div>
    </div>
  );
};
