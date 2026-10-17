import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { quantityInput } from './equipment-utils';

interface QuantityInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
  /** Decides whether fractions are allowed (kg, l, …) or whole pieces only. */
  unit: string;
  label: string;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function QuantityInput({
  value,
  onChange,
  unit,
  label,
  id,
  placeholder,
  className,
}: Readonly<QuantityInputProps>) {
  const { step, parse } = quantityInput(unit);
  return (
    <Input
      id={id}
      type="number"
      min="0"
      step={step}
      value={value ?? ''}
      onChange={e => onChange(parse(e.target.value))}
      aria-label={id ? undefined : label}
      placeholder={placeholder}
      className={cn('w-20 text-center', className)}
    />
  );
}
