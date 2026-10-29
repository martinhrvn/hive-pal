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
import { rangeCovers } from '@/utils/season-strip';

/** Leap year the calendar shows, so Feb 29 is a day you can pick. */
const REFERENCE_YEAR = 2000;
const FIRST_MONTH = new Date(REFERENCE_YEAR, 0, 1);
const LAST_MONTH = new Date(REFERENCE_YEAR, 11, 1);

type MonthDayRange = { start: SeasonMonthDay; end: SeasonMonthDay };

function toDate(value: SeasonMonthDay): Date {
  return new Date(REFERENCE_YEAR, value.month - 1, value.day);
}

function toMonthDay(date: Date): SeasonMonthDay {
  return { month: date.getMonth() + 1, day: date.getDate() };
}

interface MonthDayFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  /** The whole season, shaded in the calendar so you see what you change. */
  range?: MonthDayRange;
  /** Other seasons; their days are marked, as picking one shortens them. */
  taken?: MonthDayRange[];
  /** Days that cannot be picked. */
  isBlocked?: (day: SeasonMonthDay) => boolean;
  /** Handles a picked day instead of setting the field. */
  onPick?: (day: SeasonMonthDay) => void;
}

/**
 * A day of the year (no year) bound to a `{ month, day }` form field: a
 * button showing "March 1" that opens a calendar of a single year.
 */
export function MonthDayField<T extends FieldValues>({
  control,
  name,
  label,
  range,
  taken = [],
  isBlocked,
  onPick,
}: Readonly<MonthDayFieldProps<T>>) {
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
                  disabled={
                    isBlocked ? date => isBlocked(toMonthDay(date)) : undefined
                  }
                  modifiers={{
                    inSeason: date =>
                      !!range && rangeCovers(range, toMonthDay(date)),
                    taken: date =>
                      taken.some(other => rangeCovers(other, toMonthDay(date))),
                  }}
                  modifiersClassNames={{
                    inSeason: 'bg-muted',
                    // A dot under the number: another season's day.
                    taken:
                      'after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-muted-foreground',
                  }}
                  onSelect={date => {
                    const day = toMonthDay(date);
                    if (onPick) onPick(day);
                    else field.onChange(day);
                    setOpen(false);
                  }}
                  autoFocus
                />
                {taken.length > 0 && (
                  <p className="max-w-64 px-3 pb-3 text-xs text-muted-foreground">
                    {t('season.takenHint')}
                  </p>
                )}
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
