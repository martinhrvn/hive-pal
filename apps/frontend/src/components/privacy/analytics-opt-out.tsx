import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import {
  isAnalyticsEnabled,
  setAnalyticsEnabled,
} from '@/lib/analytics-opt-out';

/**
 * The visitor-facing analytics opt-out on the privacy policy page. Starts
 * enabled so the prerendered markup matches the first client render, then
 * adopts the stored preference.
 */
export function AnalyticsOptOut() {
  const { t } = useTranslation('privacy');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isAnalyticsEnabled());
  }, []);

  const toggle = (next: boolean) => {
    setAnalyticsEnabled(next);
    setEnabled(next);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="font-medium text-gray-900">
            {t('analyticsChoice.title')}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {t('analyticsChoice.content')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className="text-sm text-gray-600"
            aria-live="polite"
            aria-atomic="true"
          >
            {enabled ? t('analyticsChoice.on') : t('analyticsChoice.off')}
          </span>
          <Switch
            checked={enabled}
            onCheckedChange={toggle}
            aria-label={t('analyticsChoice.toggleLabel')}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">{t('analyticsChoice.note')}</p>
    </div>
  );
}
