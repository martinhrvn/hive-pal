import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ArrowRight,
  Crown,
  History,
  Pencil,
  ArrowLeftRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQueenHistory } from '@/api/hooks';
import { QueenTransferDialog } from './components/queen-transfer-dialog';
import { QueenResponse } from 'shared-schemas';
import {
  QUEEN_STATUS_VARIANTS,
  getQueenColorClass,
  getQueenDisplayName,
} from '@/lib/queen-utils';

export const QueenDetailPage = () => {
  const { queenId } = useParams<{ queenId: string }>();
  const navigate = useNavigate();
  const [transferOpen, setTransferOpen] = useState(false);

  const { data: queen, isLoading, error } = useQueenHistory(queenId ?? '');

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !queen) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Queen not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-2">
          <ChevronLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const colorClass = getQueenColorClass(queen.color, 'bg-white');

  return (
    <div className="container mx-auto max-w-3xl p-4 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ChevronLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-full border border-gray-400 ${colorClass}`}
              />
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  {getQueenDisplayName(queen.name, queen.marking, queen.year)}
                </CardTitle>
                {queen.hiveName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Currently in:{' '}
                    <span className="font-medium">{queen.hiveName}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  QUEEN_STATUS_VARIANTS[queen.status ?? 'UNKNOWN'] ?? 'outline'
                }
              >
                {queen.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {queen.year && (
              <div>
                <p className="text-muted-foreground">Year</p>
                <p className="font-medium">{queen.year}</p>
              </div>
            )}
            {queen.marking && (
              <div>
                <p className="text-muted-foreground">Marking</p>
                <p className="font-medium">{queen.marking}</p>
              </div>
            )}
            {queen.source && (
              <div>
                <p className="text-muted-foreground">Source</p>
                <p className="font-medium">{queen.source}</p>
              </div>
            )}
            {queen.installedAt && (
              <div>
                <p className="text-muted-foreground">Installed</p>
                <p className="font-medium">
                  {format(parseISO(queen.installedAt), 'PP')}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferOpen(true)}
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer Queen
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/queens/${queenId}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Movement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queen.movements.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No movement history recorded.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead></TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queen.movements.map(movement => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-sm">
                      {format(parseISO(movement.movedAt), 'PP')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {movement.fromHiveName ?? (
                        <span className="text-muted-foreground italic">
                          None
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="text-sm">
                      {movement.toHiveName ?? (
                        <span className="text-muted-foreground italic">
                          Removed
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.reason ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {queen && (
        <QueenTransferDialog
          queen={queen as QueenResponse}
          open={transferOpen}
          onOpenChange={setTransferOpen}
        />
      )}
    </div>
  );
};
