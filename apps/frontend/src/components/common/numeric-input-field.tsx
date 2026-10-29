import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, MinusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { TEST_SELECTORS } from '@/utils/test-selectors.ts';

export interface NumericFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  name?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
  step?: number;
  renderIcon?: (value: number | null) => React.ReactNode;
  unit?: string;
  placeholder?: string;
  decimalPlaces?: number;
  id?: string;
}

const NumericField = ({
  value,
  onChange,
  onBlur,
  name,
  min,
  max,
  defaultValue = 0,
  step = 1,
  renderIcon,
  unit,
  placeholder,
  decimalPlaces = 0,
  id = name,
}: NumericFieldProps) => {
  const { t } = useTranslation('common');
  const [showSlider, setShowSlider] = useState<boolean>(false);
  const [numericValue, setNumericValue] = useState<number | null>(
    value ?? defaultValue,
  );
  const componentRef = useRef<HTMLDivElement>(null);

  // Update internal state when value prop changes
  useEffect(() => {
    setNumericValue(value);
  }, [value]);

  // Handle clicks outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        componentRef.current &&
        !componentRef.current.contains(event.target as Node)
      ) {
        setShowSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const commitValue = (next: number) => {
    const rounded = parseFloat(next.toFixed(decimalPlaces));
    const clamped = Math.min(
      max ?? Infinity,
      Math.max(min ?? -Infinity, rounded),
    );
    onChange(clamped);
    setNumericValue(clamped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      onChange(null);
      setNumericValue(null);
      return;
    }

    const value = parseFloat(parseFloat(e.target.value).toFixed(decimalPlaces));
    if (
      !isNaN(value) &&
      (min === undefined || value >= min) &&
      (max === undefined || value <= max)
    ) {
      onChange(value);
      setNumericValue(value);
    }
  };

  const handleSliderChange = (value: number[]) => {
    commitValue(value[0]);
  };

  const incrementValue = () => {
    commitValue((numericValue ?? 0) + step);
  };

  const decrementValue = () => {
    commitValue((numericValue ?? 0) - step);
  };

  const showSliderSection =
    showSlider && min !== undefined && max !== undefined;

  return (
    <div className="relative flex w-full items-center" ref={componentRef}>
      <button
        type="button"
        data-test={TEST_SELECTORS.NUMERIC_FIELD_DECREMENT_BUTTON}
        aria-label={t('numericField.decrement')}
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        onClick={decrementValue}
      >
        <MinusIcon className="size-5" />
      </button>
      <div className="relative w-full rounded-md shadow-sm">
        {renderIcon && (
          <div
            data-test={'input-icon'}
            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          >
            {renderIcon(numericValue)}
          </div>
        )}
        <Input
          type="number"
          id={id}
          placeholder={placeholder || defaultValue.toString()}
          className={`${renderIcon ? 'pl-10' : ''} ${unit ? 'pr-18' : 'pr-12'} rounded-md text-right`}
          value={numericValue === null ? '' : numericValue}
          name={name}
          onFocus={() =>
            min !== undefined && max !== undefined && setShowSlider(true)
          }
          onBlur={() => {
            if (onBlur) onBlur();
          }}
          onChange={handleInputChange}
          step={step}
          min={min}
          max={max}
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
          }}
        />
        {unit && (
          <div className="absolute inset-y-0 right-10 flex items-center">
            <span className="text-muted-foreground pr-2">{unit}</span>
          </div>
        )}
      </div>
      <button
        type="button"
        data-test={TEST_SELECTORS.NUMERIC_FIELD_INCREMENT_BUTTON}
        aria-label={t('numericField.increment')}
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        onClick={incrementValue}
      >
        <PlusIcon className="size-5" />
      </button>

      {showSliderSection && (
        <div
          data-test="numeric-slider"
          className="absolute inset-x-0 -top-16 z-10 rounded-t-md border bg-popover px-2 pb-2 pt-5 text-popover-foreground shadow-sm"
        >
          <Slider
            value={[numericValue ?? defaultValue]}
            min={min}
            max={max}
            step={step}
            onValueChange={handleSliderChange}
            className="mt-2"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>
              {min}
              {unit}
            </span>
            <span>
              {max}
              {unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NumericField;
