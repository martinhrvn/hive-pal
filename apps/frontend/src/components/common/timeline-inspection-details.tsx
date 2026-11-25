import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Thermometer } from 'lucide-react';
import { Link } from 'react-router';
import type { InspectionResponse } from 'shared-schemas';
import { FRAME_FIELDS } from '@/constants/frame-fields';
import { useUnitFormat } from '@/hooks/use-unit-format';
import { getScoreLevelTextClass } from '@/lib/score-level';
import { cn } from '@/lib/utils';
import { StatusPill } from './status-pill';
import { NUMERIC_KEYS, SCORE_KEYS } from './timeline-inspection-fields';

const toCamelCase = (value: string) =>
  value.replace(/-(\w)/g, (_, char: string) => char.toUpperCase());

const DetailGroup: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <div className="font-overline text-muted-foreground mb-1">{title}</div>
    {children}
  </div>
);

const ValueList: React.FC<{
  items: Array<{ key: string; label: string; value: React.ReactNode }>;
}> = ({ items }) => (
  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs tabular-nums">
    {items.map(({ key, label, value }) => (
      <div key={key} className="flex items-baseline justify-between gap-2">
        <dt className="text-muted-foreground truncate">{label}</dt>
        <dd className="font-medium text-foreground">{value}</dd>
      </div>
    ))}
  </dl>
);

/**
 * Inline detail panel for a timeline inspection row: weather, health scores
 * and the full set of observations, so the inspection doesn't have to be
 * opened to read it. Notes are rendered by the row itself.
 */
export const TimelineInspectionDetails: React.FC<{
  inspection: InspectionResponse;
}> = ({ inspection }) => {
  const { t } = useTranslation(['common', 'inspection']);
  const { formatTemperature } = useUnitFormat();
  const {
    observations: obs,
    score,
    temperature,
    weatherConditions,
  } = inspection;

  const numericItems = NUMERIC_KEYS.flatMap(key => {
    const value = obs?.[key];
    return value == null
      ? []
      : [{ key, label: t(`inspection:observations.${key}`), value }];
  });

  const frameItems = FRAME_FIELDS.flatMap(field => {
    const value = obs?.[field.obsKey] ?? 0;
    return value > 0
      ? [{ key: field.obsKey, label: t(field.labelKey), value }]
      : [];
  });

  const scoreItems = SCORE_KEYS.flatMap(([key, labelKey]) => {
    const value = score?.[key];
    return value == null
      ? []
      : [
          {
            key,
            label: t(`inspection:scores.${labelKey}`),
            value: (
              <span className={getScoreLevelTextClass(value)}>
                {value.toFixed(1)}
              </span>
            ),
          },
        ];
  });

  const additional = obs?.additionalObservations ?? [];
  const reminders = obs?.reminderObservations ?? [];
  const hasTags =
    obs?.swarmCells != null ||
    obs?.supersedureCells != null ||
    !!obs?.broodPattern ||
    additional.length > 0 ||
    reminders.length > 0;
  const hasWeather = temperature != null || !!weatherConditions;
  const formattedTemperature =
    temperature == null ? null : formatTemperature(temperature);

  return (
    <div className="mt-2 space-y-3 border-l-2 border-border pl-3">
      {hasWeather && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Thermometer className="size-3.5 shrink-0" />
          {formattedTemperature && (
            <span className="tabular-nums font-medium text-foreground">
              {formattedTemperature.value}
              {formattedTemperature.unit}
            </span>
          )}
          {weatherConditions && (
            <span className="capitalize">
              {t(`inspection:weather.${toCamelCase(weatherConditions)}`, {
                defaultValue: weatherConditions.replace(/-/g, ' '),
              })}
            </span>
          )}
        </div>
      )}

      {scoreItems.length > 0 && (
        <DetailGroup title={t('inspection:scores.title')}>
          <ValueList items={scoreItems} />
        </DetailGroup>
      )}

      {numericItems.length > 0 && (
        <DetailGroup title={t('inspection:observations.title')}>
          <ValueList items={numericItems} />
        </DetailGroup>
      )}

      {frameItems.length > 0 && (
        <DetailGroup title={t('inspection:observations.frameCounts.title')}>
          <ValueList items={frameItems} />
        </DetailGroup>
      )}

      {hasTags && (
        <div className="flex flex-wrap gap-1.5">
          {obs?.broodPattern && (
            <StatusPill size="sm">
              {t('inspection:observations.broodPattern')}:{' '}
              {t(
                `inspection:observations.broodPatternOptions.${obs.broodPattern}`,
              )}
            </StatusPill>
          )}
          {obs?.swarmCells != null && (
            <StatusPill size="sm" tone={obs.swarmCells ? 'warning' : 'neutral'}>
              {t('inspection:observations.swarmCells')}:{' '}
              {t(`inspection:fields.${obs.swarmCells ? 'yes' : 'no'}`)}
            </StatusPill>
          )}
          {obs?.supersedureCells != null && (
            <StatusPill
              size="sm"
              tone={obs.supersedureCells ? 'warning' : 'neutral'}
            >
              {t('inspection:observations.supersedureCells')}:{' '}
              {t(`inspection:fields.${obs.supersedureCells ? 'yes' : 'no'}`)}
            </StatusPill>
          )}
          {additional.map(item => (
            <StatusPill key={item} size="sm" tone="info">
              {t(`inspection:observations.additional.${item}`)}
            </StatusPill>
          ))}
          {reminders.map(item => (
            <StatusPill key={item} size="sm" tone="danger">
              {t(`inspection:observations.reminder.${item}`)}
            </StatusPill>
          ))}
        </div>
      )}

      <Link
        to={`/inspections/${inspection.id}`}
        onClick={e => e.stopPropagation()}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium text-muted-foreground',
          'hover:text-foreground hover:underline',
        )}
      >
        {t('common:timeline.openInspection')}
        <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
};
