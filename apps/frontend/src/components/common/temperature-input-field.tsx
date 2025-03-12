import { Thermometer } from 'lucide-react';
import NumericField from './numeric-input-field';

interface TemperatureFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  name?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}

const TemperatureField = ({
  value,
  onChange,
  onBlur,
  name,
  min = -50,
  max = 50,
  defaultValue = 10,
}: TemperatureFieldProps) => {
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
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      name={name}
      min={min}
      max={max}
      placeholder={'Enter temperature'}
      defaultValue={defaultValue}
      renderIcon={renderTemperatureIcon}
      unit="°C"
    />
  );
};

export default TemperatureField;
