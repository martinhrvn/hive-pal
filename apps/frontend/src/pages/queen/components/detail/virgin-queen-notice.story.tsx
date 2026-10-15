import { subDays } from 'date-fns';
import type { QueenDetail } from 'shared-schemas';
import { VirginQueenNotice } from './virgin-queen-notice';

const daysAgo = (days?: number) =>
  days === undefined ? null : subDays(new Date(), days).toISOString();

/** A virgin queen whose dates are given in days before today. */
export const VirginQueen = ({
  virginDaysAgo,
  cappedDaysAgo,
  emergedDaysAgo,
}: {
  virginDaysAgo: number;
  cappedDaysAgo?: number;
  emergedDaysAgo?: number;
}) => {
  const queen = {
    id: '33333333-3333-4333-8333-333333333333',
    status: 'VIRGIN',
    statusChangedAt: daysAgo(virginDaysAgo),
    cellCappedAt: daysAgo(cappedDaysAgo),
    emergedAt: daysAgo(emergedDaysAgo),
  } as QueenDetail;
  return <VirginQueenNotice queen={queen} />;
};
