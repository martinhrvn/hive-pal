import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { QueenRef } from 'shared-schemas';
import { StatusPill } from '@/components/common/status-pill';
import {
  QUEEN_STATUS_TONE,
  getQueenColorClass,
  getQueenDisplayName,
  queenStatusLabelKey,
} from '@/lib/queen-utils';
import { cn } from '@/lib/utils';

/** A mother/daughter row: colour dot, name and status, linking to the queen. */
export const QueenRefLink = ({ queen }: { queen: QueenRef }) => {
  const { t } = useTranslation('queen');
  return (
    <Link
      to={`/queens/${queen.id}`}
      className="flex items-center gap-3 rounded-md px-2 py-2 transition-[background-color,transform] hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
    >
      <span
        className={cn(
          'size-3 shrink-0 rounded-full border border-border',
          getQueenColorClass(queen.color),
        )}
      />
      <span className="min-w-0 flex-1 truncate font-medium">
        {getQueenDisplayName(t, queen)}
      </span>
      {queen.name && queen.year != null && (
        <span className="text-sm tabular-nums text-muted-foreground">
          {queen.year}
        </span>
      )}
      <StatusPill size="sm" tone={QUEEN_STATUS_TONE[queen.status]}>
        {t(queenStatusLabelKey(queen.status))}
      </StatusPill>
    </Link>
  );
};
