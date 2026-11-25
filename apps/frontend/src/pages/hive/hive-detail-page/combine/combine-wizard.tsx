import { useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Merge } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getQueenDisplayName } from '@/lib/queen-utils';
import { useDateFormat } from '@/hooks/use-date-format';
import { useCombineHives, useHives } from '@/api/hooks';
import type {
  ActiveQueen,
  HiveDetailResponse,
  OtherQueenFate,
} from 'shared-schemas';

const COMBINABLE_STATUSES = new Set(['ACTIVE', 'INACTIVE']);

interface CombineWizardProps {
  hive: HiveDetailResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QueenChoice {
  queen: ActiveQueen;
  hiveName: string;
}

export const CombineWizard = ({
  hive,
  open,
  onOpenChange,
}: CombineWizardProps) => {
  const { t } = useTranslation(['hive', 'queen', 'common']);
  const { formatDate } = useDateFormat();
  const navigate = useNavigate();
  const combine = useCombineHives();

  const steps = [
    t('hive:combine.stepHives'),
    t('hive:combine.stepQueen'),
    t('hive:combine.stepDetails'),
    t('hive:combine.stepConfirm'),
  ];

  const today = format(new Date(), 'yyyy-MM-dd');
  const [step, setStep] = useState(0);
  const [otherHiveId, setOtherHiveId] = useState('');
  const [thisSurvives, setThisSurvives] = useState(true);
  // undefined = not chosen yet: fall back to the surviving hive's queen.
  const [queenChoice, setQueenChoice] = useState<string>();
  const [otherQueenFate, setOtherQueenFate] = useState<OtherQueenFate>('DEAD');
  const [moveBoxes, setMoveBoxes] = useState(true);
  const [dateStr, setDateStr] = useState(today);
  const [notes, setNotes] = useState('');

  const { data: apiaryHives } = useHives(
    { apiaryId: hive.apiaryId ?? undefined, includeInactive: true },
    { enabled: open && Boolean(hive.apiaryId) },
  );
  const candidates = (apiaryHives ?? []).filter(
    h => h.id !== hive.id && COMBINABLE_STATUSES.has(h.status),
  );
  const otherHive = candidates.find(h => h.id === otherHiveId);

  const survivor = thisSurvives ? hive : otherHive;
  const absorbed = thisSurvives ? otherHive : hive;

  const queens: QueenChoice[] = [survivor, absorbed].flatMap(h =>
    h?.activeQueen ? [{ queen: h.activeQueen, hiveName: h.name }] : [],
  );
  const keptQueenId =
    queens.find(q => q.queen.id === queenChoice)?.queen.id ??
    queens[0]?.queen.id ??
    null;
  const keptQueen = queens.find(q => q.queen.id === keptQueenId);
  const hasOtherQueen = queens.length > 1;
  const queenName = (q: ActiveQueen) =>
    getQueenDisplayName((key, opts) => t(key, opts), q);

  const reset = () => {
    setStep(0);
    setOtherHiveId('');
    setThisSurvives(true);
    setQueenChoice(undefined);
    setOtherQueenFate('DEAD');
    setMoveBoxes(true);
    setDateStr(today);
    setNotes('');
  };

  const close = (openState: boolean) => {
    if (!openState) reset();
    onOpenChange(openState);
  };

  const handleConfirm = async () => {
    if (!survivor || !absorbed) return;
    // Today keeps the exact current time; a back-dated combine lands at midday
    // local time so it can't slip into a neighbouring day in other timezones.
    const date =
      dateStr === today ? new Date() : new Date(`${dateStr}T12:00:00`);
    try {
      await combine.mutateAsync({
        id: survivor.id,
        data: {
          date: date.toISOString(),
          absorbedHiveId: absorbed.id,
          keptQueenId,
          otherQueenFate,
          moveBoxes,
          notes: notes.trim() || undefined,
        },
      });
      close(false);
      toast.success(
        t('hive:combine.toastDone', {
          absorbed: absorbed.name,
          survivor: survivor.name,
        }),
      );
      if (!thisSurvives) navigate(`/hives/${survivor.id}`);
    } catch {
      toast.error(t('hive:combine.toastError'));
    }
  };

  const canNext = step !== 0 || Boolean(otherHive);
  const fateLabel =
    otherQueenFate === 'DEAD'
      ? t('hive:combine.fateDeadShort')
      : t('hive:combine.fateReplacedShort');

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-4 w-4" /> {t('hive:combine.title')} —{' '}
            {hive.name}
          </DialogTitle>
        </DialogHeader>

        <ol className="flex gap-1.5">
          {steps.map((label, i) => (
            <li
              key={label}
              className="flex-1 text-center"
              aria-current={i === step ? 'step' : undefined}
            >
              <div
                className={cn(
                  'h-1 rounded-full mb-1.5 transition-colors',
                  i <= step ? 'bg-primary' : 'bg-muted',
                )}
              />
              <span
                className={cn(
                  'text-[11px]',
                  i === step
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        <div className="py-2 min-h-[200px]">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="combine-other-hive">
                  {t('hive:combine.otherHiveLabel')}
                </Label>
                {candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('hive:combine.noCandidates')}
                  </p>
                ) : (
                  <Select value={otherHiveId} onValueChange={setOtherHiveId}>
                    <SelectTrigger id="combine-other-hive">
                      <SelectValue
                        placeholder={t('hive:combine.otherHivePlaceholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map(h => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {otherHive && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    {t('hive:combine.survivorQuestion')}
                  </h4>
                  <ChoiceOption
                    selected={thisSurvives}
                    onSelect={() => setThisSurvives(true)}
                    title={hive.name}
                    desc={t('hive:combine.survivorDesc', {
                      absorbed: otherHive.name,
                    })}
                  />
                  <ChoiceOption
                    selected={!thisSurvives}
                    onSelect={() => setThisSurvives(false)}
                    title={otherHive.name}
                    desc={t('hive:combine.survivorDesc', {
                      absorbed: hive.name,
                    })}
                  />
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">
                  {t('hive:combine.queenQuestion')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t('hive:combine.queenHint')}
                </p>
              </div>
              {queens.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  {t('hive:combine.noQueens')}
                </p>
              ) : (
                queens.map(({ queen, hiveName }) => (
                  <ChoiceOption
                    key={queen.id}
                    selected={queen.id === keptQueenId}
                    onSelect={() => setQueenChoice(queen.id)}
                    title={queenName(queen)}
                    desc={t('hive:combine.queenFrom', { hive: hiveName })}
                  />
                ))
              )}
              {hasOtherQueen && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-medium">
                    {t('hive:combine.fateQuestion')}
                  </h4>
                  <ChoiceOption
                    selected={otherQueenFate === 'DEAD'}
                    onSelect={() => setOtherQueenFate('DEAD')}
                    title={t('hive:combine.fateDeadTitle')}
                    desc={t('hive:combine.fateDeadDesc')}
                  />
                  <ChoiceOption
                    selected={otherQueenFate === 'REPLACED'}
                    onSelect={() => setOtherQueenFate('REPLACED')}
                    title={t('hive:combine.fateReplacedTitle')}
                    desc={t('hive:combine.fateReplacedDesc')}
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="combine-date">
                  {t('hive:combine.dateLabel')}
                </Label>
                <Input
                  id="combine-date"
                  type="date"
                  value={dateStr}
                  max={today}
                  onChange={e => e.target.value && setDateStr(e.target.value)}
                />
              </div>
              <div className="flex items-start gap-2.5 rounded-md border p-3">
                <Checkbox
                  id="combine-move-boxes"
                  checked={moveBoxes}
                  onCheckedChange={checked => setMoveBoxes(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="combine-move-boxes">
                    {t('hive:combine.moveBoxesLabel')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('hive:combine.moveBoxesHint', {
                      absorbed: absorbed?.name,
                      survivor: survivor?.name,
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="combine-notes">
                  {t('hive:combine.notesLabel')}
                </Label>
                <Textarea
                  id="combine-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('hive:combine.notesPlaceholder')}
                  rows={2}
                />
              </div>
            </div>
          )}

          {step === 3 && survivor && absorbed && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                {t('hive:combine.summary')}
              </h4>
              <dl className="rounded-lg border divide-y text-sm">
                <Row
                  k={t('hive:combine.dateLabel')}
                  v={formatDate(new Date(`${dateStr}T12:00:00`))}
                />
                <Row k={t('hive:combine.survivorRow')} v={survivor.name} />
                <Row
                  k={t('hive:combine.absorbedRow')}
                  v={t('hive:combine.absorbedValue', { name: absorbed.name })}
                />
                <Row
                  k={t('hive:combine.queenRow')}
                  v={
                    keptQueen
                      ? queenName(keptQueen.queen)
                      : t('hive:combine.queenNone')
                  }
                />
                {hasOtherQueen && (
                  <Row k={t('hive:combine.otherQueenRow')} v={fateLabel} />
                )}
                <Row
                  k={t('hive:combine.boxesRow')}
                  v={
                    moveBoxes
                      ? t('hive:combine.boxesMoved', {
                          survivor: survivor.name,
                        })
                      : t('hive:combine.boxesKept')
                  }
                />
              </dl>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {step === 0 ? (
            <Button variant="outline" onClick={() => close(false)}>
              {t('common:actions.cancel')}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              {t('common:actions.back')}
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext}>
              {t('common:actions.next')}
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={combine.isPending || !otherHive}
            >
              <Merge className="mr-1.5 h-4 w-4" />
              {combine.isPending
                ? t('hive:combine.combining')
                : t('hive:combine.confirm')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="flex justify-between gap-4 px-3.5 py-2.5">
    <dt className="text-muted-foreground">{k}</dt>
    <dd className="font-medium text-right">{v}</dd>
  </div>
);

const ChoiceOption = ({
  selected,
  onSelect,
  title,
  desc,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={cn(
      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
      selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
    )}
  >
    <span
      className={cn(
        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
        selected ? 'border-primary' : 'border-muted-foreground/40',
      )}
    >
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
    </span>
    <span>
      <span className="block text-sm font-medium">{title}</span>
      <span className="block text-xs text-muted-foreground">{desc}</span>
    </span>
  </button>
);
