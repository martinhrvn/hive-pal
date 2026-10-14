import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ActionDateTimeFieldProps {
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * Date + time picker for the action dialogs. The calendar yields the picked
 * day at midnight, so the existing time of day is carried over onto it.
 */
export const ActionDateTimeField = ({
  value,
  onChange,
}: ActionDateTimeFieldProps) => {
  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const next = new Date(day);
    next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(next);
  };

  const handleTimeChange = (time: string) => {
    if (!time) return;
    const [hours, minutes] = time.split(':').map(Number);
    const next = new Date(value);
    next.setHours(hours, minutes, 0, 0);
    onChange(next);
  };

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1">
        <label className="block text-sm font-medium mb-2">Action Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(value, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              defaultMonth={value}
              onSelect={handleDaySelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label htmlFor="action-time" className="block text-sm font-medium mb-2">
          Time
        </label>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            id="action-time"
            type="time"
            className="w-32"
            value={format(value, 'HH:mm')}
            onChange={e => handleTimeChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
