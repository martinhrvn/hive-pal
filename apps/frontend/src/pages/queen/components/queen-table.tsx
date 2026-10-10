import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { QUEEN_STATUS_VARIANTS, getQueenDisplayName } from '@/lib/queen-utils';
import { QueenColorBadge } from './queen-color-badge';
import { QueenResponse } from 'shared-schemas';

type QueenTableProps = {
  queens: QueenResponse[];
  showHive?: boolean;
  showReplaced?: boolean;
};

const QueenTableRow: React.FC<{
  queen: QueenResponse;
  showHive?: boolean;
  showReplaced?: boolean;
}> = ({ queen, showHive, showReplaced }) => (
  <TableRow>
    <TableCell>
      <Link to={`/queens/${queen.id}`} className="font-medium hover:underline">
        {getQueenDisplayName(queen.name, queen.marking, queen.year)}
      </Link>
    </TableCell>
    <TableCell>
      <QueenColorBadge color={queen.color} />
    </TableCell>
    <TableCell>{queen.year ?? '—'}</TableCell>
    {showHive && (
      <TableCell>
        {queen.hiveName ? (
          <span className="text-sm">{queen.hiveName}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">No hive</span>
        )}
      </TableCell>
    )}
    <TableCell>
      <Badge
        variant={QUEEN_STATUS_VARIANTS[queen.status ?? 'UNKNOWN'] ?? 'outline'}
      >
        {queen.status}
      </Badge>
    </TableCell>
    <TableCell className="text-sm">
      {queen.installedAt ? format(parseISO(queen.installedAt), 'PP') : '—'}
    </TableCell>
    {showReplaced && (
      <TableCell className="text-sm">
        {queen.replacedAt ? format(parseISO(queen.replacedAt), 'PP') : '—'}
      </TableCell>
    )}
  </TableRow>
);

export const QueenTable: React.FC<QueenTableProps> = ({
  queens,
  showHive = false,
  showReplaced = false,
}) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Queen</TableHead>
          <TableHead>Color</TableHead>
          <TableHead>Year</TableHead>
          {showHive && <TableHead>Hive</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Installed</TableHead>
          {showReplaced && <TableHead>Replaced</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {queens.map(queen => (
          <QueenTableRow
            key={queen.id}
            queen={queen}
            showHive={showHive}
            showReplaced={showReplaced}
          />
        ))}
      </TableBody>
    </Table>
  </div>
);
