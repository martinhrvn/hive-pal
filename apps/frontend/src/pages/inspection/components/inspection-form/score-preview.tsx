import React, { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { calculateScores, ScoreResult } from 'shared-schemas';
import { Pencil, RotateCcw, X, BarChart, CrownIcon } from 'lucide-react';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { IconJarLogoIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InspectionFormData } from './schema';
import { AiBadge } from './ai-badge';
import { AiSectionPreview } from './ai-section-preview';
import type { AiMergeState } from '@/pages/inspection/lib/inspection-ai-merge';
import { cn } from '@/lib/utils';
import { getModeSpecificObservations } from './mode-behavior';

type ScoreKey =
  | 'overallScore'
  | 'populationScore'
  | 'storesScore'
  | 'queenScore';

type ScorePreviewSectionProps = {
  totalFrames?: number | null;
  isAiSuggested?: (field: keyof InspectionFormData) => boolean;
  aiMergeState?: AiMergeState | null;
  onAcceptSuggestion?: (field: keyof InspectionFormData) => void;
  onDismissSuggestion?: (field: keyof InspectionFormData) => void;
};

const getScoreColor = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'text-muted-foreground';
  if (value >= 6) return 'text-green-600';
  if (value >= 3) return 'text-amber-500';
  return 'text-red-500';
};

const formatScorePreview = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return <span className="italic text-muted-foreground">Empty</span>;
  }

  const score = value as Partial<Record<ScoreKey, number | null | undefined>>;

  const rows: { key: ScoreKey; label: string }[] = [
    { key: 'overallScore', label: 'Overall' },
    { key: 'populationScore', label: 'Population' },
    { key: 'storesScore', label: 'Stores' },
    { key: 'queenScore', label: 'Queen' },
  ];

  const hasAnyValue = rows.some(row => score[row.key] != null);

  if (!hasAnyValue) {
    return <span className="italic text-muted-foreground">Empty</span>;
  }

  return (
    <div className="space-y-1">
      {rows.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-medium">
            {score[key] != null ? `${score[key]?.toFixed?.(1) ?? score[key]}/10` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
};

const ScoreItem: React.FC<{
  label: string;
  icon: React.ReactNode;
  calculatedValue: number | null;
  overrideValue: number | null | undefined;
  onOverride: (value: number | null) => void;
  onClear: () => void;
}> = ({ label, icon, calculatedValue, overrideValue, onOverride, onClear }) => {
  const { t } = useTranslation('inspection');
  const [editing, setEditing] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const isOverridden =
    overrideValue !== undefined &&
    overrideValue !== null &&
    overrideValue !== calculatedValue;

  const displayValue = isOverridden ? overrideValue : calculatedValue;
  const ratingValue = overrideValue ?? calculatedValue;

  return (
    <div className="space-y-2 rounded-md border bg-card p-2">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate text-sm text-muted-foreground">{label}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-bold ${getScoreColor(displayValue)}`}>
            {displayValue?.toFixed(1) ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground">/10</span>

          {isOverridden && (
            <button
              type="button"
              className="ml-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={e => {
                e.preventDefault();
                onClear();
                setEditing(false);
              }}
              title={`Calculated: ${calculatedValue?.toFixed(1) ?? '—'}`}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}

          <button
            type="button"
            className={`ml-0.5 ${
              editing
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={e => {
              e.preventDefault();
              setEditing(!editing);
            }}
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="flex items-center">
          <button
            type="button"
            className={`mr-2 flex h-8 w-8 items-center justify-center rounded-lg ${
              ratingValue === 0
                ? 'bg-gray-600 text-white dark:bg-gray-300 dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800'
            }`}
            onClick={e => {
              e.preventDefault();
              onOverride(0);
            }}
            aria-label={t('observations.rateAs', { value: 0 })}
          >
            0
          </button>

          <div className="grid h-8 grow grid-cols-10 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fullValue => {
              let color = 'bg-gray-200 dark:bg-gray-700';

              if (hoveredValue != null && hoveredValue >= fullValue) {
                color = 'bg-amber-200 dark:bg-amber-800';
              } else if (ratingValue != null && ratingValue >= fullValue) {
                color = 'bg-amber-300 dark:bg-amber-700';
              }

              return (
                <button
                  key={fullValue}
                  type="button"
                  className={`w-full rounded text-xs transition-colors duration-300 ${color} ${
                    hoveredValue === fullValue
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-transparent'
                  }`}
                  onMouseEnter={() => setHoveredValue(fullValue)}
                  onMouseLeave={() => setHoveredValue(null)}
                  onClick={e => {
                    e.preventDefault();
                    onOverride(fullValue);
                    setHoveredValue(null);
                  }}
                  aria-label={t('observations.rateAs', { value: fullValue })}
                >
                  {hoveredValue === fullValue && hoveredValue}
                </button>
              );
            })}
          </div>

          <Input
            type="number"
            min={0}
            max={10}
            step={0.1}
            className="ml-2 h-8 w-16 text-center text-sm"
            value={ratingValue ?? ''}
            onChange={e => {
              const val =
                e.target.value === '' ? null : parseFloat(e.target.value);
              if (val !== null && (val < 0 || val > 10)) return;
              onOverride(val !== null ? Math.round(val * 100) / 100 : null);
            }}
          />

          <Button
            variant="ghost"
            type="button"
            disabled={ratingValue == null}
            className="ml-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            onClick={e => {
              e.preventDefault();
              onOverride(null);
            }}
            aria-label={t('observations.clearRating')}
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export const ScorePreviewSection: React.FC<ScorePreviewSectionProps> = ({
  totalFrames,
  isAiSuggested,
  aiMergeState,
  onAcceptSuggestion,
  onDismissSuggestion,
}) => {
  const { t } = useTranslation('inspection');
  const { setValue, control } = useFormContext<InspectionFormData>();

  const observations = useWatch({ name: 'observations', control });
  const scoreForm = useWatch({ name: 'score', control });

  const dataDrivenObservations = useMemo(
    () => getModeSpecificObservations(observations, false, totalFrames),
    [observations, totalFrames],
  );

  const calculated: ScoreResult = useMemo(() => {
    if (!dataDrivenObservations) {
      return {
        overallScore: null,
        populationScore: null,
        storesScore: null,
        queenScore: null,
        warnings: [],
        confidence: 0,
      };
    }

    return calculateScores(dataDrivenObservations);
  }, [dataDrivenObservations]);

  const hasAnyScore =
    calculated.overallScore !== null ||
    calculated.populationScore !== null ||
    calculated.storesScore !== null ||
    calculated.queenScore !== null ||
    scoreForm?.overallScore != null ||
    scoreForm?.populationScore != null ||
    scoreForm?.storesScore != null ||
    scoreForm?.queenScore != null;

  const scoreSuggestion = aiMergeState?.suggestions.score;
  const isPending = scoreSuggestion?.status === 'pending';

  if (!hasAnyScore && !scoreSuggestion) return null;

  const hasOverrides =
    !!scoreForm &&
    ((scoreForm.overallScore != null &&
      scoreForm.overallScore !== calculated.overallScore) ||
      (scoreForm.populationScore != null &&
        scoreForm.populationScore !== calculated.populationScore) ||
      (scoreForm.storesScore != null &&
        scoreForm.storesScore !== calculated.storesScore) ||
      (scoreForm.queenScore != null &&
        scoreForm.queenScore !== calculated.queenScore));

  const setScoreField = (key: ScoreKey, value: number | null) => {
    setValue(`score.${key}`, value, { shouldDirty: true });
  };

  const clearOverride = (key: ScoreKey) => {
    setValue(`score.${key}`, undefined, { shouldDirty: true });
  };

  const resetAll = () => {
    setValue('score', undefined, { shouldDirty: true });
  };

  const scores: { key: ScoreKey; label: string; icon: React.ReactNode }[] = [
    {
      key: 'overallScore',
      label: t('scores.overall'),
      icon: <BarChart className="h-4 w-4 text-amber-500" />,
    },
    {
      key: 'populationScore',
      label: t('scores.population'),
      icon: <BeeIcon className="h-4 w-4 text-blue-500" />,
    },
    {
      key: 'storesScore',
      label: t('scores.stores'),
      icon: <IconJarLogoIcon className="h-4 w-4 text-purple-500" />,
    },
    {
      key: 'queenScore',
      label: t('scores.queen'),
      icon: <CrownIcon className="h-4 w-4 text-green-500" />,
    },
  ];

  return (
    <div
      className={cn(
        'space-y-3 rounded-md p-3 transition-colors',
        isPending &&
          'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
      )}
      data-ai-field="score"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-medium">
          <span>{t('scores.title')}</span>
          {isAiSuggested?.('score') && <AiBadge />}
        </h3>

        {hasOverrides && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={e => {
              e.preventDefault();
              resetAll();
            }}
            className="text-xs"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            {t('scores.resetToCalculated')}
          </Button>
        )}
      </div>

      {hasAnyScore && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {scores.map(({ key, label, icon }) => (
            <ScoreItem
              key={key}
              label={label}
              icon={icon}
              calculatedValue={calculated[key]}
              overrideValue={scoreForm?.[key]}
              onOverride={val => setScoreField(key, val)}
              onClear={() => clearOverride(key)}
            />
          ))}
        </div>
      )}

      <AiSectionPreview
        title="Score"
        summary="Review AI-suggested score values before applying them."
        currentValue={formatScorePreview(scoreForm ?? calculated)}
        suggestedValue={formatScorePreview(scoreSuggestion?.aiValue)}
        hasConflict={scoreSuggestion?.hasConflict}
        status={scoreSuggestion?.status}
        onAccept={() => onAcceptSuggestion?.('score')}
        onDismiss={() => onDismissSuggestion?.('score')}
      />
    </div>
  );
};
