import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HiveStatus } from '@/pages/hive/components';
import { useCreateAction } from '@/api/hooks/useActions';
import {
  ActionType,
  HiveResponse,
  HiveStatus as HiveStatusValue,
} from 'shared-schemas';
import { useTranslation } from 'react-i18next';

type HiveStatusEnum = HiveResponse['status'];

const ALL_STATUSES: HiveStatusEnum[] = [
  HiveStatusValue.ACTIVE,
  HiveStatusValue.INACTIVE,
  HiveStatusValue.DEAD,
  HiveStatusValue.SOLD,
  HiveStatusValue.UNKNOWN,
  HiveStatusValue.ARCHIVED,
];

// Format a Date as a value accepted by <input type="datetime-local"> in the
// user's local timezone (yyyy-MM-ddTHH:mm).
const toLocalInputValue = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

type HiveStatusButtonProps = {
  hiveId: string;
  status: HiveStatusEnum | undefined;
  apiaryId?: string;
};

export const HiveStatusButton: React.FC<HiveStatusButtonProps> = ({
  hiveId,
  status,
  apiaryId,
}) => {
  const { t } = useTranslation(['hive', 'common']);
  const statusLabel = (value: HiveStatusEnum) =>
    t(`hive:status.${value.toLowerCase()}`);
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<HiveStatusEnum | null>(
    null,
  );
  const [changeDate, setChangeDate] = useState('');
  const queryClient = useQueryClient();
  const { mutateAsync: createAction, isPending } = useCreateAction();

  const handleSelect = (newStatus: HiveStatusEnum) => {
    setOpen(false);
    if (newStatus === status) return;
    setPendingStatus(newStatus);
    setChangeDate(toLocalInputValue(new Date()));
  };

  const handleConfirm = async () => {
    if (!pendingStatus) return;
    const date = changeDate ? new Date(changeDate) : new Date();
    try {
      await createAction({
        hiveId,
        type: ActionType.STATUS_CHANGE,
        details: { type: ActionType.STATUS_CHANGE, toStatus: pendingStatus },
        date: date.toISOString(),
        // The hive's own apiary — cross-apiary safe in view-all mode.
        apiaryId,
      });
      // Refresh hive queries so the status badge reflects the recomputed status.
      await queryClient.invalidateQueries({ queryKey: ['hives'] });
      toast.success(
        t('hive:statusChange.success', {
          status: statusLabel(pendingStatus).toLowerCase(),
        }),
      );
      setPendingStatus(null);
    } catch {
      toast.error(t('hive:statusChange.error'));
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t('hive:statusChange.title')}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <HiveStatus status={status} />
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuSeparator className="sr-only" />
          {ALL_STATUSES.map(value => (
            <DropdownMenuItem
              key={value}
              onClick={() => handleSelect(value)}
              className={value === status ? 'font-semibold' : ''}
            >
              <HiveStatus status={value} />
              <span className="ml-2">{statusLabel(value)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={pendingStatus !== null}
        onOpenChange={openState => {
          if (!openState) setPendingStatus(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('hive:statusChange.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingStatus && (
              <div className="flex items-center gap-2 text-sm">
                <HiveStatus status={status} />
                <span className="text-muted-foreground">→</span>
                <HiveStatus status={pendingStatus} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="status-change-date"
                className="text-sm font-medium"
              >
                {t('hive:statusChange.date')}
              </label>
              <Input
                id="status-change-date"
                type="datetime-local"
                value={changeDate}
                onChange={e => setChangeDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingStatus(null)}
              disabled={isPending}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? t('hive:settings.saving') : t('common:actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
