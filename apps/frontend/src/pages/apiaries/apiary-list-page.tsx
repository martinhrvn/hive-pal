import { useApiariesControllerFindAll } from 'api-client';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
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

export const ApiaryListPage = () => {
  const { data, isLoading, refetch } = useApiariesControllerFindAll({
    query: { select: data => data.data },
  });
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleRefreshData = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const allApiaries = data || [];

  // Apply filters
  const apiaries = allApiaries.filter(apiary => {
    const matchesSearch =
      searchTerm === '' ||
      apiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apiary.location &&
        apiary.location.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  return (
    <Page>
      <MainContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search apiaries..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {apiaries.length > 0 ? (
          <Table>
            <TableCaption>A list of all your apiaries</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Hives Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiaries.map(apiary => (
                <TableRow key={apiary.id}>
                  <TableCell className="font-medium">{apiary.name}</TableCell>
                  <TableCell>{apiary.location || 'No location'}</TableCell>
                  <TableCell>
                    {apiary.latitude && apiary.longitude
                      ? `${apiary.latitude.toFixed(6)}, ${apiary.longitude.toFixed(6)}`
                      : 'No coordinates'}
                  </TableCell>
                  <TableCell>{apiary.hiveCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/apiaries/${apiary.id}`)}
                      className="flex items-center"
                    >
                      Details <ChevronRight className="ml-1 h-4 w-4" />
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
                ? `No apiaries found matching "${searchTerm}"`
                : 'No apiaries found'}
            </p>
            {searchTerm && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                }}
              >
                Clear filters
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