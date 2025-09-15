import { useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiaryActionSidebar } from './components';
import { ChevronRight, Search } from 'lucide-react';
import { useApiaries } from '@/api/hooks';

export const ApiaryListPage = () => {
  const { t } = useTranslation(['apiary', 'common']);
  const { data, isLoading, refetch } = useApiaries();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleRefreshData = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <div>{t('common:status.loading')}</div>;
  }

  const allApiaries = data || [];

  // Apply filters
  const apiaries = allApiaries.filter(apiary => {
    return (
      searchTerm === '' ||
      apiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apiary.location &&
        apiary.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <Page>
      <MainContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('apiary:list.searchPlaceholder')}
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {apiaries.length > 0 ? (
          <Table>
            <TableCaption>{t('apiary:list.caption')}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{t('apiary:fields.name')}</TableHead>
                <TableHead>{t('apiary:fields.location')}</TableHead>
                <TableHead>{t('apiary:fields.coordinates')}</TableHead>
                <TableHead>{t('apiary:fields.hivesCount')}</TableHead>
                <TableHead className="text-right">
                  {t('common:actions.actions', { defaultValue: 'Actions' })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiaries.map(apiary => (
                <TableRow key={apiary.id}>
                  <TableCell className="font-medium">{apiary.name}</TableCell>
                  <TableCell>
                    {apiary.location || t('apiary:fields.noLocation')}
                  </TableCell>
                  <TableCell>
                    {apiary.latitude && apiary.longitude
                      ? `${apiary.latitude.toFixed(6)}, ${apiary.longitude.toFixed(6)}`
                      : t('apiary:fields.noCoordinates')}
                  </TableCell>
                  <TableCell>{0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/apiaries/${apiary.id}`)}
                      className="flex items-center"
                    >
                      {t('apiary:actions.details')}{' '}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? t('apiary:list.noApiariesMatching', { searchTerm })
                : t('apiary:list.noApiaries')}
            </p>
            {searchTerm && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                }}
              >
                {t('apiary:list.clearFilters')}
              </Button>
            )}
          </div>
        )}
      </MainContent>
      <Sidebar>
        <ApiaryActionSidebar onRefreshData={handleRefreshData} />
      </Sidebar>
    </Page>
  );
};
