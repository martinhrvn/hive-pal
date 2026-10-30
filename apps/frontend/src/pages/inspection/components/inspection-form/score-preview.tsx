import React, { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { calculateScores, ScoreResult } from 'shared-schemas';
import { Pencil, RotateCcw, BarChart, CrownIcon } from 'lucide-react';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { IconJarLogoIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InspectionFormData } from './schema';
import { getModeSpecificObservations } from './mode-behavior';
import { RatingSlider } from '@/components/common/rating-slider';
import { ScoreLevelCue } from '@/components/common/score-level-cue';
import { getScoreLevelTextClass } from '@/lib/score-level';

type ScoreKey =
  'overallScore' | 'populationScore' | 'storesScore' | 'queenScore';

type ScorePreviewSectionProps = {
  totalFrames?: number | null;
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
          <span className="truncate text-sm text-muted-foreground">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <ScoreLevelCue value={displayValue} />
          <span
            className={`text-lg font-bold ${getScoreLevelTextClass(displayValue)}`}
          >
            {displayValue?.toFixed(1) ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('units.outOfTen')}
          </span>

          {isOverridden && (
            <button
              type="button"
              className="ml-1 rounded p-0.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={e => {
                e.preventDefault();
                onClear();
                setEditing(false);
              }}
              aria-label={t('scores.resetToCalculated')}
              title={t('scores.calculatedValue', {
                value: calculatedValue?.toFixed(1) ?? '—',
              })}
            >
              <RotateCcw className="size-3" />
            </button>
          )}

          <button
            type="button"
            className={`ml-0.5 rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              editing
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={e => {
              e.preventDefault();
              setEditing(!editing);
            }}
            aria-label={t('scores.override')}
          >
            <Pencil className="size-3" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="flex items-center gap-2">
          <RatingSlider
            value={ratingValue}
            onChange={onOverride}
            showZeroButton={true}
            onClear={() => onOverride(null)}
          />

          <Input
            type="number"
            min={0}
            max={10}
            step={0.1}
            className="h-8 w-16 text-center text-sm"
            value={ratingValue ?? ''}
            onChange={e => {
              const val =
                e.target.value === '' ? null : parseFloat(e.target.value);
              if (val !== null && (val < 0 || val > 10)) return;
              onOverride(val !== null ? Math.round(val * 100) / 100 : null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export const ScorePreviewSection: React.FC<ScorePreviewSectionProps> = ({
  totalFrames,
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

  if (!hasAnyScore) return null;

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
      icon: <BarChart className="size-4 text-muted-foreground/60" />,
    },
    {
      key: 'populationScore',
      label: t('scores.population'),
      icon: <BeeIcon className="size-4 text-muted-foreground/60" />,
    },
    {
      key: 'storesScore',
      label: t('scores.stores'),
      icon: <IconJarLogoIcon className="size-4 text-muted-foreground/60" />,
    },
    {
      key: 'queenScore',
      label: t('scores.queen'),
      icon: <CrownIcon className="size-4 text-muted-foreground/60" />,
    },
  ];

  return (
    <div className="space-y-3 rounded-md p-3 transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-medium">
          <span>{t('scores.title')}</span>
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
            <RotateCcw className="mr-1 size-3" />
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
    </div>
  );
};
