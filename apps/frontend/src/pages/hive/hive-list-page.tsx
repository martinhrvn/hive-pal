import { Link } from 'react-router';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';
import {
  MainContent,
  PageGrid,
  PageAside,
} from '@/components/layout/page-grid-layout';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { HiveStatus } from './components/hive-status';
import { HiveActionSidebar } from './components/hive-action-sidebar';
import { ChevronRight, Search } from 'lucide-react';
import { useHives } from '@/api/hooks';
import { HiveResponse, HiveStatus as HiveStatusEnum } from 'shared-schemas';
import { useDateFormat } from '@/hooks/use-date-format';
import { hiveStatusLabelKey } from '@/utils/status-colors';

const ALL = 'ALL';
const STATUSES = Object.values(HiveStatusEnum);

const matchesSearch = (hive: HiveResponse, term: string) => {
  const needle = term.toLowerCase();
  return (
    hive.name.toLowerCase().includes(needle) ||
    (hive.notes?.toLowerCase().includes(needle) ?? false)
  );
};

const emptyMessage = (
  t: TFunction,
  searchTerm: string,
  status: string | null,
) => {
  if (searchTerm && status) {
    return t('hive:list.noHivesMatchingBoth', { status, searchTerm });
  }
  if (searchTerm) return t('hive:list.noHivesMatchingSearch', { searchTerm });
  if (status) return t('hive:list.noHivesWithStatus', { status });
  return t('hive:list.noHives');
};

const HiveTableRow = ({
  hive,
  formatDate,
}: {
  hive: HiveResponse;
  formatDate: (date: string) => string;
}) => {
  const { t } = useTranslation('hive');
  return (
    // The name link stretches over the whole row, so any cell opens the hive
    <TableRow className="relative">
      <TableCell>
        <Link
          to={`/hives/${hive.id}`}
          className="font-medium after:absolute after:inset-0 after:rounded-sm focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
        >
          {hive.name}
        </Link>
      </TableCell>
      <TableCell>
        <HiveStatus status={hive.status} />
      </TableCell>
      <TableCell>
        {hive.installationDate
          ? formatDate(hive.installationDate)
          : t('fields.notSpecified')}
      </TableCell>
      <TableCell>
        {hive.lastInspectionDate
          ? formatDate(hive.lastInspectionDate)
          : t('fields.noInspectionYet')}
      </TableCell>
      <TableCell className="max-w-[200px] truncate">
        {hive.notes ?? t('fields.noNotes')}
      </TableCell>
      <TableCell className="text-right">
        <span
          aria-hidden="true"
          className="inline-flex items-center text-sm text-muted-foreground"
        >
          {t('actions.details')}
          <ChevronRight className="ml-1 size-4" />
        </span>
      </TableCell>
    </TableRow>
  );
};

const HiveTableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 6 }, (_, i) => (
      <Skeleton key={i} className="h-10 w-full rounded-md" />
    ))}
  </div>
);

export const HiveListPage = () => {
  const { t } = useTranslation(['hive', 'common']);
  const {
    data: hivesResponse,
    isLoading,
    refetch,
  } = useHives({ includeInactive: true });
  const { formatDate } = useDateFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  const handleRefreshData = useCallback(() => {
    refetch();
  }, [refetch]);

  const allHives = hivesResponse ?? [];
  const hives = allHives.filter(
    hive =>
      (searchTerm === '' || matchesSearch(hive, searchTerm)) &&
      (statusFilter === ALL || hive.status === statusFilter),
  );
  const statusLabel =
    statusFilter === ALL ? null : t(hiveStatusLabelKey(statusFilter));

  const renderContent = () => {
    if (isLoading) return <HiveTableSkeleton />;
    if (hives.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            {emptyMessage(t, searchTerm, statusLabel)}
          </p>
          {allHives.length === 0 ? (
            <Button asChild>
              <Link to="/hives/create">{t('hive:list.createFirst')}</Link>
            </Button>
          ) : (
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter(ALL);
              }}
            >
              {t('hive:list.clearFilters')}
            </Button>
          )}
        </div>
      );
    }
    return (
      <Table>
        <TableCaption>
          {statusLabel
            ? t('hive:list.captionFiltered', {
                count: hives.length,
                status: statusLabel,
              })
            : t('hive:list.caption')}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{t('hive:fields.name')}</TableHead>
            <TableHead>{t('hive:fields.status')}</TableHead>
            <TableHead>{t('hive:fields.installationDate')}</TableHead>
            <TableHead>{t('hive:fields.lastInspection')}</TableHead>
            <TableHead>{t('hive:fields.notes')}</TableHead>
            <TableHead className="text-right">
              {t('common:actions.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hives.map(hive => (
            <HiveTableRow key={hive.id} hive={hive} formatDate={formatDate} />
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <PageGrid>
      <MainContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={t('hive:list.searchPlaceholder')}
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('hive:list.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t('hive:list.allStatuses')}
                </SelectItem>
                {STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {t(hiveStatusLabelKey(status))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {renderContent()}
      </MainContent>
      <PageAside>
        <HiveActionSidebar onRefreshData={handleRefreshData} />
      </PageAside>
    </PageGrid>
  );
};
