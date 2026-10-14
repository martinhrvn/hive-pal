import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useDateFormat } from '@/hooks/use-date-format';
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
  const { t } = useTranslation(['hive', 'common']);
  const { formatDate, weekStartsOn } = useDateFormat();
  const dateId = useId();
  const timeId = useId();

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
        <label htmlFor={dateId} className="block text-sm font-medium mb-2">
          {t('hive:actionDialog.date')}
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id={dateId}
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDate(value)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              defaultMonth={value}
              weekStartsOn={weekStartsOn}
              onSelect={handleDaySelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label htmlFor={timeId} className="block text-sm font-medium mb-2">
          {t('common:time.time')}
        </label>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            id={timeId}
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
