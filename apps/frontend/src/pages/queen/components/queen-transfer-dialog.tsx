import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useRecordQueenTransfer, useHives, useApiaries } from '@/api/hooks';
import { QueenResponse } from 'shared-schemas';

interface QueenTransferDialogProps {
  queen: QueenResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QueenTransferDialog: React.FC<QueenTransferDialogProps> = ({
  queen,
  open,
  onOpenChange,
}) => {
  const [toHiveId, setToHiveId] = useState<string | null>(null);
  const [movedAt, setMovedAt] = useState<Date>(new Date());
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

  const handleSubmit = async () => {
    try {
      await recordTransfer({
        queenId: queen.id,
        fromHiveId: queen.hiveId,
        data: {
          toHiveId: toHiveId,
          movedAt: movedAt.toISOString(),
          reason: reason || null,
          notes: notes || null,
        },
      });
      toast.success('Queen transferred successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to transfer queen');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Transfer Queen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="toHive">Move to Hive</Label>
            {queen.hiveName && (
              <p className="text-xs text-muted-foreground">
                Currently in {queen.hiveName}
                {queen.apiaryName ? ` (${queen.apiaryName})` : ''}
              </p>
            )}
            <Select
              value={toHiveId ?? 'none'}
              onValueChange={val => setToHiveId(val === 'none' ? null : val)}
            >
              <SelectTrigger id="toHive">
                <SelectValue placeholder="Select destination hive" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Remove from hive</SelectItem>
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
            <Label>Transfer Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !movedAt && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {movedAt ? format(movedAt, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={movedAt}
                  onSelect={date => date && setMovedAt(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Hive split, requeen..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || isNoOp}>
            {isPending ? 'Transferring...' : 'Transfer Queen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
