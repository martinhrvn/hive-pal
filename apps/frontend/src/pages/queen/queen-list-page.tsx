import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Plus } from 'lucide-react';
import type { QueenResponse } from 'shared-schemas';
import { useHives, useQueens } from '@/api/hooks';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { QUEEN_STATUSES, queenStatusLabelKey } from '@/lib/queen-utils';
import { QueenTable } from './components/queen-table';

const ALL = 'all';

const QueenListContent = ({
  queens,
  isPending,
  isFiltered,
  onClearFilters,
}: {
  queens?: QueenResponse[];
  isPending: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}) => {
  const { t } = useTranslation('queen');

  if (isPending) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!queens?.length) {
    return isFiltered ? (
      <EmptyState
        icon={<Crown />}
        title={t('list.noMatches.title')}
        description={t('list.noMatches.description')}
      >
        <Button variant="outline" onClick={onClearFilters}>
          {t('list.noMatches.cta')}
        </Button>
      </EmptyState>
    ) : (
      <EmptyState
        icon={<Crown />}
        title={t('list.empty.title')}
        description={t('list.empty.description')}
      >
        <Button asChild>
          <Link to="/queens/create">{t('list.empty.cta')}</Link>
        </Button>
      </EmptyState>
    );
  }

  return <QueenTable queens={queens} showHive />;
};

export const QueenListPage = () => {
  const { t } = useTranslation('queen');
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [hiveFilter, setHiveFilter] = useState<string>(ALL);

  const { data: hives } = useHives();
  const { data: queens, isPending } = useQueens({
    status: statusFilter === ALL ? undefined : statusFilter,
    hiveId: hiveFilter === ALL ? undefined : hiveFilter,
  });

  const clearFilters = () => {
    setStatusFilter(ALL);
    setHiveFilter(ALL);
  };

  return (
    <div className="container mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Crown className="size-6 text-honey" />
          {t('title')}
        </h1>
        <Button asChild size="sm">
          <Link to="/queens/create">
            <Plus className="size-4" />
            {t('actions.addQueen')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-overline text-muted-foreground">
            {t('list.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-40"
                aria-label={t('list.statusFilter')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('list.allStatuses')}</SelectItem>
                {QUEEN_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {t(queenStatusLabelKey(status))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={hiveFilter} onValueChange={setHiveFilter}>
              <SelectTrigger className="w-48" aria-label={t('list.hiveFilter')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('list.allHives')}</SelectItem>
                {hives?.map(hive => (
                  <SelectItem key={hive.id} value={hive.id}>
                    {hive.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <QueenListContent
        queens={queens}
        isPending={isPending}
        isFiltered={statusFilter !== ALL || hiveFilter !== ALL}
        onClearFilters={clearFilters}
      />
    </div>
  );
};
