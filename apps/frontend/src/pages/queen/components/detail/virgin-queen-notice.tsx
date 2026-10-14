import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Egg, Hourglass } from 'lucide-react';
import { VIRGIN_QUEEN_CHECK_DAYS, type QueenDetail } from 'shared-schemas';
import { cn } from '@/lib/utils';

/** How long the queen has been a virgin, and when to look for eggs. */
export const VirginQueenNotice = ({ queen }: { queen: QueenDetail }) => {
  const { t } = useTranslation('queen');
  if (queen.status !== 'VIRGIN' || !queen.statusChangedAt) return null;

  const days = Math.max(
    0,
    differenceInCalendarDays(new Date(), parseISO(queen.statusChangedAt)),
  );
  const checkDue = days >= VIRGIN_QUEEN_CHECK_DAYS;
  const Icon = checkDue ? Egg : Hourglass;

  return (
    <p
      className={cn(
        'flex gap-2 rounded-md p-3 text-sm',
        checkDue
          ? 'bg-warning-muted text-warning-foreground'
          : 'bg-info-muted text-info-foreground',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="font-medium">{t('virgin.days', { count: days })}</span>{' '}
        {checkDue
          ? t('virgin.checkForEggs')
          : t('virgin.expectLaying', { days: VIRGIN_QUEEN_CHECK_DAYS })}
      </span>
    </p>
  );
};
