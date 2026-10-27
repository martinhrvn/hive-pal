import { useState } from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CalendarIcon } from 'lucide-react';
import type { SeasonMonthDay } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatMonthDay } from '@/utils/season-format';
import { stripDayIndex } from '@/utils/season-strip';

/** Leap year the calendar shows, so Feb 29 is a day you can pick. */
const REFERENCE_YEAR = 2000;
const FIRST_MONTH = new Date(REFERENCE_YEAR, 0, 1);
const LAST_MONTH = new Date(REFERENCE_YEAR, 11, 1);

function toDate(value: SeasonMonthDay): Date {
  return new Date(REFERENCE_YEAR, value.month - 1, value.day);
}

/** Whether a day falls in the season, including one across the new year. */
function inRange(
  date: Date,
  range: { start: SeasonMonthDay; end: SeasonMonthDay },
) {
  const day = stripDayIndex(date.getMonth() + 1, date.getDate());
  const start = stripDayIndex(range.start.month, range.start.day);
  const end = stripDayIndex(range.end.month, range.end.day);
  return start <= end ? day >= start && day <= end : day >= start || day <= end;
}

interface MonthDayFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
  /** The whole season, shaded in the calendar so you see what you change. */
  range?: { start: SeasonMonthDay; end: SeasonMonthDay };
}

/**
 * A day of the year (no year) bound to a `{ month, day }` form field: a
 * button showing "March 1" that opens a calendar of a single year.
 */
export function MonthDayField<T extends FieldValues>({
  control,
  name,
  label,
  disabled,
  range,
}: MonthDayFieldProps<T>) {
  const { t, i18n } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const now = new Date();
  const today = new Date(REFERENCE_YEAR, now.getMonth(), now.getDate());

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = field.value as SeasonMonthDay | undefined;
        const selected = value ? toDate(value) : undefined;

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selected && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="size-4" />
                    {selected
                      ? formatMonthDay(selected, i18n.language)
                      : t('season.pickDay')}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  required
                  selected={selected}
                  defaultMonth={selected ?? today}
                  today={today}
                  startMonth={FIRST_MONTH}
                  endMonth={LAST_MONTH}
                  showOutsideDays={false}
                  // Weekdays belong to one year; a season repeats every year.
                  hideWeekdays
                  formatters={{
                    formatCaption: date =>
                      date.toLocaleDateString(i18n.language, { month: 'long' }),
                  }}
                  modifiers={
                    range
                      ? { inSeason: date => inRange(date, range) }
                      : undefined
                  }
                  modifiersClassNames={{ inSeason: 'bg-muted' }}
                  onSelect={date => {
                    field.onChange({
                      month: date.getMonth() + 1,
                      day: date.getDate(),
                    });
                    setOpen(false);
                  }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
