import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { QueenDetail } from 'shared-schemas';
import { useDateFormat } from '@/hooks/use-date-format';
import { QueenColorBadge } from '../queen-color-badge';

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-1">
    <dt className="font-overline text-muted-foreground">{label}</dt>
    <dd className="text-sm font-medium">{children}</dd>
  </div>
);

/** Everything known about the queen; empty values are left out. */
export const QueenFacts = ({ queen }: { queen: QueenDetail }) => {
  const { t } = useTranslation('queen');
  const { formatDate } = useDateFormat();

  const facts: { key: string; label: string; value: ReactNode }[] = [
    { key: 'year', label: t('fields.year'), value: queen.year },
    {
      key: 'color',
      label: t('fields.color'),
      value: queen.color && <QueenColorBadge color={queen.color} />,
    },
    { key: 'marking', label: t('fields.marking'), value: queen.marking },
    { key: 'source', label: t('fields.source'), value: queen.source },
    { key: 'breeder', label: t('fields.breeder'), value: queen.breeder },
    { key: 'line', label: t('fields.line'), value: queen.line },
    {
      key: 'matingType',
      label: t('fields.matingType'),
      value: queen.matingType && t(`matingType.${queen.matingType}`),
    },
    {
      key: 'matingStation',
      label: t('fields.matingStation'),
      value: queen.matingStation,
    },
    {
      key: 'matedAt',
      label: t('fields.matedAt'),
      value: queen.matedAt && formatDate(queen.matedAt),
    },
    {
      key: 'installedAt',
      label: t('fields.installed'),
      value: queen.installedAt && formatDate(queen.installedAt),
    },
    {
      key: 'replacedAt',
      label: t('fields.replaced'),
      value: queen.replacedAt && formatDate(queen.replacedAt),
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
      {facts
        .filter(fact => fact.value != null && fact.value !== '')
        .map(fact => (
          <Fact key={fact.key} label={fact.label}>
            {fact.value}
          </Fact>
        ))}
    </dl>
  );
};
