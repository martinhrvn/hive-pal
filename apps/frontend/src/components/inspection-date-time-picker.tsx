import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface InspectionDateTimePickerProps {
  date: Date;
  isAllDay: boolean;
  onDateChange: (date: Date) => void;
  onIsAllDayChange: (isAllDay: boolean) => void;
  switchId?: string;
  labelClassName?: string;
  iconClassName?: string;
}

/**
 * Shared all-day toggle + time picker used in the inspection form,
 * schedule inspection page, and reschedule dialog.
 * Internally tracks and restores the previous time when toggling back from all-day.
 */
export const InspectionDateTimePicker: React.FC<
  InspectionDateTimePickerProps
> = ({
  date,
  isAllDay,
  onDateChange,
  onIsAllDayChange,
  switchId = 'isAllDay',
  labelClassName = 'text-sm cursor-pointer select-none',
  iconClassName = 'h-4 w-4 text-muted-foreground',
}) => {
  const { t } = useTranslation('inspection');
  const savedTimeRef = useRef<{ hours: number; minutes: number } | null>(null);

  const handleAllDayChange = (checked: boolean) => {
    onIsAllDayChange(checked);
    if (checked) {
      savedTimeRef.current = {
        hours: date.getHours(),
        minutes: date.getMinutes(),
      };
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      onDateChange(d);
    } else {
      const d = new Date(date);
      if (savedTimeRef.current) {
        d.setHours(
          savedTimeRef.current.hours,
          savedTimeRef.current.minutes,
          0,
          0,
        );
        savedTimeRef.current = null;
      }
      onDateChange(d);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Switch
          id={switchId}
          checked={isAllDay}
          onCheckedChange={handleAllDayChange}
        />
        <label htmlFor={switchId} className={labelClassName}>
          {t('form.allDay')}
        </label>
      </div>
      {!isAllDay && (
        <div className="flex items-center gap-2">
          <Clock className={iconClassName} />
          <Input
            type="time"
            className="w-32"
            value={format(date, 'HH:mm')}
            onChange={e => {
              if (!e.target.value) return;
              const [hours, minutes] = e.target.value.split(':').map(Number);
              const newDate = new Date(date);
              newDate.setHours(hours, minutes, 0, 0);
              onDateChange(newDate);
            }}
          />
        </div>
      )}
    </>
  );
};
