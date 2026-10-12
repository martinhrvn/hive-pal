import { useState } from 'react';
import TemperatureField from '@/components/common/temperature-input-field.tsx';

export const Default = () => (
  <TemperatureField value={20} onChange={() => {}} />
);

type StatefulProps = {
  initialValue?: number | null;
  min?: number;
  max?: number;
};

// Controlled story: owns its state and records it into a hidden input so
// tests can assert onChange effects without crossing the Node/browser boundary.
export const Stateful = ({
  initialValue = 20,
  min = -10,
  max = 40,
}: StatefulProps) => {
  const [value, setValue] = useState<number | null>(initialValue);
  return (
    <>
      <TemperatureField value={value} onChange={setValue} min={min} max={max} />
      <form hidden>
        <input data-test="field-value" readOnly value={String(value)} />
      </form>
    </>
  );
};
