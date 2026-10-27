import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { daysInMonth } from 'shared-schemas';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MONTHS = [
  { value: 1, key: 'january' },
  { value: 2, key: 'february' },
  { value: 3, key: 'march' },
  { value: 4, key: 'april' },
  { value: 5, key: 'may' },
  { value: 6, key: 'june' },
  { value: 7, key: 'july' },
  { value: 8, key: 'august' },
  { value: 9, key: 'september' },
  { value: 10, key: 'october' },
  { value: 11, key: 'november' },
  { value: 12, key: 'december' },
] as const;

interface MonthDayFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
}

/**
 * A month + day picker bound to a `{ month, day }` form field. Day options
 * follow the selected month, and the day clamps down when the month shrinks.
 */
export function MonthDayField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
}: MonthDayFieldProps<T>) {
  const { t } = useTranslation('common');

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = (field.value ?? {}) as {
          month?: number;
          day?: number;
        };
        const month = value.month ?? 1;
        const day = value.day ?? 1;
        const days = daysInMonth(month, 2000);

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex gap-2">
              <Select
                disabled={disabled}
                value={value.month?.toString()}
                onValueChange={nextMonth => {
                  const parsedMonth = Number(nextMonth);
                  field.onChange({
                    month: parsedMonth,
                    day: Math.min(day, daysInMonth(parsedMonth, 2000)),
                  });
                }}
              >
                <FormControl>
                  <SelectTrigger className="min-w-0 flex-1">
                    <SelectValue placeholder={t('months.selectMonth')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MONTHS.map(monthOption => (
                    <SelectItem
                      key={monthOption.value}
                      value={monthOption.value.toString()}
                    >
                      {t(`months.${monthOption.key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                disabled={disabled}
                value={value.day?.toString()}
                onValueChange={nextDay => {
                  field.onChange({ month, day: Number(nextDay) });
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder={t('season.day')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: days }, (_, index) => index + 1).map(
                    dayOption => (
                      <SelectItem key={dayOption} value={dayOption.toString()}>
                        {dayOption}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
