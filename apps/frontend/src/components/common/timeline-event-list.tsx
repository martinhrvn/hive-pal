import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  format,
  formatDistanceToNow,
  subMonths,
  isPast,
  parseISO,
} from 'date-fns';
import {
  CalendarIcon,
  ActivityIcon,
  DropletsIcon,
  ChevronDownIcon,
  FileTextIcon,
  Package,
  Pill,
  Frame,
  Droplet,
  Crown,
  CircleIcon,
  Filter,
  X,
  StickyNote,
  AlertCircle,
  Pencil,
  Trash2,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  InspectionResponse,
  InspectionStatus,
  ActionResponse,
  QuickCheckResponse,
} from 'shared-schemas';
import { cn } from '@/lib/utils';
import { PhotoGallery } from './photo-gallery';

export type TimelineEvent = {
  id: string;
  date: string;
  type: 'inspection' | 'action' | 'note' | 'quick-check';
  data: InspectionResponse | ActionResponse | QuickCheckResponse;
};

export type EventTypeFilter =
  | 'all'
  | 'inspections'
  | 'feeding'
  | 'treatment'
  | 'harvest'
  | 'notes'
  | 'quick-checks'
  | 'other';

export type DateRangeFilter = 'all' | '1month' | '3months' | '6months' | 'year';

export interface TimelineEventListProps {
  inspections: InspectionResponse[];
  actions: ActionResponse[];
  quickChecks: QuickCheckResponse[];
  isLoading?: boolean;
  maxDisplayed?: number;
  emptyMessage?: string;
  onEditAction?: (action: ActionResponse) => void;
  onDeleteAction?: (action: ActionResponse) => void;
  onDeleteQuickCheck?: (quickCheck: QuickCheckResponse) => void;
  onInspectionClick?: (inspection: InspectionResponse) => void;
  onActionClick?: (action: ActionResponse) => void;
  getHiveName?: (hiveId: string) => string | undefined;
  /** List of hives for the hive filter dropdown. When provided, a hive select is shown. */
  hives?: Array<{ id: string; name: string }>;
  headerSlot?: React.ReactNode;
}

const formatDate = (date: string) => {
  const parsedDate = new Date(date);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays < 14) {
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  }
  return format(parsedDate, 'MMM d, yyyy');
};

const formatTime = (date: string) => {
  return format(new Date(date), 'h:mm a');
};

const getActionIcon = (action: ActionResponse) => {
  switch (action.type) {
    case 'FEEDING':
      return <Droplet className="h-4 w-4" />;
    case 'TREATMENT':
      return <Pill className="h-4 w-4" />;
    case 'FRAME':
      return <Frame className="h-4 w-4" />;
    case 'HARVEST':
      return <Package className="h-4 w-4" />;
    case 'NOTE':
      return <StickyNote className="h-4 w-4" />;
    default:
      return <ActivityIcon className="h-4 w-4" />;
  }
};

const getActionLabel = (action: ActionResponse, t: (key: string) => string) => {
  switch (action.type) {
    case 'FEEDING':
      if (action.details?.type === 'FEEDING') {
        return `Fed ${action.details.amount} ${action.details.unit} of ${action.details.feedType}${
          action.details.concentration
            ? ` (${action.details.concentration})`
            : ''
        }`;
      }
      return 'Feeding';
    case 'TREATMENT':
      if (action.details?.type === 'TREATMENT') {
        return `Treated with ${action.details.product} (${action.details.quantity} ${action.details.unit})`;
      }
      return 'Treatment';
    case 'FRAME':
      if (action.details?.type === 'FRAME') {
        return `Added ${action.details.quantity} frame${action.details.quantity !== 1 ? 's' : ''}`;
      }
      return 'Frame management';
    case 'HARVEST':
      if (action.details?.type === 'HARVEST') {
        return `Harvested ${action.details.amount} ${action.details.unit}`;
      }
      return 'Harvest';
    case 'NOTE':
      return 'Note';
    case 'BOX_CONFIGURATION':
      return t('common:timeline.boxConfiguration');
    default:
      return action.type;
  }
};

export const TimelineEventList: React.FC<TimelineEventListProps> = ({
  inspections,
  actions,
  quickChecks,
  isLoading,
  maxDisplayed = 10,
  emptyMessage,
  onEditAction,
  onDeleteAction,
  onDeleteQuickCheck,
  onInspectionClick,
  onActionClick,
  getHiveName,
  hives,
  headerSlot,
}) => {
  const { t } = useTranslation('common');
  const [showAll, setShowAll] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] =
    useState<EventTypeFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>('all');
  const [hiveFilter, setHiveFilter] = useState<string>('all');

  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    const now = new Date();

    let startDate: Date | null = null;
    if (dateRangeFilter !== 'all') {
      switch (dateRangeFilter) {
        case '1month':
          startDate = subMonths(now, 1);
          break;
        case '3months':
          startDate = subMonths(now, 3);
          break;
        case '6months':
          startDate = subMonths(now, 6);
          break;
        case 'year':
          startDate = subMonths(now, 12);
          break;
      }
    }

    if (
      inspections &&
      (eventTypeFilter === 'all' || eventTypeFilter === 'inspections')
    ) {
      inspections.forEach(inspection => {
        const eventDate = new Date(inspection.date);
        if (!startDate || eventDate >= startDate) {
          events.push({
            id: `inspection-${inspection.id}`,
            date: inspection.date,
            type: 'inspection',
            data: inspection,
          });
        }
      });
    }

    if (actions) {
      actions
        .filter(action => !action.inspectionId)
        .forEach(action => {
          const eventDate = new Date(action.date);
          if (!startDate || eventDate >= startDate) {
            let includeAction = false;
            if (eventTypeFilter === 'all') {
              includeAction = true;
            } else if (
              eventTypeFilter === 'feeding' &&
              action.type === 'FEEDING'
            ) {
              includeAction = true;
            } else if (
              eventTypeFilter === 'treatment' &&
              action.type === 'TREATMENT'
            ) {
              includeAction = true;
            } else if (
              eventTypeFilter === 'harvest' &&
              action.type === 'HARVEST'
            ) {
              includeAction = true;
            } else if (eventTypeFilter === 'notes' && action.type === 'NOTE') {
              includeAction = true;
            } else if (
              eventTypeFilter === 'other' &&
              (action.type === 'FRAME' ||
                action.type === 'OTHER' ||
                action.type === 'BOX_CONFIGURATION')
            ) {
              includeAction = true;
            }

            if (includeAction) {
              events.push({
                id: `action-${action.id}`,
                date: action.date,
                type: 'action',
                data: action,
              });
            }
          }
        });
    }

    if (
      quickChecks &&
      (eventTypeFilter === 'all' || eventTypeFilter === 'quick-checks')
    ) {
      quickChecks.forEach(quickCheck => {
        const eventDate = new Date(quickCheck.date);
        if (!startDate || eventDate >= startDate) {
          events.push({
            id: `quick-check-${quickCheck.id}`,
            date: quickCheck.date,
            type: 'quick-check',
            data: quickCheck,
          });
        }
      });
    }

    // Apply hive filter
    const filtered = hiveFilter === 'all'
      ? events
      : events.filter(event => {
          const data = event.data;
          const eventHiveId = 'hiveId' in data ? data.hiveId : undefined;
          return eventHiveId === hiveFilter;
        });

    return filtered.sort((a, b) => {
      const aIsOverdue =
        a.type === 'inspection' &&
        (a.data as InspectionResponse).status === InspectionStatus.SCHEDULED &&
        isPast(parseISO(a.date));
      const bIsOverdue =
        b.type === 'inspection' &&
        (b.data as InspectionResponse).status === InspectionStatus.SCHEDULED &&
        isPast(parseISO(b.date));

      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;

      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [inspections, actions, quickChecks, eventTypeFilter, dateRangeFilter, hiveFilter]);

  const displayedEvents = showAll
    ? timelineEvents
    : timelineEvents.slice(0, maxDisplayed);

  const hasActiveFilters =
    eventTypeFilter !== 'all' || dateRangeFilter !== 'all' || hiveFilter !== 'all';

  const renderHiveName = (event: TimelineEvent) => {
    if (!getHiveName) return null;
    const data = event.data;
    const hiveId = 'hiveId' in data ? (data.hiveId as string) : undefined;
    if (!hiveId) return null;
    const name = getHiveName(hiveId);
    if (!name) return null;
    return (
      <Badge variant="outline" className="text-xs py-0 ml-1">
        {name}
      </Badge>
    );
  };

  const renderTimelineEvent = (event: TimelineEvent, isLast: boolean) => {
    const isInspection = event.type === 'inspection';
    const isQuickCheck = event.type === 'quick-check';
    const inspection = isInspection ? (event.data as InspectionResponse) : null;
    const quickCheck = isQuickCheck ? (event.data as QuickCheckResponse) : null;
    const action =
      !isInspection && !isQuickCheck ? (event.data as ActionResponse) : null;

    const isScheduled = inspection?.status === InspectionStatus.SCHEDULED;
    const isCancelled = inspection?.status === InspectionStatus.CANCELLED;
    const isOverdue = isScheduled && isPast(parseISO(event.date));

    return (
      <div key={event.id} className="flex gap-4 pb-8 relative">
        {/* Timeline line and dot */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'w-3 h-3 rounded-full border-2 bg-background z-10',
              isInspection ? 'border-blue-500' : 'border-gray-400',
              isQuickCheck && 'border-green-500',
              isScheduled && !isOverdue && 'border-amber-500',
              isOverdue && 'border-red-500',
              isCancelled && 'border-gray-300',
            )}
          >
            {isInspection && (
              <CircleIcon className="w-2 h-2 -mt-0.5 -ml-0.5 fill-current text-blue-500" />
            )}
            {isQuickCheck && (
              <CircleIcon className="w-2 h-2 -mt-0.5 -ml-0.5 fill-current text-green-500" />
            )}
          </div>
          {!isLast && (
            <div className="w-0.5 bg-gray-200 h-full absolute top-3 left-1.5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 -mt-1">
          {/* Date */}
          <div className="text-xs text-muted-foreground mb-1">
            {formatDate(event.date)} • {formatTime(event.date)}
          </div>

          {/* Inspection content */}
          {isInspection && inspection && (
            <div
              className={cn(
                'rounded-lg p-2 -ml-2 transition-colors',
                onInspectionClick && 'cursor-pointer',
                isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50',
              )}
              onClick={
                onInspectionClick
                  ? () => onInspectionClick(inspection)
                  : undefined
              }
            >
              <div className="flex items-center gap-2 mb-1">
                {isOverdue ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                )}
                <span className="font-medium text-sm">{t('common:timeline.inspection')}</span>
                {renderHiveName(event)}
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    {t('common:timeline.overdue')}
                  </Badge>
                )}
                {isScheduled && !isOverdue && (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-600 text-xs"
                  >
                    {t('common:timeline.scheduled')}
                  </Badge>
                )}
                {isCancelled && (
                  <Badge
                    variant="outline"
                    className="text-gray-500 border-gray-300 text-xs"
                  >
                    {t('common:timeline.cancelled')}
                  </Badge>
                )}
              </div>

              {!isScheduled && !isCancelled && inspection.observations && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  {inspection.observations.strength !== null && (
                    <span className="flex items-center gap-1">
                      <ActivityIcon className="h-3 w-3" />
                      {t('common:timeline.strength')}: {inspection.observations.strength}
                    </span>
                  )}
                  {inspection.observations.honeyStores !== null && (
                    <span className="flex items-center gap-1">
                      <DropletsIcon className="h-3 w-3" />
                      {t('common:timeline.honey')}: {inspection.observations.honeyStores}
                    </span>
                  )}
                  {inspection.observations.queenSeen !== null && (
                    <span className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      {inspection.observations.queenSeen ? t('common:timeline.queenSeen') : t('common:timeline.queenNotSeen')}
                    </span>
                  )}
                </div>
              )}

              {inspection.notes && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <FileTextIcon className="h-3 w-3" />
                  <span>{t('common:timeline.notesAvailable')}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick check content */}
          {isQuickCheck && quickCheck && (
            <div className="flex items-start gap-2 group">
              <div className="mt-0.5">
                <ClipboardCheck className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {t('common:quickCheck.title')}
                  {renderHiveName(event)}
                </div>
                {quickCheck.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {quickCheck.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs py-0"
                      >
                        {tag.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
                {quickCheck.note && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {quickCheck.note}
                  </div>
                )}
                {quickCheck.photos.length > 0 && (
                  <div className="mt-1">
                    <PhotoGallery
                      quickCheckId={quickCheck.id}
                      photos={quickCheck.photos}
                    />
                  </div>
                )}
              </div>
              {onDeleteQuickCheck && (
                <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteQuickCheck(quickCheck);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action content */}
          {action && (
            <div
              className={cn(
                'flex items-start gap-2 group',
                (action.harvestId || onActionClick) &&
                  'cursor-pointer rounded-lg p-2 -ml-2 -mt-2 hover:bg-gray-50',
              )}
              onClick={
                onActionClick ? () => onActionClick(action) : undefined
              }
            >
              <div className="mt-0.5">{getActionIcon(action)}</div>
              <div className="flex-1">
                <div className="text-sm">
                  {getActionLabel(action, t)}
                  {renderHiveName(event)}
                </div>
                {action.notes && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {action.notes}
                  </div>
                )}
              </div>
              {!action.harvestId && (onEditAction || onDeleteAction) && (
                <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                  {onEditAction && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={e => {
                        e.stopPropagation();
                        onEditAction(action);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDeleteAction && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteAction(action);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="relative">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4 pb-8 relative">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
              {i < 3 && (
                <div className="w-0.5 bg-gray-100 h-full absolute top-3 left-1.5" />
              )}
            </div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded w-48 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <Select
          value={eventTypeFilter}
          onValueChange={value => setEventTypeFilter(value as EventTypeFilter)}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-3 w-3 mr-2" />
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common:timeline.allEvents')}</SelectItem>
            <SelectItem value="inspections">{t('common:timeline.inspections')}</SelectItem>
            <SelectItem value="feeding">{t('common:timeline.feeding')}</SelectItem>
            <SelectItem value="treatment">{t('common:timeline.treatments')}</SelectItem>
            <SelectItem value="harvest">{t('common:timeline.harvests')}</SelectItem>
            <SelectItem value="quick-checks">{t('common:quickCheck.title')}</SelectItem>
            <SelectItem value="notes">{t('common:timeline.notes')}</SelectItem>
            <SelectItem value="other">{t('common:timeline.other')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={dateRangeFilter}
          onValueChange={value => setDateRangeFilter(value as DateRangeFilter)}
        >
          <SelectTrigger className="w-40">
            <CalendarIcon className="h-3 w-3 mr-2" />
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common:timeline.allTime')}</SelectItem>
            <SelectItem value="1month">{t('common:timeline.lastMonth')}</SelectItem>
            <SelectItem value="3months">{t('common:timeline.last3Months')}</SelectItem>
            <SelectItem value="6months">{t('common:timeline.last6Months')}</SelectItem>
            <SelectItem value="year">{t('common:timeline.lastYear')}</SelectItem>
          </SelectContent>
        </Select>

        {hives && hives.length > 0 && (
          <Select
            value={hiveFilter}
            onValueChange={setHiveFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Hive" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common:timeline.allHives')}</SelectItem>
              {hives.map(hive => (
                <SelectItem key={hive.id} value={hive.id}>
                  {hive.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEventTypeFilter('all');
              setDateRangeFilter('all');
              setHiveFilter('all');
            }}
            className="h-9 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            {t('common:timeline.clearFilters')}
          </Button>
        )}

        {headerSlot && <div className="flex gap-2 ml-auto">{headerSlot}</div>}
      </div>

      <div className="relative">
        {displayedEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {hasActiveFilters
              ? t('common:timeline.noMatchingFilters')
              : (emptyMessage ?? t('common:timeline.noActivity'))}
          </div>
        ) : (
          <>
            {displayedEvents.map((event, index) =>
              renderTimelineEvent(
                event,
                index === displayedEvents.length - 1,
              ),
            )}

            {timelineEvents.length > maxDisplayed && (
              <div className="pl-7 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs h-7 px-2"
                >
                  {showAll
                    ? t('common:timeline.showLess')
                    : t('common:timeline.showMore', { count: timelineEvents.length - maxDisplayed })}
                  <ChevronDownIcon
                    className={`ml-1 h-3 w-3 transition-transform ${
                      showAll ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
