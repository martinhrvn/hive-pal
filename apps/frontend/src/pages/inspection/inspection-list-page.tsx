import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiary } from '@/hooks/use-apiary';
import { useTranslation } from 'react-i18next';
import { useHives, useInspections } from '@/api/hooks';
import {
  HiveResponse,
  InspectionResponse,
  InspectionStatus,
} from 'shared-schemas';
import { InspectionActionSidebar } from './components';
import { ScheduledInspectionCard } from './components/scheduled-inspection-card';
import { isFuture, isPast, isToday, parseISO } from 'date-fns';
import {
  ActivityIcon,
  CalendarClockIcon,
  CalendarIcon,
  ChevronRight,
  ClipboardCheckIcon,
  CloudIcon,
  CloudRainIcon,
  CrownIcon,
  HistoryIcon,
  InfoIcon,
  SearchIcon,
  SunIcon,
  ThermometerIcon,
} from 'lucide-react';
import { TrendIndicator } from '@/components/common/trend-indicator';
import { largestRemainder } from '@/utils/math';
import { FRAME_FIELDS } from '@/constants/frame-fields';
import { getInspectionDisplayDate } from '@/utils/inspection-display-date';

import {
  MainContent,
  PageAside,
  PageGrid,
} from '@/components/layout/page-grid-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define tab enum for cleaner code
enum InspectionTab {
  ALL = 'all',
  RECENT = 'recent',
  UPCOMING = 'upcoming',
}

export const InspectionListPage = () => {
  const { t } = useTranslation(['inspection', 'common']);
  // Get view type from URL param, defaults to 'all'
  const { view } = useParams<{ view: string }>();
  const activeTab = (view as InspectionTab) || InspectionTab.ALL;

  const navigate = useNavigate();
  const { activeApiary } = useApiary();
  const isSubjective = activeApiary?.settings?.inspectionType === 'subjective';
  const [searchTerm, setSearchTerm] = useState<string | undefined>('');
  const [selectedHiveId, setSelectedHiveId] = useState<string | undefined>(
    undefined,
  );

  // Fetch inspections and hives
  const {
    data: inspections,
    isLoading: isLoadingInspections,
    refetch: refetchInspections,
  } = useInspections(
    selectedHiveId && selectedHiveId !== 'all'
      ? { hiveId: selectedHiveId }
      : undefined,
  );

  const { data: hivesData, isLoading: isLoadingHives } = useHives();

  // Handle tab changes
  const handleTabChange = (value: string) => {
    navigate(
      `/inspections${value !== InspectionTab.ALL ? `/list/${value}` : ''}`,
    );
  };

  // Filter inspections based on tab and search term
  const filteredInspections = useMemo(() => {
    if (!inspections) return [];

    // First apply search filter
    const searchFiltered = [...inspections];

    // Then apply tab filter
    switch (activeTab) {
      case InspectionTab.RECENT:
        return searchFiltered.filter(inspection => {
          const inspectionDate = parseISO(inspection.date as string);
          return isPast(inspectionDate) && !isToday(inspectionDate);
        });

      case InspectionTab.UPCOMING:
        return searchFiltered.filter(inspection => {
          const inspectionDate = parseISO(inspection.date as string);
          return isFuture(inspectionDate) || isToday(inspectionDate);
        });

      case InspectionTab.ALL:
      default:
        return searchFiltered;
    }
  }, [inspections, activeTab]);

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

  if (isLoadingInspections || isLoadingHives) {
    return <div>{t('common:status.loading')}</div>;
  }

  return (
    <PageGrid>
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
                <span>{t('inspection:tabs.all')}</span>
              </TabsTrigger>
              <TabsTrigger
                value={InspectionTab.RECENT}
                className="flex items-center gap-1"
              >
                <HistoryIcon className="h-4 w-4" />
                <span>{t('inspection:tabs.recent')}</span>
              </TabsTrigger>
              <TabsTrigger
                value={InspectionTab.UPCOMING}
                className="flex items-center gap-1"
              >
                <CalendarClockIcon className="h-4 w-4" />
                <span>{t('inspection:tabs.upcoming')}</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('inspection:list.searchPlaceholder')}
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
                    <SelectValue
                      placeholder={t('inspection:list.filterByHive')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('inspection:list.allHives')}
                    </SelectItem>
                    {hivesData?.map(hive => (
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
              t('inspection:list.allInspections'),
              navigate,
              hivesData,
              InspectionTab.ALL,
              t,
              isSubjective,
            )}
          </TabsContent>

          <TabsContent value={InspectionTab.RECENT}>
            {renderInspectionsTable(
              sortedInspections,
              t('inspection:list.recentInspections'),
              navigate,
              hivesData,
              InspectionTab.RECENT,
              t,
              isSubjective,
            )}
          </TabsContent>

          <TabsContent value={InspectionTab.UPCOMING}>
            {renderUpcomingInspections(
              sortedInspections,
              hivesData,
              t,
              navigate,
              refetchInspections,
              isSubjective,
            )}
          </TabsContent>
        </Tabs>
      </MainContent>

      <PageAside>
        <InspectionActionSidebar
          onRefreshData={() => refetchInspections()}
          selectedHiveId={selectedHiveId}
          onChangeView={handleTabChange}
          currentView={activeTab}
        />
      </PageAside>
    </PageGrid>
  );
};



const getHiveName = (
  hiveId: string,
  hives: HiveResponse[],
  t: (key: string) => string,
) => {
  const hive = hives.find(h => h.id === hiveId);
  return hive ? hive.name : t('inspection:list.unknownHive');
};

const getStatusBadge = (
  status: InspectionStatus,
  t: (key: string) => string,
) => {
  switch (status) {
    case InspectionStatus.SCHEDULED:
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          {t('inspection:status.scheduled')}
        </Badge>
      );
    case InspectionStatus.COMPLETED:
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          {t('inspection:status.completed')}
        </Badge>
      );
    case InspectionStatus.OVERDUE:
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          {t('inspection:status.overdue')}
        </Badge>
      );
    case InspectionStatus.CANCELLED:
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-600">
          {t('inspection:status.cancelled')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

/**
 * Renders the weather cell content: temperature and weather icon
 */
const renderWeatherCell = (inspection: InspectionResponse, t: (key: string) => string) => {
  return (
    <div className="flex items-center gap-2">
      {inspection.temperature && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <ThermometerIcon className="h-4 w-4" />
          <span>{inspection.temperature}°</span>
        </div>
      )}
      {inspection.weatherConditions ? (
        <div className="flex items-center gap-1">
          {getWeatherIcon(inspection.weatherConditions)}
        </div>
      ) : (
        <span className="text-muted-foreground italic">
          {t('inspection:fields.notRecorded')}
        </span>
      )}
    </div>
  );
};

/**
 * Renders the strength/frame cell with popover containing frame breakdown
 */
const renderStrengthCell = (
  inspection: InspectionResponse,
  activeTab: InspectionTab,
  isSubjective: boolean,
  strength: number | null,
  totalFrames: number | null,
  strengthDelta: number | null,
  frameCounts: number[],
  _frameTotal: number,
  framePcts: number[] | null,
  obs: NonNullable<InspectionResponse['observations']> | undefined,
  t: (key: string) => string,
) => {
  // If subjective, upcoming, or scheduled - show status badge instead
  if (
    isSubjective ||
    activeTab === InspectionTab.UPCOMING ||
    inspection.status === InspectionStatus.SCHEDULED
  ) {
    return getStatusBadge(inspection.status, t);
  }

  // Otherwise show strength with popover
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 p-0 h-auto">
          {strength == null ? (
            <span className="text-muted-foreground text-sm">—</span>
          ) : (
            <>
              <span className="font-medium tabular-nums">
                {strength}{totalFrames != null ? `/${totalFrames}` : ''}
              </span>
              <TrendIndicator delta={strengthDelta} iconSize="h-3 w-3" />
            </>
          )}
          <InfoIcon className="h-3 w-3 text-muted-foreground ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Brood Nest Stats</h4>

          {framePcts ? (
            <div className="space-y-1.5">
              {FRAME_FIELDS.map((f, i) => {
                if (frameCounts[i] === 0) return null;
                return (
                  <div key={f.key} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                    <span className="text-sm flex-1">{f.label}</span>
                    <span className="text-sm font-medium tabular-nums">{framePcts[i]}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No frame data recorded</p>
          )}

          {obs?.queenCells != null && obs.queenCells > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <CrownIcon className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="text-sm flex-1">Queen Cells</span>
              <span className="text-sm font-medium tabular-nums">{obs.queenCells}</span>
            </div>
          )}

          {inspection.score?.warnings && inspection.score.warnings.length > 0 && (
            <div className="pt-2 border-t">
              <h5 className="text-sm font-medium text-amber-500 flex items-center gap-1 mb-1">
                <ActivityIcon className="h-3 w-3" />
                {t('inspection:scores.warnings')}
              </h5>
              <ul className="text-xs space-y-1">
                {inspection.score.warnings.map(warning => (
                  <li key={warning} className="text-muted-foreground">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const InspectionTableRow = ({
  inspection,
  index,
  inspections,
  hives,
  activeTab,
  t,
  isSubjective,
  navigate,
}: {
  inspection: InspectionResponse;
  index: number;
  inspections: InspectionResponse[];
  hives: HiveResponse[];
  activeTab: InspectionTab;
  t: (key: string, options?: Record<string, unknown>) => string;
  isSubjective: boolean;
  navigate: (path: string) => void;
}) => {
  const prevInspection = inspections
    .slice(index + 1)
    .find(candidate => candidate.hiveId === inspection.hiveId);
  const obs = inspection.observations;
  const strength    = obs?.strength ?? null;
  const totalFrames = obs?.totalFrames ?? null;
  const prevStrength = prevInspection?.observations?.strength ?? null;
  const strengthDelta = strength != null && prevStrength != null ? strength - prevStrength : null;

  const frameCounts = FRAME_FIELDS.map(f => (obs?.[f.obsKey] as number | null | undefined) ?? 0);
  const frameTotal  = frameCounts.reduce((a, b) => a + b, 0);
  const framePcts   = frameTotal > 0 ? largestRemainder(frameCounts, frameTotal) : null;

  return (
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
      <TableCell>{getHiveName(inspection.hiveId, hives, t)}</TableCell>
      <TableCell>
        {renderWeatherCell(inspection, t)}
      </TableCell>
      <TableCell>
        {renderStrengthCell(
          inspection,
          activeTab,
          isSubjective,
          strength,
          totalFrames,
          strengthDelta,
          frameCounts,
          frameTotal,
          framePcts,
          obs,
          t,
        )}
      </TableCell>
      <TableCell>
        {inspection.observations?.queenSeen === null ? (
          <span className="text-muted-foreground italic">
            {t('inspection:fields.notRecorded')}
          </span>
        ) : (
          <span
            className={
              inspection.observations?.queenSeen
                ? 'text-green-600'
                : 'text-amber-500'
            }
          >
            {inspection.observations?.queenSeen
              ? t('inspection:fields.yes')
              : t('inspection:fields.no')}
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
          {t('inspection:actions.details')}{' '}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const renderInspectionsTable = (
  inspections: InspectionResponse[],
  caption: string,
  navigate: (path: string) => void,
  hives: HiveResponse[] = [],
  activeTab: InspectionTab = InspectionTab.ALL,
  t: (key: string, options?: Record<string, unknown>) => string,
  isSubjective: boolean = false,
) => {

  return inspections.length > 0 ? (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{t('inspection:fields.dateTime')}</TableHead>
          <TableHead>{t('inspection:fields.hive')}</TableHead>
          <TableHead>{t('inspection:fields.weather')}</TableHead>
          <TableHead>
            {activeTab === InspectionTab.UPCOMING || isSubjective
              ? t('inspection:fields.status')
              : 'Strength'}
          </TableHead>
          <TableHead>{t('inspection:fields.queenSeen')}</TableHead>
          <TableHead className="text-right">
            {t('common:actions.actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inspections.map((inspection, index) => (
          <InspectionTableRow
            key={inspection.id}
            inspection={inspection}
            index={index}
            inspections={inspections}
            hives={hives}
            activeTab={activeTab}
            t={t}
            isSubjective={isSubjective}
            navigate={navigate}
          />
        ))}
      </TableBody>
    </Table>
  ) : (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-muted-foreground mb-4">
        {t('inspection:list.noInspections')}
      </p>
    </div>
  );
};

const renderUpcomingInspections = (
  inspections: InspectionResponse[],
  hives: HiveResponse[] = [],
  t: (key: string, options?: Record<string, unknown>) => string,
  navigate: (path: string) => void,
  refetchInspections: () => void,
  isSubjective: boolean = false,
) => {
  // Filter only scheduled inspections for cards
  const scheduledInspections = inspections.filter(
    inspection => inspection.status === InspectionStatus.SCHEDULED,
  );

  // Group inspections by date category
  const today = [];
  const upcoming = [];
  const overdue = [];

  for (const inspection of scheduledInspections) {
    const inspectionDate = getInspectionDisplayDate(inspection);
    if (isToday(inspectionDate)) {
      today.push(inspection);
    } else if (isPast(inspectionDate)) {
      overdue.push(inspection);
    } else {
      upcoming.push(inspection);
    }
  }

  return (
    <div className="space-y-6">
      {/* Overdue inspections */}
      {overdue.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
            <CalendarClockIcon className="h-5 w-5" />
            {t('inspection:scheduled.overdueInspections')} ({overdue.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {overdue.map(inspection => (
              <ScheduledInspectionCard
                key={inspection.id}
                inspection={inspection}
                hiveName={getHiveName(inspection.hiveId, hives, t)}
                onUpdate={refetchInspections}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's inspections */}
      {today.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-3 flex items-center gap-2">
            <CalendarClockIcon className="h-5 w-5" />
            {t('inspection:scheduled.todaysInspections')} ({today.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {today.map(inspection => (
              <ScheduledInspectionCard
                key={inspection.id}
                inspection={inspection}
                hiveName={getHiveName(inspection.hiveId, hives, t)}
                onUpdate={refetchInspections}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming inspections */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CalendarClockIcon className="h-5 w-5" />
            {t('inspection:scheduled.upcomingInspections')} ({upcoming.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(inspection => (
              <ScheduledInspectionCard
                key={inspection.id}
                inspection={inspection}
                hiveName={getHiveName(inspection.hiveId, hives, t)}
                onUpdate={refetchInspections}
              />
            ))}
          </div>
        </div>
      )}

      {/* Show non-scheduled, non-completed inspections in a table below */}
      {inspections.some(
        i =>
          i.status !== InspectionStatus.SCHEDULED &&
          i.status !== InspectionStatus.COMPLETED,
      ) && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            {t('inspection:scheduled.otherUpcomingInspections')}
          </h3>
          {renderInspectionsTable(
            inspections.filter(
              i =>
                i.status !== InspectionStatus.SCHEDULED &&
                i.status !== InspectionStatus.COMPLETED,
            ),
            'Cancelled inspections',
            navigate,
            hives,
            InspectionTab.UPCOMING,
            t,
            isSubjective,
          )}
        </div>
      )}

      {scheduledInspections.length === 0 && inspections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            {t('inspection:list.noInspections')}
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to determine the appropriate weather icon
const getWeatherIcon = (weatherCondition: string | null | undefined) => {
  if (!weatherCondition) return null;

  const condition = weatherCondition.toLowerCase();

  // Return the appropriate icon based on weather condition keywords
  if (condition.includes('sunny') || condition.includes('clear')) {
    return <SunIcon className="h-4 w-4 text-yellow-500" />;
  } else if (condition.includes('partly cloudy')) {
    return <CloudIcon className="h-4 w-4 text-blue-300" />;
  } else if (condition.includes('cloudy') || condition.includes('overcast')) {
    return <CloudIcon className="h-4 w-4 text-gray-400" />;
  } else if (condition.includes('rain')) {
    return <CloudRainIcon className="h-4 w-4 text-blue-500" />;
  }

  // Default to thermometer if no specific condition matches
  return <ThermometerIcon className="h-4 w-4 text-gray-500" />;
};
