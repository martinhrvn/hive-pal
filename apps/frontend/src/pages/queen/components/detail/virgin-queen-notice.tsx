import { useTranslation } from 'react-i18next';
import { addDays, differenceInCalendarDays } from 'date-fns';
import { Egg, Hourglass } from 'lucide-react';
import {
  VIRGIN_QUEEN_CHECK_DAYS,
  virginQueenSince,
  type QueenDetail,
} from 'shared-schemas';
import { useDateFormat } from '@/hooks/use-date-format';
import { cn } from '@/lib/utils';

/**
 * Where a virgin queen is in her timeline: still in the cell, waiting to
 * mate, or due a check for eggs.
 */
export const VirginQueenNotice = ({
  queen,
  className,
}: {
  queen: QueenDetail;
  className?: string;
}) => {
  const { t } = useTranslation('queen');
  const { formatDate } = useDateFormat();
  if (queen.status !== 'VIRGIN' || !queen.statusChangedAt) return null;

  const since = virginQueenSince({
    emergedAt: queen.emergedAt,
    cellCappedAt: queen.cellCappedAt,
    statusChangedAt: queen.statusChangedAt,
  });
  const days = differenceInCalendarDays(new Date(), since);
  const layingFrom = formatDate(addDays(since, VIRGIN_QUEEN_CHECK_DAYS));
  const checkDue = days >= VIRGIN_QUEEN_CHECK_DAYS;
  const Icon = checkDue ? Egg : Hourglass;

  let status: string;
  let hint: string;
  if (days < 0) {
    // The capped cell hasn't hatched yet
    status = t('virgin.emergesIn', { count: -days, date: formatDate(since) });
    hint = t('virgin.expectLayingFrom', { date: layingFrom });
  } else {
    status = t('virgin.days', { count: days });
    hint = checkDue
      ? t('virgin.checkForEggs')
      : t('virgin.expectLayingFrom', { date: layingFrom });
  }

  return (
    <p
      className={cn(
        'flex gap-2 rounded-md p-3 text-sm',
        className,
        checkDue
          ? 'bg-warning-muted text-warning-foreground'
          : 'bg-info-muted text-info-foreground',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="font-medium">{status}</span> {hint}
      </span>
    </p>
  );
};
