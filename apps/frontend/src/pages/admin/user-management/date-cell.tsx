import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/use-date-format';

/** A date in the viewer's preferred format, or a fallback when missing. */
export function DateCell({
  value,
  withTime = false,
  fallback,
}: Readonly<{
  value: Date | string | null | undefined;
  withTime?: boolean;
  fallback?: string;
}>) {
  const { t } = useTranslation('admin');
  const { formatDate, formatDateTime } = useDateFormat();
  if (!value) return <>{fallback ?? t('status.dash')}</>;
  return <>{withTime ? formatDateTime(value) : formatDate(value)}</>;
}
