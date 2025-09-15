import { usePreferences } from '@/api/hooks/useUserPreferences';
import {
  formatDateWithPreference,
  formatDateTimeWithPreference,
  formatDateForInput,
  parseDateWithPreference,
  getDateFormatDisplay,
  type DateFormatPreference,
} from '@/utils/date-format';

/**
 * Hook that provides date formatting functions based on user preferences
 */
export function useDateFormat() {
  const { preferences } = usePreferences();

  const dateFormat =
    (preferences.data?.dateFormat as DateFormatPreference) || 'MM/DD/YYYY';

  return {
    // Current user's date format preference
    dateFormat,

    // Format a date according to user preference
    formatDate: (date: Date | string) =>
      formatDateWithPreference(date, dateFormat),

    // Format a date with time according to user preference
    formatDateTime: (date: Date | string) =>
      formatDateTimeWithPreference(date, dateFormat),

    // Format date for HTML date inputs (always YYYY-MM-DD)
    formatDateForInput: formatDateForInput,

    // Parse user input according to their preference
    parseDate: (dateString: string) =>
      parseDateWithPreference(dateString, dateFormat),

    // Get display string for the current format
    getFormatDisplay: () => getDateFormatDisplay(dateFormat),
  };
}
