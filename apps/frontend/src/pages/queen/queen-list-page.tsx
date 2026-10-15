import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Plus, Search } from 'lucide-react';
import type { QueenResponse } from 'shared-schemas';
import { useHives, useQueens } from '@/api/hooks';
import { EmptyState } from '@/components/dashboard/empty-state';
import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  MenuItemLink,
} from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiaryPermission } from '@/hooks/useApiaryPermission';
import {
  QUEEN_STATUSES,
  getQueenDisplayName,
  queenStatusLabelKey,
} from '@/lib/queen-utils';
import { QueenTable } from './components/queen-table';

const ALL = 'all';

const QueenListSkeleton = () => (
  <div className="divide-y">
    {[0, 1, 2, 3, 4].map(i => (
      <div key={i} className="flex items-center gap-6 py-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto h-5 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

const QueenListContent = ({
  queens,
  isPending,
  isFiltered,
  onClearFilters,
}: {
  queens: QueenResponse[];
  isPending: boolean;
  isFiltered: boolean;
  onClearFilters: () => void;
}) => {
  const { t } = useTranslation('queen');

  if (isPending) return <QueenListSkeleton />;

  if (queens.length === 0) {
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

const QueenListSidebar = () => {
  const { t } = useTranslation(['queen', 'common']);
  const { canEdit } = useApiaryPermission();
  if (!canEdit) return null;

  return (
    <ActionSidebarContainer>
      <ActionSidebarGroup title={t('common:actions.actions')}>
        <MenuItemLink
          to="/queens/create"
          icon={<Plus />}
          label={t('actions.addQueen')}
        />
      </ActionSidebarGroup>
    </ActionSidebarContainer>
  );
};

export const QueenListPage = () => {
  const { t } = useTranslation('queen');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [hiveFilter, setHiveFilter] = useState<string>(ALL);

  const { data: hives } = useHives();
  const { data: queens = [], isPending } = useQueens({
    status: statusFilter === ALL ? undefined : statusFilter,
    hiveId: hiveFilter === ALL ? undefined : hiveFilter,
  });

  const term = search.trim().toLowerCase();
  const visibleQueens = term
    ? queens.filter(queen =>
        [getQueenDisplayName(t, queen), queen.hiveName, queen.breeder].some(
          text => text?.toLowerCase().includes(term),
        ),
      )
    : queens;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter(ALL);
    setHiveFilter(ALL);
  };

  return (
    <PageGrid>
      <MainContent>
        <h1 className="mb-4 text-2xl font-semibold">{t('title')}</h1>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('list.searchPlaceholder')}
              aria-label={t('list.searchPlaceholder')}
              className="pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-full sm:w-40"
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
            <SelectTrigger
              className="w-full sm:w-48"
              aria-label={t('list.hiveFilter')}
            >
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

        <QueenListContent
          queens={visibleQueens}
          isPending={isPending}
          isFiltered={term !== '' || statusFilter !== ALL || hiveFilter !== ALL}
          onClearFilters={clearFilters}
        />
      </MainContent>
      <PageAside>
        <QueenListSidebar />
      </PageAside>
    </PageGrid>
  );
};
