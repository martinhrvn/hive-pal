import { useState } from 'react';
import NumericField, {
  type NumericFieldProps,
} from '@/components/common/numeric-input-field.tsx';
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

export const Default = () => (
  <NumericField
    value={20}
    onChange={() => {}}
    min={0}
    max={100}
    defaultValue={20}
    unit="°C"
  />
);

type StatefulProps = Pick<
  NumericFieldProps,
  'min' | 'max' | 'defaultValue' | 'unit' | 'step' | 'decimalPlaces'
> & {
  initialValue?: number | null;
};

// Controlled story: owns its state and records it into a hidden input so
// tests can assert onChange effects without crossing the Node/browser boundary.
export const Stateful = ({
  initialValue = 5,
  min = 0,
  max = 10,
  defaultValue = 5,
  unit = 'items',
  step = 1,
  decimalPlaces = 0,
}: StatefulProps) => {
  const [value, setValue] = useState<number | null>(initialValue);
  return (
    <>
      <NumericField
        value={value}
        onChange={setValue}
        min={min}
        max={max}
        defaultValue={defaultValue}
        unit={unit}
        step={step}
        decimalPlaces={decimalPlaces}
      />
      <form hidden>
        <input data-test="field-value" readOnly value={String(value)} />
      </form>
    </>
  );
};
