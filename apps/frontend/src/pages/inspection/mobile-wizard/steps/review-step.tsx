import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { Camera, FileText, Mic, Sparkles } from 'lucide-react';
import { StepHeader } from '../step-header';
import { cn } from '@/lib/utils';
import type { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema';
import type { PendingPhoto, PendingRecording } from '../types';

interface ReviewStepProps {
  isSubjective: boolean;
  pendingPhotos: PendingPhoto[];
  pendingRecordings: PendingRecording[];
}

// Stored 0-10 values are shown as N/5 in subjective mode so the summary
// reads the same as what the user tapped during the wizard.
const fmt = (v: number | null | undefined, isSubjective: boolean) => {
  if (v == null) return null;
  return isSubjective ? `${Math.round(v / 2)}/5` : String(v);
};

interface SummaryRow {
  label: string;
  value: string | null;
}

interface SummarySectionProps {
  title: string;
  rows: SummaryRow[];
}

function SummarySection({ title, rows }: SummarySectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="border-b border-border/60 px-4 py-2">
        <span className="font-overline text-muted-foreground">{title}</span>
      </div>
      <dl className="divide-y divide-border/60">
        {rows.map(row => {
          const empty = row.value == null;
          return (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd
                className={cn(
                  'font-medium tabular-nums',
                  empty && 'text-muted-foreground/50',
                )}
              >
                {row.value ?? '—'}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function ReviewStep({
  isSubjective,
  pendingPhotos,
  pendingRecordings,
}: ReviewStepProps) {
  const { t } = useTranslation('inspection');
  const { watch } = useFormContext<InspectionFormData>();
  const obs = watch('observations');
  const notes = watch('notes');

  const queenSeenLabel =
    obs?.queenSeen === true
      ? t('inspection:mobile.queen.yes')
      : obs?.queenSeen === false
        ? t('inspection:mobile.queen.no')
        : t('inspection:mobile.queen.notLooked');

  const vitals: SummaryRow[] = [
    {
      label: t('inspection:observations.strength'),
      value: fmt(obs?.strength, isSubjective),
    },
    {
      label: t('inspection:observations.cappedBrood'),
      value: fmt(
        isSubjective ? obs?.cappedBrood : obs?.cappedBroodFrames,
        isSubjective,
      ),
    },
    {
      label: t('inspection:observations.uncappedBrood'),
      value: fmt(
        isSubjective ? obs?.uncappedBrood : obs?.uncappedBroodFrames,
        isSubjective,
      ),
    },
  ];

  const stores: SummaryRow[] = [
    {
      label: t('inspection:observations.honeyStores'),
      value: fmt(
        isSubjective ? obs?.honeyStores : obs?.honeyFrames,
        isSubjective,
      ),
    },
    {
      label: t('inspection:observations.pollenStores'),
      value: fmt(
        isSubjective ? obs?.pollenStores : obs?.pollenFrames,
        isSubjective,
      ),
    },
  ];

  const queen: SummaryRow[] = [
    {
      label: t('inspection:observations.queenSeen'),
      value: queenSeenLabel,
    },
    {
      label: t('inspection:observations.queenCells'),
      value: String(obs?.queenCells ?? 0),
    },
  ];

  const cellTypes = [
    obs?.swarmCells && t('inspection:observations.swarmCells'),
    obs?.supersedureCells && t('inspection:observations.supersedureCells'),
  ].filter(Boolean) as string[];

  const captureChips = [
    pendingRecordings.length > 0 && {
      icon: Mic,
      label: `${pendingRecordings.length}`,
    },
    pendingPhotos.length > 0 && {
      icon: Camera,
      label: `${pendingPhotos.length}`,
    },
    notes && notes.trim().length > 0 && {
      icon: FileText,
      label: t('inspection:mobile.review.hasNotes'),
    },
  ].filter(Boolean) as Array<{ icon: typeof Mic; label: string }>;

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-2">
      <StepHeader
        title={t('inspection:mobile.review.title')}
        hint={t('inspection:mobile.review.hint')}
      />

      <div className="space-y-3">
        <SummarySection
          title={t('inspection:mobile.vitals.title')}
          rows={vitals}
        />
        <SummarySection
          title={t('inspection:mobile.stores.title')}
          rows={stores}
        />
        <SummarySection
          title={t('inspection:mobile.queen.title')}
          rows={queen}
        />

        {cellTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-background px-4 py-3">
            <span className="font-overline text-muted-foreground">
              {t('inspection:mobile.review.cellTypes')}
            </span>
            {cellTypes.map(c => (
              <span
                key={c}
                className="rounded-full bg-[oklch(0.78_0.16_82)]/15 px-2.5 py-0.5 text-xs font-medium text-[oklch(0.45_0.12_70)] dark:text-[oklch(0.82_0.16_82)]"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {captureChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {captureChips.map((c, i) => {
              const Icon = c.icon;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
                >
                  <Icon className="size-3" />
                  {c.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2.5 rounded-2xl border border-[oklch(0.78_0.16_82)]/40 bg-[oklch(0.78_0.16_82)]/10 px-4 py-3 text-sm">
        <Sparkles className="size-4 text-[oklch(0.55_0.12_70)] dark:text-[oklch(0.82_0.16_82)]" />
        <span className="font-medium">
          {t('inspection:mobile.review.readyToSave')}
        </span>
      </div>
    </div>
  );
}
