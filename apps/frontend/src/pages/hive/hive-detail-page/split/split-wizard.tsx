import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Split, Minus, Plus, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSplitHive, useUndoSplit, useApiaries } from '@/api/hooks';
import type { HiveDetailResponse } from 'shared-schemas';

type QueenDisposition = 'STAYED_WITH_SOURCE' | 'MOVED_TO_NEW';

interface SplitWizardProps {
  hive: HiveDetailResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SplitWizard = ({ hive, open, onOpenChange }: SplitWizardProps) => {
  const { t } = useTranslation('hive');

  const steps = [
    t('split.stepFrames', { defaultValue: 'Frames' }),
    t('split.stepNewHive', { defaultValue: 'New hive' }),
    t('split.stepQueen', { defaultValue: 'Queen' }),
    t('split.stepConfirm', { defaultValue: 'Confirm' }),
  ];

  const broodBoxes = useMemo(
    () =>
      (hive.boxes ?? [])
        .filter((b) => b.type === 'BROOD')
        .sort((a, b) => a.position - b.position),
    [hive.boxes],
  );
  const broodBox = broodBoxes[0];
  const maxFrames = broodBox?.frameCount ?? 0;

  const today = format(new Date(), 'yyyy-MM-dd');
  const suggestedName = (d: string) =>
    `${hive.name} · ${t('split.suggestedNameSuffix', { defaultValue: 'Split' })} ${d}`;

  const [step, setStep] = useState(0);
  const [frames, setFrames] = useState(Math.min(3, maxFrames || 3));
  const [dateStr, setDateStr] = useState(today);
  const [name, setName] = useState(suggestedName(today));
  // Once the user edits the name, stop following the chosen date.
  const [nameEdited, setNameEdited] = useState(false);
  const [queen, setQueen] = useState<QueenDisposition>('STAYED_WITH_SOURCE');
  const [followUpDays, setFollowUpDays] = useState(24);
  // Target apiary for the daughter — defaults to the mother's apiary.
  const [targetApiaryId, setTargetApiaryId] = useState(hive.apiaryId ?? '');

  const split = useSplitHive();
  const undo = useUndoSplit();
  const hasQueen = Boolean(hive.activeQueen);
  const { data: apiaries } = useApiaries();
  const apiaryOptions = apiaries ?? [];
  const targetApiaryName = apiaryOptions.find(
    (a) => a.id === (targetApiaryId || hive.apiaryId),
  )?.name;

  const reset = () => {
    setStep(0);
    setFrames(Math.min(3, maxFrames || 3));
    setDateStr(today);
    setName(suggestedName(today));
    setNameEdited(false);
    setQueen('STAYED_WITH_SOURCE');
    setFollowUpDays(24);
    setTargetApiaryId(hive.apiaryId ?? '');
  };

  const close = (openState: boolean) => {
    if (!openState) reset();
    onOpenChange(openState);
  };

  const queenlessSide =
    queen === 'MOVED_TO_NEW'
      ? hive.name
      : t('split.theNewHive', { defaultValue: 'the new hive' });

  const handleConfirm = async () => {
    if (!broodBox?.id) return;
    // Today keeps the exact current time; a back-dated split lands at midday
    // local time so it can't slip into a neighbouring day in other timezones.
    const splitDate =
      dateStr === today ? new Date() : new Date(`${dateStr}T12:00:00`);
    try {
      const res = await split.mutateAsync({
        id: hive.id,
        data: {
          date: splitDate.toISOString(),
          newHiveName: name.trim(),
          apiaryId: targetApiaryId || undefined,
          framesMoved: [{ boxId: broodBox.id, count: frames }],
          queenDisposition: queen,
          followUpDays,
        },
      });
      close(false);
      toast.success(
        `${t('split.toastDonePrefix', { defaultValue: 'Split done — created' })} „${name.trim()}“`,
        {
          action: {
            label: t('split.undo', { defaultValue: 'Undo' }),
            onClick: () =>
              undo
                .mutateAsync({
                  hiveId: hive.id,
                  splitId: res.splitId,
                })
                .then(() =>
                  toast.success(
                    t('split.toastUndone', { defaultValue: 'Split undone' }),
                  ),
                )
                .catch(() =>
                  toast.error(
                    t('split.toastUndoError', {
                      defaultValue: 'Could not undo the split',
                    }),
                  ),
                ),
          },
        },
      );
    } catch {
      toast.error(
        t('split.toastError', {
          defaultValue: 'Split failed. Please check the values and try again.',
        }),
      );
    }
  };

  const canNext =
    step === 0
      ? frames >= 1 && frames <= maxFrames
      : step === 1
        ? name.trim().length > 0
        : true;

  const framesLower = t('split.framesLower', { defaultValue: 'frames' });
  const afterWord = t('split.afterWord', { defaultValue: 'after' });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-4 w-4" />{' '}
            {t('split.titlePrefix', { defaultValue: 'Split colony' })} —{' '}
            {hive.name}
          </DialogTitle>
        </DialogHeader>

        {/* step progress */}
        <div className="flex gap-1.5">
          {steps.map((label, i) => (
            <div key={label} className="flex-1 text-center">
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
            </div>
          ))}
        </div>

        {!broodBox ? (
          <p className="py-6 text-sm text-muted-foreground">
            {t('split.noBroodBox', {
              defaultValue: 'This hive has no brood box to take frames from.',
            })}
          </p>
        ) : (
          <div className="py-2 min-h-[200px]">
            {/* STEP 1 — frames */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">
                    {t('split.framesQuestion', {
                      defaultValue: 'How many brood frames to move?',
                    })}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('split.framesHint', {
                      defaultValue:
                        'The new colony starts with exactly these frames.',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center rounded-md border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-10 rounded-none"
                      aria-label={t('split.fewerFrames', {
                        defaultValue: 'Fewer frames',
                      })}
                      onClick={() => setFrames((f) => Math.max(1, f - 1))}
                      disabled={frames <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold tabular-nums">
                      {frames}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-10 rounded-none"
                      aria-label={t('split.moreFrames', {
                        defaultValue: 'More frames',
                      })}
                      onClick={() =>
                        setFrames((f) => Math.min(maxFrames, f + 1))
                      }
                      disabled={frames >= maxFrames}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t('split.of', { defaultValue: 'of' })} {maxFrames}{' '}
                    {framesLower}
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border bg-muted/30 p-4">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {hive.name} {afterWord}
                    </div>
                    <div className="text-xl font-semibold tabular-nums">
                      {maxFrames - frames}
                    </div>
                  </div>
                  <div className="text-primary">→</div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {t('split.stepNewHive', { defaultValue: 'New hive' })}
                    </div>
                    <div className="text-xl font-semibold tabular-nums">
                      {frames}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — new hive */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">
                    {t('split.newColony', { defaultValue: 'New colony' })}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('split.newColonyHint', {
                      defaultValue: "It inherits the mother's settings.",
                    })}
                  </p>
                </div>
                {apiaryOptions.length > 1 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="split-apiary">
                      {t('split.apiaryLabel', { defaultValue: 'Apiary' })}
                    </Label>
                    <Select
                      value={targetApiaryId || hive.apiaryId || ''}
                      onValueChange={setTargetApiaryId}
                    >
                      <SelectTrigger id="split-apiary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {apiaryOptions.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                            {a.id === hive.apiaryId
                              ? ` (${t('split.apiarySource', { defaultValue: 'current' })})`
                              : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="split-date">
                    {t('split.dateLabel', { defaultValue: 'Date of split' })}
                  </Label>
                  <Input
                    id="split-date"
                    type="date"
                    value={dateStr}
                    max={today}
                    onChange={(e) => {
                      const d = e.target.value;
                      if (!d) return;
                      setDateStr(d);
                      if (!nameEdited) setName(suggestedName(d));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('split.dateHint', {
                      defaultValue:
                        'Splits can be back-dated to the day they actually happened.',
                    })}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="split-name">
                    {t('split.nameLabel', { defaultValue: 'Name' })}
                  </Label>
                  <Input
                    id="split-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameEdited(true);
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 3 — queen */}
            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">
                    {t('split.queenQuestion', {
                      defaultValue: 'Who keeps the queen?',
                    })}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('split.queenHint', {
                      defaultValue:
                        'The queenless side gets a follow-up reminder automatically.',
                    })}
                  </p>
                </div>
                <QueenOption
                  selected={queen === 'STAYED_WITH_SOURCE'}
                  onSelect={() => setQueen('STAYED_WITH_SOURCE')}
                  title={t('split.queenStaysTitle', {
                    defaultValue: 'Queen stays with the mother',
                  })}
                  desc={t('split.queenStaysDesc', {
                    defaultValue:
                      'The new hive is queenless and will raise (or be given) a queen.',
                  })}
                />
                <QueenOption
                  selected={queen === 'MOVED_TO_NEW'}
                  onSelect={() => hasQueen && setQueen('MOVED_TO_NEW')}
                  disabled={!hasQueen}
                  title={t('split.queenMovesTitle', {
                    defaultValue: 'Move the queen to the new hive',
                  })}
                  desc={
                    hasQueen
                      ? t('split.queenMovesDescYes', {
                          defaultValue: 'The mother becomes queenless.',
                        })
                      : t('split.queenMovesDescNo', {
                          defaultValue: 'No active queen recorded on this hive.',
                        })
                  }
                />
                <div className="flex items-center gap-2 rounded-md border border-dashed p-2.5 text-sm text-muted-foreground">
                  <span>
                    {t('split.remindPrefix', {
                      defaultValue: 'Remind me to check requeening in',
                    })}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={followUpDays}
                    onChange={(e) =>
                      setFollowUpDays(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="h-8 w-16 tabular-nums"
                  />
                  <span>{t('split.days', { defaultValue: 'days' })}</span>
                </div>
              </div>
            )}

            {/* STEP 4 — confirm */}
            {step === 3 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  {t('split.summary', { defaultValue: 'Summary' })}
                </h4>
                <div className="rounded-lg border divide-y text-sm">
                  <Row
                    k={t('split.dateLabel', { defaultValue: 'Date of split' })}
                    v={dateStr}
                  />
                  <Row
                    k={`${t('split.movedFromPrefix', { defaultValue: 'Moved from' })} ${hive.name}`}
                    v={`${frames} ${t('split.broodFramesUnit', { defaultValue: 'brood frames' })}`}
                  />
                  <Row
                    k={`${hive.name} ${afterWord}`}
                    v={`${maxFrames - frames} ${framesLower}`}
                  />
                  <Row
                    k={t('split.stepNewHive', { defaultValue: 'New hive' })}
                    v={name.trim()}
                  />
                  {targetApiaryName && (
                    <Row
                      k={t('split.apiaryLabel', { defaultValue: 'Apiary' })}
                      v={targetApiaryName}
                    />
                  )}
                  <Row
                    k={t('split.queenRow', { defaultValue: 'Queen' })}
                    v={
                      queen === 'MOVED_TO_NEW'
                        ? t('split.queenMovesShort', {
                            defaultValue: 'moves to the new hive',
                          })
                        : t('split.queenStaysShort', {
                            defaultValue: 'stays with the mother',
                          })
                    }
                  />
                  <Row
                    k={t('split.reminderRow', { defaultValue: 'Reminder' })}
                    v={
                      followUpDays > 0
                        ? `${t('split.inWord', { defaultValue: 'in' })} ${followUpDays} ${t('split.days', { defaultValue: 'days' })} (${queenlessSide})`
                        : t('split.reminderNone', { defaultValue: 'none' })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {step === 0 ? (
            <Button variant="outline" onClick={() => close(false)}>
              {t('split.cancel', { defaultValue: 'Cancel' })}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              {t('split.back', { defaultValue: 'Back' })}
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!broodBox || !canNext}
            >
              {t('split.next', { defaultValue: 'Next' })}
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={split.isPending || !broodBox}
            >
              <Split className="mr-1.5 h-4 w-4" />
              {split.isPending
                ? t('split.splitting', { defaultValue: 'Splitting…' })
                : t('split.titlePrefix', { defaultValue: 'Split colony' })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between px-3.5 py-2.5">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-medium">{v}</span>
  </div>
);

const QueenOption = ({
  selected,
  onSelect,
  title,
  desc,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    className={cn(
      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
      selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
      disabled && 'cursor-not-allowed opacity-60',
    )}
  >
    <span
      className={cn(
        'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border',
        selected ? 'border-primary' : 'border-muted-foreground/40',
      )}
    >
      {selected && <Crown className="h-3 w-3 text-primary" />}
    </span>
    <span>
      <span className="block text-sm font-medium">{title}</span>
      <span className="block text-xs text-muted-foreground">{desc}</span>
    </span>
  </button>
);
