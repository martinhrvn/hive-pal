import { useTranslation } from 'react-i18next';

export function AiBadge() {
  const { t } = useTranslation('ai');

  return (
    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
      {t('badge.label')}
    </span>
  );
}
