import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  format,
  subMonths,
  isPast,
  parseISO,
  isToday,
  isYesterday,
  startOfDay,
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
  X,
  StickyNote,
  AlertCircle,
  Pencil,
  Trash2,
  ClipboardCheck,
  Camera,
  Wrench,
  MoreVertical,
  CheckCircle,
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
  PhotoResponse,
  DocumentResponse,
} from 'shared-schemas';
import { getFeedTypeLabel } from '@/pages/inspection/components/inspection-form/actions/feeding';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScheduledInspectionActions } from '@/api/hooks/useScheduledInspectionActions';
import { cn } from '@/lib/utils';
import { PhotoGallery } from './photo-gallery';
import { StandalonePhotoPreview } from './standalone-photo-preview';
import { DocumentDownloadLink } from './document-download-link';

export type TimelineEvent = {
  id: string;
  date: string;
  type: 'inspection' | 'action' | 'note' | 'quick-check' | 'photo' | 'document';
  data: InspectionResponse | ActionResponse | QuickCheckResponse | PhotoResponse | DocumentResponse;
};

export type EventTypeFilter =
  | 'all'
  | 'inspections'
  | 'feeding'
  | 'treatment'
  | 'harvest'
  | 'notes'
  | 'quick-checks'
  | 'photos'
  | 'documents'
  | 'other';

export type DateRangeFilter = 'all' | '1month' | '3months' | '6months' | 'year';

export interface TimelineEventListProps {
  inspections: InspectionResponse[];
  actions: ActionResponse[];
  quickChecks: QuickCheckResponse[];
  photos?: PhotoResponse[];
  documents?: DocumentResponse[];
  isLoading?: boolean;
  maxDisplayed?: number;
  emptyMessage?: string;
  onEditAction?: (action: ActionResponse) => void;
  onDeleteAction?: (action: ActionResponse) => void;
  onDeleteQuickCheck?: (quickCheck: QuickCheckResponse) => void;
  onDeletePhoto?: (photo: PhotoResponse) => void;
  onDeleteDocument?: (document: DocumentResponse) => void;
  onInspectionClick?: (inspection: InspectionResponse) => void;
  onActionClick?: (action: ActionResponse) => void;
  getHiveName?: (hiveId: string) => string | undefined;
  /** List of hives for the hive filter dropdown. When provided, a hive select is shown. */
  hives?: Array<{ id: string; name: string }>;
  headerSlot?: React.ReactNode;
}

const formatTime = (date: string) => {
  return format(new Date(date), 'h:mm a');
};

const formatEntryDate = (
  date: string,
  t: (key: string) => string,
): string => {
  const d = new Date(date);
  if (isToday(d)) return t('common:timeline.today');
  if (isYesterday(d)) return t('common:timeline.yesterday');
  const now = new Date();
  return format(d, d.getFullYear() === now.getFullYear() ? 'MMM d' : 'MMM d, yyyy');
};

type DayHeaderParts = {
  day: string;
  month: string;
  year: string;
  context: string;
};

const formatDayHeaderParts = (
  date: Date,
  t: (key: string) => string,
): DayHeaderParts => {
  const day = format(date, 'd');
  const month = format(date, 'MMM');
  const year = format(date, 'yyyy');
  let context: string;
  if (isToday(date)) {
    context = t('common:timeline.today');
  } else if (isYesterday(date)) {
    context = t('common:timeline.yesterday');
  } else {
    context = format(date, 'EEEE');
  }
  return { day, month, year, context };
};

const HEXAGON_CLIP =
  'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';

type MarkerTone =
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'sky'
  | 'violet'
  | 'orange'
  | 'yellow'
  | 'stone'
  | 'red'
  | 'scheduled';

const markerToneClasses: Record<
  MarkerTone,
  { fill: string; ring: string; dot: string }
> = {
  amber: {
    fill: 'bg-amber-500 dark:bg-amber-400',
    ring: 'bg-amber-200/60 dark:bg-amber-500/20',
    dot: 'bg-amber-50 dark:bg-amber-950',
  },
  emerald: {
    fill: 'bg-emerald-500 dark:bg-emerald-400',
    ring: 'bg-emerald-200/60 dark:bg-emerald-500/20',
    dot: 'bg-emerald-50 dark:bg-emerald-950',
  },
  rose: {
    fill: 'bg-rose-500 dark:bg-rose-400',
    ring: 'bg-rose-200/60 dark:bg-rose-500/20',
    dot: 'bg-rose-50 dark:bg-rose-950',
  },
  sky: {
    fill: 'bg-sky-600 dark:bg-sky-400',
    ring: 'bg-sky-200/60 dark:bg-sky-500/20',
    dot: 'bg-sky-50 dark:bg-sky-950',
  },
  violet: {
    fill: 'bg-violet-500 dark:bg-violet-400',
    ring: 'bg-violet-200/60 dark:bg-violet-500/20',
    dot: 'bg-violet-50 dark:bg-violet-950',
  },
  orange: {
    fill: 'bg-orange-500 dark:bg-orange-400',
    ring: 'bg-orange-200/60 dark:bg-orange-500/20',
    dot: 'bg-orange-50 dark:bg-orange-950',
  },
  yellow: {
    fill: 'bg-yellow-600 dark:bg-yellow-400',
    ring: 'bg-yellow-200/60 dark:bg-yellow-500/20',
    dot: 'bg-yellow-50 dark:bg-yellow-950',
  },
  stone: {
    fill: 'bg-stone-400 dark:bg-stone-500',
    ring: 'bg-stone-200/70 dark:bg-stone-700/40',
    dot: 'bg-stone-50 dark:bg-stone-900',
  },
  red: {
    fill: 'bg-red-500 dark:bg-red-400',
    ring: 'bg-red-200/70 dark:bg-red-500/25',
    dot: 'bg-red-50 dark:bg-red-950',
  },
  scheduled: {
    fill: 'bg-stone-50 dark:bg-stone-900 ring-1 ring-amber-500/70 ring-inset',
    ring: 'bg-amber-100/50 dark:bg-amber-500/15',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
};

const Hexagon: React.FC<{ tone: MarkerTone; pulse?: boolean }> = ({
  tone,
  pulse,
}) => {
  const cls = markerToneClasses[tone];
  return (
    <span className="relative inline-flex items-center justify-center w-4 h-4 shrink-0">
      <span
        className={cn(
          'absolute inset-[-4px]',
          cls.ring,
          pulse && 'animate-pulse',
        )}
        style={{ clipPath: HEXAGON_CLIP }}
        aria-hidden
      />
      <span
        className={cn('relative w-full h-full', cls.fill)}
        style={{ clipPath: HEXAGON_CLIP }}
        aria-hidden
      />
      <span
        className={cn(
          'absolute w-1 h-1 rounded-full',
          cls.dot,
        )}
        aria-hidden
      />
    </span>
  );
};

const pillTriggerClass = (active: boolean) =>
  cn(
    'h-8 w-auto rounded-full border bg-white/70 dark:bg-stone-900/40 backdrop-blur-sm gap-1.5 px-2.5 text-xs font-medium transition-colors focus:ring-amber-400/40',
    active
      ? 'border-amber-400/80 text-stone-900 dark:text-stone-50 ring-1 ring-amber-400/20'
      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-600',
  );

const pillIconClass = (active: boolean) =>
  cn(
    'shrink-0',
    active
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-stone-500 dark:text-stone-400',
  );

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
    case 'MAINTENANCE':
      return <Wrench className="h-4 w-4" />;
    default:
      return <ActivityIcon className="h-4 w-4" />;
  }
};

const getActionLabel = (action: ActionResponse, t: (key: string) => string) => {
  switch (action.type) {
    case 'FEEDING':
      if (action.details?.type === 'FEEDING') {
        const feedName = getFeedTypeLabel(action.details.feedType);
        return `Fed ${action.details.amount} ${action.details.unit} of ${feedName}${
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
    case 'MAINTENANCE':
      if (action.details?.type === 'MAINTENANCE') {
        const comp = action.details.component.replace('_', ' ').toLowerCase();
        const stat = action.details.status.toLowerCase();
        return `${stat === 'cleaned' ? 'Cleaned' : 'Replaced'} ${comp}`;
      }
      return t('common:timeline.maintenance');
    default:
      return action.type;
  }
};

const getEventTone = (event: TimelineEvent): MarkerTone => {
  if (event.type === 'inspection') {
    const ins = event.data as InspectionResponse;
    if (ins.status === InspectionStatus.SCHEDULED) {
      return isPast(parseISO(event.date)) ? 'red' : 'scheduled';
    }
    if (ins.status === InspectionStatus.CANCELLED) return 'stone';
    return 'amber';
  }
  if (event.type === 'quick-check') return 'emerald';
  if (event.type === 'photo') return 'violet';
  if (event.type === 'document') return 'sky';
  if (event.type === 'action') {
    const a = event.data as ActionResponse;
    switch (a.type) {
      case 'FEEDING':
        return 'orange';
      case 'TREATMENT':
        return 'rose';
      case 'HARVEST':
        return 'yellow';
      case 'NOTE':
      case 'FRAME':
      case 'MAINTENANCE':
      case 'BOX_CONFIGURATION':
      default:
        return 'stone';
    }
  }
  return 'stone';
};

type DayGroup = {
  key: string;
  date: Date;
  events: TimelineEvent[];
};

const groupEventsByDay = (events: TimelineEvent[]): DayGroup[] => {
  const map = new Map<string, DayGroup>();
  for (const event of events) {
    const date = startOfDay(new Date(event.date));
    const key = format(date, 'yyyy-MM-dd');
    if (!map.has(key)) {
      map.set(key, { key, date, events: [] });
    }
    map.get(key)!.events.push(event);
  }
  return Array.from(map.values());
};

export const TimelineEventList: React.FC<TimelineEventListProps> = ({
  inspections,
  actions,
  quickChecks,
  photos,
  documents,
  isLoading,
  maxDisplayed = 10,
  emptyMessage,
  onEditAction,
  onDeleteAction,
  onDeleteQuickCheck,
  onDeletePhoto,
  onDeleteDocument,
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

  const { setReschedulingInspection, handleDoInspection, rescheduleDialogElement } =
    useScheduledInspectionActions(
      hiveId => (getHiveName ? (getHiveName(hiveId) ?? hiveId) : hiveId),
    );

  const timelineEvents= useMemo(() => {
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
                action.type === 'BOX_CONFIGURATION' ||
                action.type === 'MAINTENANCE')
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

    if (
      photos &&
      (eventTypeFilter === 'all' || eventTypeFilter === 'photos')
    ) {
      photos.forEach(photo => {
        const eventDate = new Date(photo.date);
        if (!startDate || eventDate >= startDate) {
          events.push({
            id: `photo-${photo.id}`,
            date: photo.date,
            type: 'photo',
            data: photo,
          });
        }
      });
    }

    if (
      documents &&
      (eventTypeFilter === 'all' || eventTypeFilter === 'documents')
    ) {
      documents.forEach(document => {
        const eventDate = new Date(document.date);
        if (!startDate || eventDate >= startDate) {
          events.push({
            id: `document-${document.id}`,
            date: document.date,
            type: 'document',
            data: document,
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
  }, [inspections, actions, quickChecks, photos, documents, eventTypeFilter, dateRangeFilter, hiveFilter]);

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

  const renderTimelineEvent = (event: TimelineEvent) => {
    const isInspection = event.type === 'inspection';
    const isQuickCheck = event.type === 'quick-check';
    const isPhoto = event.type === 'photo';
    const isDocument = event.type === 'document';
    const inspection = isInspection ? (event.data as InspectionResponse) : null;
    const quickCheck = isQuickCheck
      ? (event.data as QuickCheckResponse)
      : null;
    const photo = isPhoto ? (event.data as PhotoResponse) : null;
    const document = isDocument ? (event.data as DocumentResponse) : null;
    const action =
      !isInspection && !isQuickCheck && !isPhoto && !isDocument
        ? (event.data as ActionResponse)
        : null;

    const createdByUserName =
      inspection?.createdByUserName ??
      action?.createdByUserName ??
      quickCheck?.createdByUserName;
    const isScheduled = inspection?.status === InspectionStatus.SCHEDULED;
    const isCancelled = inspection?.status === InspectionStatus.CANCELLED;
    const isOverdue = isScheduled && isPast(parseISO(event.date));
    const tone = getEventTone(event);

    return (
      <div
        key={event.id}
        className="relative grid grid-cols-[28px_1fr] gap-x-3 sm:gap-x-4 pb-4 group/row"
      >
        {/* honeycomb marker + spine segment */}
        <div className="relative flex justify-center pt-1.5">
          <div
            className="absolute top-0 bottom-[-16px] left-1/2 -translate-x-px w-px border-l border-dashed border-stone-200 dark:border-stone-800"
            aria-hidden
          />
          <div className="relative z-10 bg-background p-0.5 rounded-full">
            <Hexagon tone={tone} pulse={!!isOverdue} />
          </div>
        </div>

        {/* content */}
        <div className="min-w-0 pt-0.5">
          {/* date + time + author */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-overline tabular-nums text-stone-500 dark:text-stone-400">
              {formatEntryDate(event.date, t)}
              <span className="text-stone-300 dark:text-stone-700 mx-1.5">
                ·
              </span>
              <span className="text-stone-400 dark:text-stone-500">
                {formatTime(event.date)}
              </span>
            </span>
            {createdByUserName && (
              <>
                <span
                  className="text-stone-300 dark:text-stone-700"
                  aria-hidden
                >
                  ·
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  {createdByUserName}
                </span>
              </>
            )}
          </div>

          {/* inspection */}
          {isInspection && inspection && (
            <div
              className={cn(
                'rounded-md -mx-2 px-2 py-1.5 transition-colors',
                onInspectionClick && !isScheduled && 'cursor-pointer',
                isOverdue
                  ? 'bg-red-50/70 hover:bg-red-100/70 dark:bg-red-950/30 dark:hover:bg-red-950/50 ring-1 ring-inset ring-red-200/60 dark:ring-red-900/40'
                  : !isScheduled &&
                      'hover:bg-stone-100/70 dark:hover:bg-stone-800/40',
              )}
              onClick={
                onInspectionClick && !isScheduled
                  ? () => onInspectionClick(inspection)
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isOverdue ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    ) : (
                      <CalendarIcon
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          isScheduled
                            ? 'text-amber-500'
                            : 'text-stone-500 dark:text-stone-400',
                        )}
                      />
                    )}
                    <span className="font-medium text-sm text-stone-900 dark:text-stone-100">
                      {isScheduled
                        ? t('common:timeline.inspectHive', {
                            hiveName:
                              getHiveName?.(inspection.hiveId) ?? '',
                          })
                        : t('common:timeline.inspection')}
                    </span>
                    {!isScheduled && renderHiveName(event)}
                    {isOverdue && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] h-4 px-1.5 py-0"
                      >
                        {t('common:timeline.overdue')}
                      </Badge>
                    )}
                    {isScheduled && !isOverdue && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 py-0 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30"
                      >
                        {t('common:timeline.scheduled')}
                      </Badge>
                    )}
                    {isCancelled && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 py-0 text-stone-500 dark:text-stone-400 border-stone-300 dark:border-stone-700"
                      >
                        {t('common:timeline.cancelled')}
                      </Badge>
                    )}
                  </div>

                  {!isScheduled &&
                    !isCancelled &&
                    inspection.observations && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {inspection.observations.strength !== null && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100/80 dark:bg-stone-800/50 ring-1 ring-inset ring-stone-200/70 dark:ring-stone-700/60 px-2 py-0.5 text-[11px] text-stone-700 dark:text-stone-300 tabular-nums">
                            <ActivityIcon className="h-3 w-3 text-stone-500" />
                            {t('common:timeline.strength')}:{' '}
                            {inspection.observations.strength}
                          </span>
                        )}
                        {inspection.observations.honeyStores !== null && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/80 dark:bg-amber-950/30 ring-1 ring-inset ring-amber-200/60 dark:ring-amber-900/40 px-2 py-0.5 text-[11px] text-amber-800 dark:text-amber-300 tabular-nums">
                            <DropletsIcon className="h-3 w-3" />
                            {t('common:timeline.honey')}:{' '}
                            {inspection.observations.honeyStores}
                          </span>
                        )}
                        {inspection.observations.queenSeen !== null && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ring-inset',
                              inspection.observations.queenSeen
                                ? 'bg-amber-50/80 dark:bg-amber-950/30 ring-amber-200/60 dark:ring-amber-900/40 text-amber-800 dark:text-amber-300'
                                : 'bg-stone-100/80 dark:bg-stone-800/50 ring-stone-200/70 dark:ring-stone-700/60 text-stone-600 dark:text-stone-400',
                            )}
                          >
                            <Crown className="h-3 w-3" />
                            {inspection.observations.queenSeen
                              ? t('common:timeline.queenSeen')
                              : t('common:timeline.queenNotSeen')}
                          </span>
                        )}
                      </div>
                    )}

                  {inspection.notes && (
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                      <FileTextIcon className="h-3 w-3" />
                      <span>{t('common:timeline.notesAvailable')}</span>
                    </div>
                  )}
                </div>

                {isScheduled && !isCancelled && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          handleDoInspection(inspection);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('common:timeline.doInspection')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          setReschedulingInspection(inspection);
                        }}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {t('common:timeline.reschedule')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}

          {/* quick check */}
          {isQuickCheck && quickCheck && (
            <div className="flex items-start gap-2">
              <ClipboardCheck className="h-3.5 w-3.5 mt-0.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap text-sm font-medium text-stone-900 dark:text-stone-100">
                  {t('common:quickCheck.title')}
                  {renderHiveName(event)}
                </div>
                {quickCheck.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {quickCheck.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] py-0 px-1.5 h-4 font-normal bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/50"
                      >
                        {tag.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
                {quickCheck.note && (
                  <div className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                    {quickCheck.note}
                  </div>
                )}
                {quickCheck.photos.length > 0 && (
                  <div className="mt-1.5">
                    <PhotoGallery
                      quickCheckId={quickCheck.id}
                      photos={quickCheck.photos}
                    />
                  </div>
                )}
              </div>
              {onDeleteQuickCheck && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-stone-400 hover:text-destructive opacity-0 group-hover/row:opacity-100 transition-opacity"
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteQuickCheck(quickCheck);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* photo */}
          {isPhoto && photo && (
            <div className="flex items-start gap-2">
              <Camera className="h-3.5 w-3.5 mt-0.5 text-violet-600 dark:text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap text-sm font-medium text-stone-900 dark:text-stone-100">
                  {t('common:timeline.photos', { defaultValue: 'Photo' })}
                  {renderHiveName(event)}
                </div>
                {photo.caption && (
                  <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2">
                    {photo.caption}
                  </div>
                )}
                <StandalonePhotoPreview
                  photoId={photo.id}
                  fileName={photo.fileName}
                  caption={photo.caption}
                />
              </div>
              {onDeletePhoto && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-stone-400 hover:text-destructive opacity-0 group-hover/row:opacity-100 transition-opacity"
                  onClick={e => {
                    e.stopPropagation();
                    onDeletePhoto(photo);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* document */}
          {isDocument && document && (
            <div className="flex items-start gap-2">
              <FileTextIcon className="h-3.5 w-3.5 mt-0.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap text-sm font-medium text-stone-900 dark:text-stone-100">
                  {document.title}
                  {renderHiveName(event)}
                </div>
                {document.notes && (
                  <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2">
                    {document.notes}
                  </div>
                )}
                <DocumentDownloadLink
                  documentId={document.id}
                  fileName={document.fileName}
                />
              </div>
              {onDeleteDocument && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-stone-400 hover:text-destructive opacity-0 group-hover/row:opacity-100 transition-opacity"
                  onClick={e => {
                    e.stopPropagation();
                    onDeleteDocument(document);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* action */}
          {action && (
            <div
              className={cn(
                'flex items-start gap-2',
                (action.harvestId || onActionClick) &&
                  'cursor-pointer rounded-md -mx-2 px-2 py-1 -mt-1 hover:bg-stone-100/70 dark:hover:bg-stone-800/40 transition-colors',
              )}
              onClick={
                onActionClick ? () => onActionClick(action) : undefined
              }
            >
              <span
                className={cn(
                  'mt-0.5 shrink-0',
                  tone === 'orange' &&
                    'text-orange-600 dark:text-orange-400',
                  tone === 'rose' && 'text-rose-600 dark:text-rose-400',
                  tone === 'yellow' &&
                    'text-yellow-700 dark:text-yellow-400',
                  tone === 'stone' &&
                    'text-stone-500 dark:text-stone-400',
                )}
              >
                {getActionIcon(action)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-stone-800 dark:text-stone-200">
                  {getActionLabel(action, t)}
                  {renderHiveName(event)}
                  {action.inspectionId && (
                    <Link
                      to={`/inspections/${action.inspectionId}`}
                      onClick={e => e.stopPropagation()}
                    >
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 py-0 px-1.5 ml-1 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 cursor-pointer font-normal"
                      >
                        {t('common:timeline.fromInspection')}
                      </Badge>
                    </Link>
                  )}
                </div>
                {action.notes && (
                  <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    {action.notes}
                  </div>
                )}
              </div>
              {!action.harvestId && (onEditAction || onDeleteAction) && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                  {onEditAction && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-stone-500"
                      onClick={e => {
                        e.stopPropagation();
                        onEditAction(action);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  {onDeleteAction && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-stone-500 hover:text-destructive"
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteAction(action);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
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

  const renderDayDivider = (group: DayGroup, isFirst: boolean) => {
    const parts = formatDayHeaderParts(group.date, t);
    return (
      <div
        className={cn(
          'relative grid grid-cols-[28px_1fr] gap-x-3 sm:gap-x-4',
          isFirst ? 'pb-2 pt-0' : 'pb-2 pt-3',
        )}
      >
        {/* spine continues through */}
        <div className="relative flex justify-center">
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-px border-l border-dashed border-stone-200 dark:border-stone-800"
            aria-hidden
          />
        </div>
        {/* inline label + hairline */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-overline text-stone-500 dark:text-stone-400 shrink-0 tabular-nums">
            {parts.context}
            <span className="text-stone-300 dark:text-stone-700 mx-1.5">
              ·
            </span>
            {parts.month} {parts.day}
          </span>
          <div
            className="h-px flex-1 bg-gradient-to-r from-stone-200 to-transparent dark:from-stone-800"
            aria-hidden
          />
        </div>
      </div>
    );
  };

  const groupedDays = groupEventsByDay(displayedEvents);

  if (isLoading) {
    return (
      <div className="relative">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="relative grid grid-cols-[28px_1fr] gap-x-3 sm:gap-x-4 pb-6"
          >
            <div className="relative flex justify-center pt-1.5">
              {i < 3 && (
                <div className="absolute top-0 bottom-[-24px] left-1/2 -translate-x-px w-px border-l border-dashed border-stone-200 dark:border-stone-800" />
              )}
              <div
                className="relative z-10 w-4 h-4 bg-stone-200 dark:bg-stone-800 animate-pulse"
                style={{ clipPath: HEXAGON_CLIP }}
              />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-20 mb-2 animate-pulse" />
              <div className="h-4 bg-stone-100 dark:bg-stone-900 rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filter rail */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <Select
          value={eventTypeFilter}
          onValueChange={value =>
            setEventTypeFilter(value as EventTypeFilter)
          }
        >
          <SelectTrigger
            className={pillTriggerClass(eventTypeFilter !== 'all')}
          >
            <ActivityIcon
              className={cn(
                'h-3 w-3',
                pillIconClass(eventTypeFilter !== 'all'),
              )}
            />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('common:timeline.allEvents')}
            </SelectItem>
            <SelectItem value="inspections">
              {t('common:timeline.inspections')}
            </SelectItem>
            <SelectItem value="feeding">
              {t('common:timeline.feeding')}
            </SelectItem>
            <SelectItem value="treatment">
              {t('common:timeline.treatments')}
            </SelectItem>
            <SelectItem value="harvest">
              {t('common:timeline.harvests')}
            </SelectItem>
            <SelectItem value="quick-checks">
              {t('common:quickCheck.title')}
            </SelectItem>
            <SelectItem value="photos">
              {t('common:timeline.photos', { defaultValue: 'Photos' })}
            </SelectItem>
            <SelectItem value="documents">
              {t('common:timeline.documents', {
                defaultValue: 'Documents',
              })}
            </SelectItem>
            <SelectItem value="notes">
              {t('common:timeline.notes')}
            </SelectItem>
            <SelectItem value="other">
              {t('common:timeline.other')}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={dateRangeFilter}
          onValueChange={value =>
            setDateRangeFilter(value as DateRangeFilter)
          }
        >
          <SelectTrigger
            className={pillTriggerClass(dateRangeFilter !== 'all')}
          >
            <CalendarIcon
              className={cn(
                'h-3 w-3',
                pillIconClass(dateRangeFilter !== 'all'),
              )}
            />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('common:timeline.allTime')}
            </SelectItem>
            <SelectItem value="1month">
              {t('common:timeline.lastMonth')}
            </SelectItem>
            <SelectItem value="3months">
              {t('common:timeline.last3Months')}
            </SelectItem>
            <SelectItem value="6months">
              {t('common:timeline.last6Months')}
            </SelectItem>
            <SelectItem value="year">
              {t('common:timeline.lastYear')}
            </SelectItem>
          </SelectContent>
        </Select>

        {hives && hives.length > 0 && (
          <Select value={hiveFilter} onValueChange={setHiveFilter}>
            <SelectTrigger
              className={pillTriggerClass(hiveFilter !== 'all')}
            >
              <Hexagon tone="amber" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('common:timeline.allHives')}
              </SelectItem>
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
            className="h-8 px-2 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
          >
            <X className="h-3 w-3 mr-1" />
            {t('common:timeline.clearFilters')}
          </Button>
        )}

        {headerSlot && (
          <div className="flex gap-2 ml-auto">{headerSlot}</div>
        )}
      </div>

      <div className="relative">
        {displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 px-4">
            <div
              className="w-10 h-10 mb-3 bg-stone-100 dark:bg-stone-800/60"
              style={{ clipPath: HEXAGON_CLIP }}
              aria-hidden
            />
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs">
              {hasActiveFilters
                ? t('common:timeline.noMatchingFilters')
                : (emptyMessage ?? t('common:timeline.noActivity'))}
            </p>
          </div>
        ) : (
          <>
            {groupedDays.map((group, gi) => (
              <div key={group.key}>
                {renderDayDivider(group, gi === 0)}
                {group.events.map(renderTimelineEvent)}
              </div>
            ))}

            {timelineEvents.length > maxDisplayed && (
              <div className="grid grid-cols-[28px_1fr] gap-x-3 sm:gap-x-4 pt-1 pb-2">
                <div />
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className="justify-start text-xs h-8 px-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-50 w-fit"
                >
                  {showAll
                    ? t('common:timeline.showLess')
                    : t('common:timeline.showMore', {
                        count: timelineEvents.length - maxDisplayed,
                      })}
                  <ChevronDownIcon
                    className={cn(
                      'ml-1 h-3 w-3 transition-transform',
                      showAll && 'rotate-180',
                    )}
                  />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {rescheduleDialogElement}
    </>
  );
};
