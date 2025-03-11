import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  InspectionResponseDto,
  useHiveControllerFindAll,
  useInspectionsControllerFindAll,
} from 'api-client';
import { isFuture, isPast, isToday, parseISO } from 'date-fns';
import {
  CalendarClockIcon,
  CalendarIcon,
  ChevronRight,
  ClipboardCheckIcon,
  HistoryIcon,
  Plus,
  SearchIcon,
} from 'lucide-react';

import { MainContent, Page, Sidebar } from '@/components/layout/sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Define tab enum for cleaner code
enum InspectionTab {
  ALL = 'all',
  RECENT = 'recent',
  UPCOMING = 'upcoming',
}

export const InspectionListPage = () => {
  // Get view type from URL param, defaults to 'all'
  const { view } = useParams<{ view: string }>();
  const activeTab = (view as InspectionTab) || InspectionTab.ALL;

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [selectedHiveId, setSelectedHiveId] = useState<string | undefined>(
    undefined,
  );

  // Fetch inspections and hives
  const { data: inspectionsData, isLoading: isLoadingInspections } =
    useInspectionsControllerFindAll(
      selectedHiveId && selectedHiveId !== 'all'
        ? { hiveId: selectedHiveId }
        : undefined,
    );

  const { data: hivesData, isLoading: isLoadingHives } =
    useHiveControllerFindAll();

  // Handle tab changes
  const handleTabChange = (value: string) => {
    navigate(
      `/inspections${value !== InspectionTab.ALL ? `/list/${value}` : ''}`,
    );
  };

  // Filter inspections based on tab and search term
  const filteredInspections = useMemo(() => {
    if (!inspectionsData?.data) return [];

    const allInspections = [...inspectionsData.data];

    // First apply search filter
    const searchFiltered = allInspections.filter(inspection => {
      return (
        searchTerm === '' ||
        (inspection.weatherConditions &&
          inspection.weatherConditions
            .toLowerCase()
            .includes(searchTerm?.toLowerCase() ?? ''))
      );
    });

    // Then apply tab filter
    switch (activeTab) {
      case InspectionTab.RECENT:
        return searchFiltered.filter(inspection => {
          const inspectionDate = parseISO(inspection.date);
          return isPast(inspectionDate) && !isToday(inspectionDate);
        });

      case InspectionTab.UPCOMING:
        return searchFiltered.filter(inspection => {
          const inspectionDate = parseISO(inspection.date);
          return isFuture(inspectionDate) || isToday(inspectionDate);
        });

      case InspectionTab.ALL:
      default:
        return searchFiltered;
    }
  }, [inspectionsData?.data, activeTab, searchTerm]);

  // Sort inspections by date (most recent first for past, soonest first for upcoming)
  const sortedInspections = useMemo(() => {
    return [...filteredInspections].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (activeTab === InspectionTab.UPCOMING) {
        return dateA.getTime() - dateB.getTime(); // Ascending (soonest first)
      } else {
        return dateB.getTime() - dateA.getTime(); // Descending (most recent first)
      }
    });
  }, [filteredInspections, activeTab]);

  // Handle create new inspection
  const handleCreateInspection = () => {
    navigate(
      selectedHiveId
        ? `/hives/${selectedHiveId}/inspections/create`
        : '/inspections/create',
    );
  };

  if (isLoadingInspections || isLoadingHives) {
    return <div>Loading...</div>;
  }

  return (
    <Page>
      <MainContent>
        {/* Tabs for filtering */}
        <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <TabsList className="mb-2 sm:mb-0">
              <TabsTrigger
                value={InspectionTab.ALL}
                className="flex items-center gap-1"
              >
                <ClipboardCheckIcon className="h-4 w-4" />
                <span>All</span>
              </TabsTrigger>
              <TabsTrigger
                value={InspectionTab.RECENT}
                className="flex items-center gap-1"
              >
                <HistoryIcon className="h-4 w-4" />
                <span>Recent</span>
              </TabsTrigger>
              <TabsTrigger
                value={InspectionTab.UPCOMING}
                className="flex items-center gap-1"
              >
                <CalendarClockIcon className="h-4 w-4" />
                <span>Upcoming</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inspections..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="w-full sm:w-64">
                <Select
                  value={selectedHiveId}
                  onValueChange={value => setSelectedHiveId(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by hive" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hives</SelectItem>
                    {hivesData?.data.map(hive => (
                      <SelectItem key={hive.id} value={hive.id}>
                        {hive.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <TabsContent value={InspectionTab.ALL}>
            {renderInspectionsTable(
              sortedInspections,
              'All Inspections',
              navigate,
              hivesData?.data,
            )}
          </TabsContent>

          <TabsContent value={InspectionTab.RECENT}>
            {renderInspectionsTable(
              sortedInspections,
              'Recent Inspections',
              navigate,
              hivesData?.data,
            )}
          </TabsContent>

          <TabsContent value={InspectionTab.UPCOMING}>
            {renderInspectionsTable(
              sortedInspections,
              'Upcoming Inspections',
              navigate,
              hivesData?.data,
            )}
          </TabsContent>
        </Tabs>
      </MainContent>

      <Sidebar>
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleCreateInspection}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Inspection
            </Button>
          </CardContent>
        </Card>
      </Sidebar>
    </Page>
  );
};

const renderInspectionsTable = (
  inspections: InspectionResponseDto[],
  caption: string,
  navigate: (path: string) => void,
  hives: any[] = [],
) => {
  const getHiveName = (hiveId: string) => {
    const hive = hives.find(h => h.id === hiveId);
    return hive ? hive.name : 'Unknown Hive';
  };

  return inspections.length > 0 ? (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Date & Time</TableHead>
          <TableHead>Hive</TableHead>
          <TableHead>Weather</TableHead>
          <TableHead>Overall Score</TableHead>
          <TableHead>Queen Seen</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inspections.map(inspection => (
          <TableRow key={inspection.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {new Date(inspection.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
                <br />
                <span className="text-xs text-muted-foreground">
                  {new Date(inspection.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </TableCell>
            <TableCell>{getHiveName(inspection.hiveId)}</TableCell>
            <TableCell>
              {inspection.temperature && `${inspection.temperature}° `}
              {inspection.weatherConditions || 'Not recorded'}
            </TableCell>
            <TableCell>
              <span
                className={getMetricColorClass(
                  inspection.observations?.strength,
                )}
              >
                {inspection.observations?.strength ?? 'N/A'}
              </span>
            </TableCell>
            <TableCell>
              <span
                className={getMetricColorClass(
                  inspection.observations?.honeyStores,
                )}
              >
                {inspection.observations?.honeyStores ?? 'N/A'}
              </span>
            </TableCell>
            <TableCell>
              {inspection.observations?.queenSeen === null ? (
                'Not recorded'
              ) : (
                <span
                  className={
                    inspection.observations.queenSeen
                      ? 'text-green-600'
                      : 'text-amber-500'
                  }
                >
                  {inspection.observations.queenSeen ? 'Yes' : 'No'}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/inspections/${inspection.id}`)}
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
      <p className="text-muted-foreground mb-4">No inspections found</p>
    </div>
  );
};

// Helper function to get color class based on metric value
const getMetricColorClass = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '';
  if (value >= 7) return 'text-green-600';
  if (value >= 4) return 'text-amber-500';
  return 'text-red-500';
};
