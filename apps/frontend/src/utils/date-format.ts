import { format, parseISO } from 'date-fns';

export type DateFormatPreference = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

const FORMAT_MAP: Record<DateFormatPreference, string> = {
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
};

/**
 * Format a date according to user preference
 * @param date - Date object, Date string, or ISO string
 * @param preference - User's preferred date format
 * @returns Formatted date string
 */
export function formatDateWithPreference(
  date: Date | string,
  preference: DateFormatPreference = 'MM/DD/YYYY',
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const formatString = FORMAT_MAP[preference];
    return format(dateObj, formatString);
  } catch (error) {
    console.warn('Failed to format date:', error);
    return typeof date === 'string' ? date : date.toISOString().split('T')[0];
  }
}

/**
 * Format a date for display with time according to user preference
 * @param date - Date object, Date string, or ISO string
 * @param preference - User's preferred date format
 * @returns Formatted date and time string
 */
export function formatDateTimeWithPreference(
  date: Date | string,
  preference: DateFormatPreference = 'MM/DD/YYYY',
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const dateFormatString = FORMAT_MAP[preference];
    const fullFormatString = `${dateFormatString} HH:mm`;
    return format(dateObj, fullFormatString);
  } catch (error) {
    console.warn('Failed to format date with time:', error);
    return typeof date === 'string' ? date : date.toISOString();
  }
}

/**
 * Format a date for input fields (always returns YYYY-MM-DD for HTML date inputs)
 * @param date - Date object, Date string, or ISO string
 * @returns Date string in YYYY-MM-DD format for HTML date inputs
 */
export function formatDateForInput(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('Failed to format date for input:', error);
    return '';
  }
}

/**
 * Get the display format string for the given preference (for showing to users)
 * @param preference - User's preferred date format
 * @returns Human-readable format string
 */
export function getDateFormatDisplay(preference: DateFormatPreference): string {
  return preference;
}

/**
 * Parse user input date according to their preference
 * @param dateString - Date string in user's preferred format
 * @param preference - User's preferred date format
 * @returns Date object or null if parsing fails
 */
export function parseDateWithPreference(
  dateString: string,
  preference: DateFormatPreference = 'MM/DD/YYYY',
): Date | null {
  if (!dateString.trim()) return null;

  try {
    // For HTML date inputs, always expect YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return parseISO(dateString);
    }

    // Parse according to user preference
    const parts = dateString.split(/[-/]/);
    if (parts.length !== 3) return null;

    let year: number, month: number, day: number;

    switch (preference) {
      case 'MM/DD/YYYY':
        [month, day, year] = parts.map(Number);
        break;
      case 'DD/MM/YYYY':
        [day, month, year] = parts.map(Number);
        break;
      case 'YYYY-MM-DD':
        [year, month, day] = parts.map(Number);
        break;
      default:
        return null;
    }

    // Validate the date parts
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (year < 1900 || year > 2100) return null;

    return new Date(year, month - 1, day);
  } catch (error) {
    console.warn('Failed to parse date:', error);
    return null;
  }
}
