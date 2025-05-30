import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
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
  const { data: hivesResponse, isLoading, refetch } = useHives();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleRefreshData = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return <div>Loading...</div>;
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
              placeholder="Search hives..."
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value={HiveStatusEnum.ACTIVE}>Active</SelectItem>
                <SelectItem value={HiveStatusEnum.INACTIVE}>
                  Inactive
                </SelectItem>
                <SelectItem value={HiveStatusEnum.DEAD}>Dead</SelectItem>
                <SelectItem value={HiveStatusEnum.SOLD}>Sold</SelectItem>
                <SelectItem value={HiveStatusEnum.UNKNOWN}>Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hives.length > 0 ? (
          <Table>
            <TableCaption>
              {statusFilter === 'ALL'
                ? 'A list of all your hives'
                : `Showing ${hives.length} ${statusFilter.toLowerCase()} hive${hives.length !== 1 ? 's' : ''}`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Installation Date</TableHead>
                <TableHead>Last Inspection</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    {hive.installationDate ?? 'Not specified'}
                  </TableCell>
                  <TableCell>
                    {hive.lastInspectionDate ?? 'No inspection yet'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {hive.notes ?? 'No notes'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/hives/${hive.id}`)}
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
              {searchTerm && statusFilter !== 'ALL'
                ? `No ${statusFilter.toLowerCase()} hives found matching "${searchTerm}"`
                : searchTerm
                  ? `No hives found matching "${searchTerm}"`
                  : statusFilter !== 'ALL'
                    ? `No ${statusFilter.toLowerCase()} hives found`
                    : 'No hives found'}
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
            >
              Clear filters
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
