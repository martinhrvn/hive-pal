import { useTranslation } from 'react-i18next';
import { Controller, useFormContext } from 'react-hook-form';
import { Check, X, HelpCircle } from 'lucide-react';
import { FrameCounter } from '../frame-counter';
import { StepHeader } from '../step-header';
import { cn } from '@/lib/utils';
import type { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema';

const QUEEN_SEEN_OPTIONS: Array<{
  value: boolean | null;
  labelKey: string;
  icon: typeof Check;
}> = [
  { value: true, labelKey: 'inspection:mobile.queen.yes', icon: Check },
  { value: false, labelKey: 'inspection:mobile.queen.no', icon: X },
  { value: null, labelKey: 'inspection:mobile.queen.notLooked', icon: HelpCircle },
];

interface CellTogglePillProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

function CellTogglePill({ label, checked, onToggle }: CellTogglePillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm transition-all active:scale-[0.99]',
        checked
          ? 'border-[oklch(0.78_0.16_82)]/60 bg-[oklch(0.78_0.16_82)]/10'
          : 'border-border bg-background hover:border-foreground/20',
      )}
    >
      <div
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
          checked
            ? 'border-transparent bg-[oklch(0.78_0.16_82)] text-[oklch(0.22_0.04_60)]'
            : 'border-border bg-background',
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
}

export function QueenStep() {
  const { t } = useTranslation('inspection');
  const { control } = useFormContext<InspectionFormData>();

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-2">
      <StepHeader
        title={t('inspection:mobile.queen.title')}
        hint={t('inspection:mobile.queen.hint')}
      />

      <Controller
        control={control}
        name="observations.queenSeen"
        render={({ field }) => (
          <div className="space-y-1.5">
            <div className="font-overline text-muted-foreground">
              {t('inspection:observations.queenSeen')}
            </div>
            <div className="grid w-full grid-cols-3 gap-2">
              {QUEEN_SEEN_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected =
                  (field.value ?? null) === opt.value ||
                  (field.value === undefined && opt.value === null);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      'flex h-16 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium transition-all active:scale-[0.96]',
                      isSelected
                        ? 'border-[oklch(0.78_0.16_82)]/60 bg-[oklch(0.78_0.16_82)]/10 text-foreground shadow-sm shadow-[oklch(0.78_0.16_82)]/30'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground',
                    )}
                    aria-pressed={isSelected}
                  >
                    <Icon
                      className={cn(
                        'size-4 transition-colors',
                        isSelected && 'text-[oklch(0.55_0.12_70)] dark:text-[oklch(0.82_0.16_82)]',
                      )}
                    />
                    <span>{t(opt.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      />

      <Controller
        control={control}
        name="observations.queenCells"
        render={({ field }) => (
          <FrameCounter
            value={field.value}
            onChange={field.onChange}
            label={t('inspection:observations.queenCells')}
            max={20}
          />
        )}
      />

      <div className="space-y-1.5">
        <div className="font-overline text-muted-foreground">
          {t('inspection:mobile.review.cellTypes')}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Controller
            control={control}
            name="observations.swarmCells"
            render={({ field }) => (
              <CellTogglePill
                label={t('inspection:observations.swarmCells')}
                checked={!!field.value}
                onToggle={() => field.onChange(!field.value)}
              />
            )}
          />
          <Controller
            control={control}
            name="observations.supersedureCells"
            render={({ field }) => (
              <CellTogglePill
                label={t('inspection:observations.supersedureCells')}
                checked={!!field.value}
                onToggle={() => field.onChange(!field.value)}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
