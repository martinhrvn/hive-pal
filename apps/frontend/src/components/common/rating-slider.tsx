import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * RatingSlider component for 0-10 rating input
 *
 * Provides a visual grid of 10 buttons for rating selection,
 * with optional zero button and hover state feedback.
 * Uses amber colors to indicate rating level.
 *
 * @param value - Current rating value (0-10 or undefined)
 * @param onChange - Callback fired when rating changes
 * @param disabled - Whether the input is disabled
 * @param showZeroButton - Whether to show an optional zero button (default: true)
 * @param onClear - Optional callback for clearing the rating
 */
interface RatingSliderProps {
  value?: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  showZeroButton?: boolean;
  onClear?: () => void;
}

export const RatingSlider: React.FC<RatingSliderProps> = ({
  value,
  onChange,
  disabled = false,
  showZeroButton = true,
  onClear,
}) => {
  const { t } = useTranslation('inspection');
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showZeroButton && (
        <button
          type="button"
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            value === 0
              ? 'bg-gray-600 text-white dark:bg-gray-300 dark:text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800',
          )}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onChange(0);
          }}
          disabled={disabled}
          aria-label={t('observations.rateAs', { value: 0 })}
        >
          0
        </button>
      )}

      <div className="grid h-8 min-w-[220px] grow grid-cols-10 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(fullValue => {
          let color = 'bg-gray-200 dark:bg-gray-700';

          if (hoveredValue != null && hoveredValue >= fullValue) {
            color = 'bg-amber-200 dark:bg-amber-800';
          } else if (value != null && value >= fullValue) {
            color = 'bg-amber-300 dark:bg-amber-700';
          }

          return (
            <button
              key={fullValue}
              type="button"
              className={cn(
                'w-full rounded text-xs transition-colors duration-300',
                color,
                hoveredValue === fullValue
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-transparent',
              )}
              onMouseEnter={() => !disabled && setHoveredValue(fullValue)}
              onMouseLeave={() => setHoveredValue(null)}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled) {
                  onChange(fullValue);
                  setHoveredValue(null);
                }
              }}
              disabled={disabled}
              aria-label={t('observations.rateAs', { value: fullValue })}
            >
              {hoveredValue === fullValue && hoveredValue}
            </button>
          );
        })}
      </div>

      <div className="h-8 w-8 text-center">
        <span className="block h-8 rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
          {value ?? '-'}
        </span>
      </div>

      {onClear && (
        <Button
          variant="ghost"
          type="button"
          disabled={value == null || disabled}
          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onClear();
          }}
          aria-label={t('observations.clearRating')}
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
};
