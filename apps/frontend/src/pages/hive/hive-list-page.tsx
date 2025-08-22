import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
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
import { HiveStatus, HiveActionSidebar } from './components';
import { ChevronRight, Search } from 'lucide-react';
import { useHives } from '@/api/hooks';
import { HiveResponse, HiveStatus as HiveStatusEnum } from 'shared-schemas';

export const HiveListPage = () => {
  const { t } = useTranslation(['hive', 'common']);
  const { data: hivesResponse, isLoading, refetch } = useHives();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleRefreshData = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <div>{t('common:status.loading')}</div>;
  }

  const allHives = hivesResponse ?? [];

  // Apply filters
  const hives: HiveResponse[] = allHives.filter(hive => {
    const matchesSearch =
      searchTerm === '' ||
      hive.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hive.notes &&
        hive.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || hive.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Page>
      <MainContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('hive:list.searchPlaceholder')}
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-40">
            <Select
              value={statusFilter}
              onValueChange={value => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('hive:list.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('hive:list.allStatuses')}</SelectItem>
                <SelectItem value={HiveStatusEnum.ACTIVE}>{t('hive:status.active')}</SelectItem>
                <SelectItem value={HiveStatusEnum.INACTIVE}>
                  {t('hive:status.inactive')}
                </SelectItem>
                <SelectItem value={HiveStatusEnum.DEAD}>{t('hive:status.dead')}</SelectItem>
                <SelectItem value={HiveStatusEnum.SOLD}>{t('hive:status.sold')}</SelectItem>
                <SelectItem value={HiveStatusEnum.UNKNOWN}>{t('hive:status.unknown')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hives.length > 0 ? (
          <Table>
            <TableCaption>
              {statusFilter === 'ALL'
                ? t('hive:list.caption')
                : t(hives.length === 1 ? 'hive:list.captionFiltered' : 'hive:list.captionFilteredPlural', { 
                    count: hives.length, 
                    status: statusFilter.toLowerCase() 
                  })}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{t('hive:fields.name')}</TableHead>
                <TableHead>{t('hive:fields.status')}</TableHead>
                <TableHead>{t('hive:fields.installationDate')}</TableHead>
                <TableHead>{t('hive:fields.lastInspection')}</TableHead>
                <TableHead>{t('hive:fields.notes')}</TableHead>
                <TableHead className="text-right">{t('common:actions.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hives.map(hive => (
                <TableRow key={hive.id}>
                  <TableCell className="font-medium">{hive.name}</TableCell>
                  <TableCell>
                    <HiveStatus status={hive.status} />
                  </TableCell>
                  <TableCell>
                    {hive.installationDate ?? t('hive:fields.notSpecified')}
                  </TableCell>
                  <TableCell>
                    {hive.lastInspectionDate ?? t('hive:fields.noInspectionYet')}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {hive.notes ?? t('hive:fields.noNotes')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/hives/${hive.id}`)}
                      className="flex items-center"
                    >
                      {t('hive:actions.details')} <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchTerm && statusFilter !== 'ALL'
                ? t('hive:list.noHivesMatchingBoth', { status: statusFilter.toLowerCase(), searchTerm })
                : searchTerm
                  ? t('hive:list.noHivesMatchingSearch', { searchTerm })
                  : statusFilter !== 'ALL'
                    ? t('hive:list.noHivesWithStatus', { status: statusFilter.toLowerCase() })
                    : t('hive:list.noHives')}
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
            >
              {t('hive:list.clearFilters')}
            </Button>
          </div>
        )}
      </MainContent>
      <Sidebar>
        <HiveActionSidebar onRefreshData={handleRefreshData} />
      </Sidebar>
    </Page>
  );
};
