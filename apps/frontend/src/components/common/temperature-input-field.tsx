import { Thermometer } from 'lucide-react';
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';
import NumericField from './numeric-input-field';

interface TemperatureFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  min?: number;
  max?: number;
  defaultValue?: number;
}

const TemperatureField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  field,
  min = -50,
  max = 50,
  defaultValue = 10,
}: TemperatureFieldProps<TFieldValues, TName>) => {
  // Render function for the temperature icon
  const renderTemperatureIcon = (value: number | null) => {
    let colorClass = 'text-gray-400';

    if (value !== null) {
      if (value <= -20) colorClass = 'text-blue-600';
      else if (value <= 0) colorClass = 'text-blue-400';
      else if (value <= 15) colorClass = 'text-green-500';
      else if (value <= 30) colorClass = 'text-yellow-500';
      else colorClass = 'text-red-500';
    }

    return <Thermometer className={`h-5 w-5 ${colorClass}`} />;
  };

  return (
    <NumericField
      field={field}
      min={min}
      max={max}
      defaultValue={defaultValue}
      renderIcon={renderTemperatureIcon}
      unit="°C"
    />
  );
};

export default TemperatureField;
