import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.tsx';
import { Cloud, CloudRain, CloudSun, Sun } from 'lucide-react';
import { InspectionFormData } from '@/pages/inspection/components/inspection-form/schema.ts';
import { useFormContext } from 'react-hook-form';
import { TemperatureField } from '@/components/common';
import { AiBadge } from './ai-badge';
import { AiMergeState } from '@/pages/inspection/lib/inspection-ai-merge';
import { AiSuggestionPreview } from './ai-suggestion-preview';
import { cn } from '@/lib/utils';

const weatherConditions = [
  {
    id: 'sunny',
    label: 'Sunny',
    icon: Sun,
    style: 'bg-background border-border hover:border-amber-600',
    styleActive: 'bg-amber-50 border-amber-400',
    iconStyle: 'text-amber-400',
    iconStyleActive: 'text-amber-600',
  },
  {
    id: 'partly-cloudy',
    label: 'Partly cloudy',
    icon: CloudSun,
    style: 'bg-background border-border hover:border-gray-600',
    styleActive: 'bg-blue-50 border-gray-600',
    iconStyle: 'text-amber-800',
    iconStyleActive: 'text-amber-400',
  },
  {
    id: 'cloudy',
    label: 'Cloudy',
    icon: Cloud,
    style: 'bg-background border-border hover:border-gray-800',
    styleActive: 'bg-gray-100 border-gray-600',
    iconStyle: 'text-gray-400',
    iconStyleActive: 'text-gray-600',
  },
  {
    id: 'rainy',
    label: 'Rainy',
    icon: CloudRain,
    style: 'bg-background border-border hover:border-blue-800',
    styleActive: 'bg-blue-100 border-blue-900',
    iconStyle: 'text-blue-600 hover:text-blue-400',
    iconStyleActive: 'text-blue-800',
  },
];

type WeatherSectionProps = {
  isAiSuggested?: (field: keyof InspectionFormData) => boolean;
  aiMergeState?: AiMergeState | null;
  onAcceptSuggestion?: (field: keyof InspectionFormData) => void;
  onDismissSuggestion?: (field: keyof InspectionFormData) => void;
};

const getNumericTemperature = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const getWeatherConditionValue = (value: unknown): string | null => {
  return typeof value === 'string' && value.length > 0 ? value : null;
};

export const WeatherSection = ({
  isAiSuggested,
  aiMergeState,
  onAcceptSuggestion,
  onDismissSuggestion,
}: WeatherSectionProps) => {
  const { t } = useTranslation('inspection');
  const form = useFormContext<InspectionFormData>();

  const weatherLabels: Record<string, string> = {
    sunny: t('inspection:form.weather.sunny'),
    'partly-cloudy': t('inspection:form.weather.partlyCloudy'),
    cloudy: t('inspection:form.weather.cloudy'),
    rainy: t('inspection:form.weather.rainy'),
  };

  const temperatureSuggestion = isAiSuggested?.('temperature')
    ? aiMergeState?.suggestions.temperature
    : undefined;

  const weatherConditionSuggestion = isAiSuggested?.('weatherConditions')
    ? aiMergeState?.suggestions.weatherConditions
    : undefined;

  const suggestedTemperature = getNumericTemperature(
    temperatureSuggestion?.aiValue,
  );
  const suggestedWeatherCondition = getWeatherConditionValue(
    weatherConditionSuggestion?.aiValue,
  );

  const isTemperaturePending = temperatureSuggestion?.status === 'pending';
  const isWeatherPending = weatherConditionSuggestion?.status === 'pending';

  return (
    <div>
      <h3 className="text-lg font-medium">
        {t('inspection:form.weather.title')}
      </h3>
      <p className="text-sm text-gray-400">
        {t('inspection:form.weather.description')}
      </p>

      <div className="grid grid-cols-1 space-y-4 py-4">
        <div
          data-ai-field="temperature"
          className={cn(
            'rounded-md p-3 transition-colors',
            isTemperaturePending &&
              'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
          )}
        >
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <span>{t('inspection:form.weather.temperature')}</span>
                  {temperatureSuggestion && <AiBadge />}
                </FormLabel>

                <TemperatureField
                  onChange={field.onChange}
                  min={0}
                  value={field.value ?? null}
                  name={field.name}
                  max={55}
                  onBlur={field.onBlur}
                />

                {temperatureSuggestion && (
                  <AiSuggestionPreview
                    label={t('inspection:form.weather.temperature')}
                    currentValue={
                      field.value !== null && field.value !== undefined
                        ? `${field.value}°C`
                        : null
                    }
                    suggestedValue={
                      suggestedTemperature !== null
                        ? `${suggestedTemperature}°C`
                        : null
                    }
                    hasConflict={temperatureSuggestion.hasConflict}
                    status={temperatureSuggestion.status}
                    onAccept={() => onAcceptSuggestion?.('temperature')}
                    onDismiss={() => onDismissSuggestion?.('temperature')}
                  />
                )}

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div
          data-ai-field="weatherConditions"
          className={cn(
            'rounded-md p-3 transition-colors',
            isWeatherPending &&
              'border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20',
          )}
        >
          <FormField
            control={form.control}
            name="weatherConditions"
            rules={{ required: 'Please select a weather condition' }}
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="flex items-center gap-2">
                  <span>{t('inspection:form.weather.condition')}</span>
                  {weatherConditionSuggestion && <AiBadge />}
                </FormLabel>

                <FormControl>
                  <div className="flex flex-wrap justify-start gap-3">
                    {weatherConditions.map(condition => {
                      const Icon = condition.icon;
                      const isSelected = field.value === condition.id;
                      const isAiRecommended =
                        isWeatherPending &&
                        suggestedWeatherCondition === condition.id;

                      return (
                        <button
                          type="button"
                          key={condition.id}
                          onClick={() => field.onChange(condition.id)}
                          onKeyDown={() => {}}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 transition-all',
                            isSelected
                              ? condition.styleActive
                              : condition.style,
                            isAiRecommended &&
                              'ring-2 ring-blue-300 dark:ring-blue-700',
                          )}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              isSelected
                                ? condition.iconStyleActive
                                : condition.iconStyle
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {weatherLabels[condition.id] || condition.label}
                          </span>
                          {isAiRecommended && <AiBadge />}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>

                {weatherConditionSuggestion && (
                  <AiSuggestionPreview
                    label={t('inspection:form.weather.condition')}
                    currentValue={
                      field.value
                        ? weatherLabels[field.value] || field.value
                        : null
                    }
                    suggestedValue={
                      suggestedWeatherCondition
                        ? weatherLabels[suggestedWeatherCondition] ||
                          suggestedWeatherCondition
                        : null
                    }
                    hasConflict={weatherConditionSuggestion.hasConflict}
                    status={weatherConditionSuggestion.status}
                    onAccept={() => onAcceptSuggestion?.('weatherConditions')}
                    onDismiss={() => onDismissSuggestion?.('weatherConditions')}
                  />
                )}

                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
