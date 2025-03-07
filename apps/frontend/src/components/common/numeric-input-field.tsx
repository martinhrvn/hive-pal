import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';

export interface NumericFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  min?: number;
  max?: number;
  defaultValue?: number;
  step?: number;
  renderIcon?: (value: number | null) => React.ReactNode;
  unit?: string;
  placeholder?: string;
  decimalPlaces?: number;
}

const NumericField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  field,
  min,
  max,
  defaultValue = 0,
  step = 1,
  renderIcon,
  unit,
  placeholder,
  decimalPlaces = 0,
}: NumericFieldProps<TFieldValues, TName>) => {
  const [showSlider, setShowSlider] = useState<boolean>(false);
  const [numericValue, setNumericValue] = useState<number | null>(
    field.value ?? defaultValue,
  );
  const componentRef = useRef<HTMLDivElement>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      field.onChange(null);
      setNumericValue(null);
      return;
    }

    const value = parseFloat(parseFloat(e.target.value).toFixed(decimalPlaces));
    if (
      !isNaN(value) &&
      (min === undefined || value >= min) &&
      (max === undefined || value <= max)
    ) {
      field.onChange(value);
      setNumericValue(value);
    }
  };

  const handleSliderChange = (value: number[]) => {
    const roundedValue = parseFloat(value[0].toFixed(decimalPlaces));
    field.onChange(roundedValue);
    setNumericValue(roundedValue);
  };

  const incrementValue = () => {
    if (
      max !== undefined &&
      numericValue !== null &&
      numericValue + step > max
    ) {
      field.onChange(max);
      setNumericValue(max);
      return;
    }
    const newValue = parseFloat(
      ((numericValue ?? 0) + step).toFixed(decimalPlaces),
    );
    field.onChange(newValue);
    setNumericValue(newValue);
  };

  const decrementValue = () => {
    if (
      min !== undefined &&
      numericValue !== null &&
      numericValue - step < min
    ) {
      field.onChange(min);
      setNumericValue(min);
      return;
    }
    const newValue = parseFloat(
      ((numericValue ?? 0) - step).toFixed(decimalPlaces),
    );
    field.onChange(newValue);
    setNumericValue(newValue);
  };

  // No need for a separate getColor function anymore

  const showSliderSection =
    showSlider && min !== undefined && max !== undefined;

  return (
    <div className="w-full" ref={componentRef}>
      <div className="relative w-full rounded-md shadow-sm">
        {renderIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {renderIcon(numericValue)}
          </div>
        )}
        <Input
          type="number"
          placeholder={placeholder || defaultValue.toString()}
          className={`${renderIcon ? 'pl-10' : ''} ${unit ? 'pr-16' : 'pr-10'} rounded-md text-right`}
          value={numericValue === null ? '' : numericValue}
          name={field.name}
          onFocus={() =>
            min !== undefined && max !== undefined && setShowSlider(true)
          }
          onBlur={() => {
            field.onBlur();
          }}
          onChange={handleInputChange}
          ref={field.ref}
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
            <span className="text-gray-500 pr-2">{unit}</span>
          </div>
        )}
        <div className="absolute inset-y-0 right-0 flex flex-col h-full">
          <button
            type="button"
            className="h-1/2 px-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={incrementValue}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="h-1/2 px-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={decrementValue}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {showSliderSection && (
        <div className="px-2 pb-2 pt-5 bg-white border rounded-b-md shadow-sm">
          <Slider
            value={[numericValue ?? defaultValue]}
            min={min}
            max={max}
            step={step}
            onValueChange={handleSliderChange}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
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
