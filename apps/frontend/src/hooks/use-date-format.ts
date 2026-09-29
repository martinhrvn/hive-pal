import { usePreferences } from '@/api/hooks/useUserPreferences';
import {
  formatDateWithPreference,
  formatDateTimeWithPreference,
  formatTimeWithPreference,
  formatDateForInput,
  parseDateWithPreference,
  getDateFormatDisplay,
  type DateFormatPreference,
  type TimeFormatPreference,
} from '@/utils/date-format';

/**
 * Hook that provides date formatting functions based on user preferences
 */
export function useDateFormat() {
  const { preferences } = usePreferences();

  const dateFormat =
    (preferences.data?.dateFormat as DateFormatPreference) || 'MM/DD/YYYY';

  const timeFormat =
    (preferences.data?.timeFormat as TimeFormatPreference) || '24h';

  // Numeric first-day-of-week for react-day-picker / date-fns
  // (0 = Sunday, 1 = Monday). Defaults to Monday.
  const weekStartsOn: 0 | 1 =
    preferences.data?.weekStartsOn === 'sunday' ? 0 : 1;

  return {
    // Current user's date format preference
    dateFormat,

    // Current user's time format preference ('12h' | '24h')
    timeFormat,

    // Current user's first day of week as a numeric value (0 = Sun, 1 = Mon)
    weekStartsOn,

    // Format a date according to user preference
    formatDate: (date: Date | string) =>
      formatDateWithPreference(date, dateFormat),

    // Format a date with time according to user preference
    formatDateTime: (date: Date | string) =>
      formatDateTimeWithPreference(date, dateFormat, timeFormat),

    // Format a time according to the user's 12h/24h preference
    formatTime: (date: Date | string) =>
      formatTimeWithPreference(date, timeFormat),

    // Format date for HTML date inputs (always YYYY-MM-DD)
    formatDateForInput: formatDateForInput,

    // Parse user input according to their preference
    parseDate: (dateString: string) =>
      parseDateWithPreference(dateString, dateFormat),

    // Get display string for the current format
    getFormatDisplay: () => getDateFormatDisplay(dateFormat),
  };
}
