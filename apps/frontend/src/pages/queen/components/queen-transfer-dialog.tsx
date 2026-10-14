import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { QueenResponse } from 'shared-schemas';
import { useApiaries, useHives, useRecordQueenTransfer } from '@/api/hooks';
import { DatePickerPopover } from '@/components/common/date-picker-popover';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const REMOVE_FROM_HIVE = 'none';

type QueenTransferDialogProps = {
  queen: QueenResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Lives inside DialogContent, which unmounts on close, so every opening
// starts from a clean form.
const TransferForm = ({
  queen,
  onDone,
}: {
  queen: QueenResponse;
  onDone: () => void;
}) => {
  const { t } = useTranslation(['queen', 'common']);
  const id = useId();
  const ids = {
    hive: `${id}-hive`,
    date: `${id}-date`,
    reason: `${id}-reason`,
    notes: `${id}-notes`,
  };
  const [toHiveId, setToHiveId] = useState<string | null>(null);
  const [movedAt, setMovedAt] = useState<Date>(() => new Date());
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // A queen may move to any hive in an apiary the user can edit, not only
  // the selected one, so list hives across all apiaries grouped by apiary.
  const { data: hives } = useHives({ allApiaries: true });
  const { data: apiaries } = useApiaries();
  const { mutateAsync: recordTransfer, isPending } = useRecordQueenTransfer();

  const hiveGroups = (apiaries ?? [])
    .filter(apiary => apiary.role !== 'VIEWER')
    .map(apiary => ({
      apiary,
      hives: (hives ?? []).filter(
        hive => hive.apiaryId === apiary.id && hive.id !== queen.hiveId,
      ),
    }))
    .filter(group => group.hives.length > 0);

  const isNoOp = toHiveId === queen.hiveId;

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await recordTransfer({
        queenId: queen.id,
        fromHiveId: queen.hiveId,
        data: {
          toHiveId,
          movedAt: movedAt.toISOString(),
          reason: reason || null,
          notes: notes || null,
        },
      });
      toast.success(t('transfer.success'));
      onDone();
    } catch {
      toast.error(t('transfer.error'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={ids.hive}>{t('transfer.moveTo')}</Label>
          {queen.hiveName && (
            <p className="text-xs text-muted-foreground">
              {queen.apiaryName
                ? t('transfer.currentlyInApiary', {
                    hive: queen.hiveName,
                    apiary: queen.apiaryName,
                  })
                : t('transfer.currentlyIn', { hive: queen.hiveName })}
            </p>
          )}
          <Select
            value={toHiveId ?? REMOVE_FROM_HIVE}
            onValueChange={value =>
              setToHiveId(value === REMOVE_FROM_HIVE ? null : value)
            }
          >
            <SelectTrigger id={ids.hive} className="w-full">
              <SelectValue placeholder={t('transfer.selectDestination')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={REMOVE_FROM_HIVE}>
                {t('transfer.removeFromHive')}
              </SelectItem>
              {hiveGroups.map(({ apiary, hives: groupHives }) => (
                <SelectGroup key={apiary.id}>
                  <SelectLabel>{apiary.name}</SelectLabel>
                  {groupHives.map(hive => (
                    <SelectItem key={hive.id} value={hive.id}>
                      {hive.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids.date}>{t('transfer.date')}</Label>
          <DatePickerPopover
            id={ids.date}
            date={movedAt}
            onDateChange={date => date && setMovedAt(date)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids.reason}>{t('transfer.reason')}</Label>
          <Input
            id={ids.reason}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t('transfer.reasonPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={ids.notes}>{t('transfer.notes')}</Label>
          <Input
            id={ids.notes}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('transfer.notesPlaceholder')}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={isPending}
        >
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" disabled={isPending || isNoOp}>
          {isPending ? t('transfer.submitting') : t('transfer.submit')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export const QueenTransferDialog = ({
  queen,
  open,
  onOpenChange,
}: QueenTransferDialogProps) => {
  const { t } = useTranslation('queen');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('transfer.title')}</DialogTitle>
        </DialogHeader>
        <TransferForm queen={queen} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
