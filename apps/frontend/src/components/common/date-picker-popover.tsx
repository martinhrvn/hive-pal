import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDateFormat } from '@/hooks/use-date-format';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type DatePickerPopoverProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'onChange'
> & {
  readonly date: Date | undefined;
  /** Receives `undefined` when the selected day is clicked again. */
  readonly onDateChange: (date: Date | undefined) => void;
  readonly placeholder?: string;
  readonly align?: 'start' | 'center' | 'end';
};

/**
 * Outline button showing the date in the user's preferred format, opening a
 * calendar. Extra props (id, aria-*) go to the trigger button, so it works
 * inside `FormControl`.
 */
export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  date,
  onDateChange,
  placeholder,
  align = 'start',
  className,
  ...buttonProps
}) => {
  const { formatDate } = useDateFormat();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className,
          )}
          {...buttonProps}
        >
          <CalendarIcon className="size-4" />
          {date ? formatDate(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
};
