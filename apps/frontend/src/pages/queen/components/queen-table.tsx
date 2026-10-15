import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import type { QueenResponse } from 'shared-schemas';
import { StatusPill } from '@/components/common/status-pill';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDateFormat } from '@/hooks/use-date-format';
import {
  QUEEN_STATUS_TONE,
  getQueenDisplayName,
  queenStatusLabelKey,
} from '@/lib/queen-utils';
import { QueenColorBadge } from './queen-color-badge';

type QueenTableProps = {
  queens: QueenResponse[];
  /** Column toggles: the list page shows the hive, a hive's history the replacement date. */
  showHive?: boolean;
  showReplaced?: boolean;
};

type QueenTableRowProps = {
  queen: QueenResponse;
  showHive?: boolean;
  showReplaced?: boolean;
  formatDate: (date: string) => string;
};

const QueenTableRow = ({
  queen,
  showHive,
  showReplaced,
  formatDate,
}: QueenTableRowProps) => {
  const { t } = useTranslation('queen');
  return (
    // The name link stretches over the whole row, so any cell opens the queen
    <TableRow className="relative">
      <TableCell>
        <Link
          to={`/queens/${queen.id}`}
          className="font-medium after:absolute after:inset-0 after:rounded-sm focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
        >
          {getQueenDisplayName(t, queen)}
        </Link>
      </TableCell>
      <TableCell>
        <QueenColorBadge color={queen.color} />
      </TableCell>
      <TableCell className="tabular-nums">{queen.year ?? '—'}</TableCell>
      {showHive && (
        <TableCell>
          {queen.hiveName ?? (
            <span className="italic text-muted-foreground">
              {t('table.noHive')}
            </span>
          )}
        </TableCell>
      )}
      <TableCell>
        {queen.status && (
          <StatusPill size="sm" tone={QUEEN_STATUS_TONE[queen.status]}>
            {t(queenStatusLabelKey(queen.status))}
          </StatusPill>
        )}
      </TableCell>
      <TableCell>
        {queen.installedAt ? formatDate(queen.installedAt) : '—'}
      </TableCell>
      {showReplaced && (
        <TableCell>
          {queen.replacedAt ? formatDate(queen.replacedAt) : '—'}
        </TableCell>
      )}
      <TableCell className="text-right">
        <span
          aria-hidden
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          {t('table.details')}
          <ChevronRight className="size-4" />
        </span>
      </TableCell>
    </TableRow>
  );
};

export const QueenTable: React.FC<QueenTableProps> = ({
  queens,
  showHive = false,
  showReplaced = false,
}) => {
  const { t } = useTranslation('queen');
  const { formatDate } = useDateFormat();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.queen')}</TableHead>
          <TableHead>{t('table.color')}</TableHead>
          <TableHead>{t('table.year')}</TableHead>
          {showHive && <TableHead>{t('table.hive')}</TableHead>}
          <TableHead>{t('table.status')}</TableHead>
          <TableHead>{t('table.installed')}</TableHead>
          {showReplaced && <TableHead>{t('table.replaced')}</TableHead>}
          <TableHead>
            <span className="sr-only">{t('table.details')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {queens.map(queen => (
          <QueenTableRow
            key={queen.id}
            queen={queen}
            showHive={showHive}
            showReplaced={showReplaced}
            formatDate={formatDate}
          />
        ))}
      </TableBody>
    </Table>
  );
};
