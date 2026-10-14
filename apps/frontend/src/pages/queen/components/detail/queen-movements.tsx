import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, ArrowRight } from 'lucide-react';
import type { QueenMovement } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDateFormat } from '@/hooks/use-date-format';

const Placeholder = ({ children }: { children: string }) => (
  <span className="italic text-muted-foreground">{children}</span>
);

export const QueenMovements = ({
  movements,
  onTransfer,
}: {
  movements: QueenMovement[];
  /** Omitted for viewers. */
  onTransfer?: () => void;
}) => {
  const { t } = useTranslation('queen');
  const { formatDate } = useDateFormat();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sections.movements')}</CardTitle>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="space-y-1">
              <p className="font-medium">{t('detail.noMovements.title')}</p>
              <p className="text-sm text-muted-foreground">
                {t('detail.noMovements.description')}
              </p>
            </div>
            {onTransfer && (
              <Button variant="outline" size="sm" onClick={onTransfer}>
                <ArrowLeftRight className="size-4" />
                {t('actions.transferQueen')}
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('detail.movement.date')}</TableHead>
                <TableHead>{t('detail.movement.from')}</TableHead>
                <TableHead>
                  <span className="sr-only">
                    {t('detail.movement.direction')}
                  </span>
                </TableHead>
                <TableHead>{t('detail.movement.to')}</TableHead>
                <TableHead>{t('detail.movement.reason')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map(movement => (
                <TableRow key={movement.id}>
                  <TableCell>{formatDate(movement.movedAt)}</TableCell>
                  <TableCell>
                    {movement.fromHiveName ?? (
                      <Placeholder>{t('detail.movement.none')}</Placeholder>
                    )}
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    {movement.toHiveName ?? (
                      <Placeholder>{t('detail.movement.removed')}</Placeholder>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {movement.reason ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
