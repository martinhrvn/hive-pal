import NumericField from '@/components/common/numeric-input-field.tsx';
import { Thermometer } from 'lucide-react';

export const NumericInputFieldWithIcon = () => (
  <NumericField
    value={25}
    onChange={() => {}}
    min={0}
    max={100}
    defaultValue={20}
    unit="°C"
    renderIcon={value => (
      <Thermometer
        className={`h-5 w-5 ${value && value > 20 ? 'text-red-500' : 'text-blue-500'}`}
      />
    )}
  />
);
