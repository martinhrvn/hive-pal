import { createContext, memo, use, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { format, subMonths, isToday, isYesterday, startOfDay } from 'date-fns';
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
  ArrowLeftRight,
  Undo2,
  Split,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  ActionType,
  QuickCheckResponse,
  PhotoResponse,
  DocumentResponse,
} from 'shared-schemas';
import { getFeedTypeLabel } from '@/utils/feed-type-label';
import { hiveStatusLabelKey } from '@/utils/status-colors';
import { Link } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScheduledInspectionActions } from '@/api/hooks/useScheduledInspectionActions';
import { cn } from '@/lib/utils';
import { StatusPill } from './status-pill';
import { PhotoGallery } from './photo-gallery';
import { StandalonePhotoPreview } from './standalone-photo-preview';
import { DocumentDownloadLink } from './document-download-link';

export type TimelineEvent = {
  id: string;
  date: string;
  type: 'inspection' | 'action' | 'note' | 'quick-check' | 'photo' | 'document';
  data:
    | InspectionResponse
    | ActionResponse
    | QuickCheckResponse
    | PhotoResponse
    | DocumentResponse;
};

/** A timeline event with values the list needs repeatedly, computed once. */
type DecoratedEvent = TimelineEvent & {
  timestamp: number;
  isOverdue: boolean;
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

/**
 * Row interactions. Each handler is optional; omitting it hides the matching
 * control (e.g. no `onDeletePhoto` → no delete button on photos).
 */
export interface TimelineEventHandlers {
  onInspectionClick?: (inspection: InspectionResponse) => void;
  onActionClick?: (action: ActionResponse) => void;
  onEditAction?: (action: ActionResponse) => void;
  onDeleteAction?: (action: ActionResponse) => void;
  /** Shown on SPLIT actions only: fully revert the split (undo endpoint). */
  onUndoSplit?: (action: ActionResponse) => void;
  onDeleteQuickCheck?: (quickCheck: QuickCheckResponse) => void;
  onDeletePhoto?: (photo: PhotoResponse) => void;
  onDeleteDocument?: (document: DocumentResponse) => void;
}

export interface TimelineEventListProps {
  inspections: InspectionResponse[];
  actions: ActionResponse[];
  quickChecks: QuickCheckResponse[];
  photos?: PhotoResponse[];
  documents?: DocumentResponse[];
  isLoading?: boolean;
  maxDisplayed?: number;
  emptyMessage?: string;
  handlers?: TimelineEventHandlers;
  getHiveName?: (hiveId: string) => string | undefined;
  /** List of hives for the hive filter dropdown. When provided, a hive select is shown. */
  hives?: Array<{ id: string; name: string }>;
  /** Extra controls rendered at the end of the filter rail. */
  children?: React.ReactNode;
}

type TimelineRowContextValue = TimelineEventHandlers & {
  getHiveName?: (hiveId: string) => string | undefined;
  onDoInspection: (inspection: InspectionResponse) => void;
  onReschedule: (inspection: InspectionResponse) => void;
};

// Shared by every row so handlers aren't threaded through props.
const TimelineRowContext = createContext<TimelineRowContextValue | null>(null);

const useTimelineRow = () => {
  const ctx = use(TimelineRowContext);
  if (!ctx)
    throw new Error('Timeline rows must render inside TimelineEventList');
  return ctx;
};

const formatTime = (date: string) => {
  return format(new Date(date), 'h:mm a');
};

const formatEntryDate = (date: string, t: TFunction): string => {
  const d = new Date(date);
  if (isToday(d)) return t('common:timeline.today');
  if (isYesterday(d)) return t('common:timeline.yesterday');
  const now = new Date();
  return format(
    d,
    d.getFullYear() === now.getFullYear() ? 'MMM d' : 'MMM d, yyyy',
  );
};

const formatDayContext = (date: Date, t: TFunction): string => {
  if (isToday(date)) return t('common:timeline.today');
  if (isYesterday(date)) return t('common:timeline.yesterday');
  return format(date, 'EEEE');
};

const HEXAGON_CLIP =
  'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';

// Categorical marker palette: each event kind keeps a recognisable hue.
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
    fill: 'bg-honey',
    ring: 'bg-honey/25',
    dot: 'bg-honey-muted',
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
    fill: 'bg-muted-foreground/60',
    ring: 'bg-muted',
    dot: 'bg-background',
  },
  red: {
    fill: 'bg-destructive',
    ring: 'bg-destructive/20',
    dot: 'bg-background',
  },
  scheduled: {
    fill: 'bg-background ring-1 ring-honey/70 ring-inset',
    ring: 'bg-honey/15',
    dot: 'bg-honey',
  },
};

const Hexagon: React.FC<{ tone: MarkerTone; pulse?: boolean }> = ({
  tone,
  pulse,
}) => {
  const cls = markerToneClasses[tone];
  return (
    <span className="relative inline-flex items-center justify-center size-4 shrink-0">
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
        className={cn('relative size-full', cls.fill)}
        style={{ clipPath: HEXAGON_CLIP }}
        aria-hidden
      />
      <span
        className={cn('absolute size-1 rounded-full', cls.dot)}
        aria-hidden
      />
    </span>
  );
};

const pillTriggerClass = (active: boolean) =>
  cn(
    'h-8 w-auto rounded-full border bg-background/70 backdrop-blur-sm gap-1.5 px-2.5 text-xs font-medium transition-colors focus:ring-ring/40',
    active
      ? 'border-honey/80 text-foreground ring-1 ring-honey/20'
      : 'text-foreground/80 hover:border-ring/60',
  );

const pillIconClass = (active: boolean) =>
  cn(
    'size-3 shrink-0',
    active ? 'text-honey-foreground' : 'text-muted-foreground',
  );

// Revealed on row hover / keyboard focus; always visible on touch screens,
// which have no hover.
const rowActionClass =
  'size-6 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100';

const getActionIcon = (action: ActionResponse) => {
  switch (action.type) {
    case 'FEEDING':
      return <Droplet />;
    case 'TREATMENT':
      return <Pill />;
    case 'FRAME':
      return <Frame />;
    case 'HARVEST':
      return <Package />;
    case 'NOTE':
      return <StickyNote />;
    case 'MAINTENANCE':
      return <Wrench />;
    case 'STATUS_CHANGE':
      return <ArrowLeftRight />;
    case 'SPLIT':
      return <Split />;
    default:
      return <ActivityIcon />;
  }
};

const getActionLabel = (action: ActionResponse, t: TFunction): string => {
  const details = action.details;
  switch (action.type) {
    case 'FEEDING': {
      if (details?.type !== 'FEEDING') {
        return t('common:timeline.actionLabel.feeding');
      }
      const amount =
        details.enteredAmount != null && details.enteredUnit
          ? `${details.enteredAmount} ${details.enteredUnit === 'l' ? 'L' : details.enteredUnit}`
          : `${details.amount} ${details.unit}`;
      let extra = '';
      if (details.sugarG != null) {
        extra = t('common:timeline.actionLabel.sugarEquivalent', {
          kg: Math.round(details.sugarG / 10) / 100,
        });
      } else if (details.concentration) {
        extra = ` (${details.concentration})`;
      }
      return t('common:timeline.actionLabel.fed', {
        amount,
        feed: getFeedTypeLabel(details.feedType),
        extra,
      });
    }
    case 'TREATMENT':
      return details?.type === 'TREATMENT'
        ? t('common:timeline.actionLabel.treatedWith', {
            product: details.product,
            quantity: details.quantity,
            unit: details.unit,
          })
        : t('common:timeline.actionLabel.treatment');
    case 'FRAME':
      return details?.type === 'FRAME'
        ? t('common:timeline.actionLabel.addedFrames', {
            count: details.quantity,
          })
        : t('common:timeline.actionLabel.frameManagement');
    case 'HARVEST':
      return details?.type === 'HARVEST'
        ? t('common:timeline.actionLabel.harvested', {
            amount: details.amount,
            unit: details.unit,
          })
        : t('common:timeline.actionLabel.harvest');
    case 'NOTE':
      return t('common:timeline.actionLabel.note');
    case 'STATUS_CHANGE': {
      if (details?.type !== 'STATUS_CHANGE') {
        return t('common:timeline.actionLabel.statusChange');
      }
      const to = t(`hive:${hiveStatusLabelKey(details.toStatus)}`);
      return details.fromStatus
        ? t('common:timeline.actionLabel.statusChangedFromTo', {
            from: t(`hive:${hiveStatusLabelKey(details.fromStatus)}`),
            to,
          })
        : t('common:timeline.actionLabel.statusChangedTo', { to });
    }
    case 'SPLIT':
      if (details?.type !== 'SPLIT') {
        return t('common:timeline.actionLabel.split');
      }
      return details.role === 'SOURCE'
        ? t('common:timeline.actionLabel.splitSource', {
            count: details.framesMoved,
          })
        : t('common:timeline.actionLabel.splitTarget', {
            count: details.framesMoved,
          });
    case 'BOX_CONFIGURATION':
      return t('common:timeline.boxConfiguration');
    case 'MAINTENANCE': {
      if (details?.type !== 'MAINTENANCE') {
        return t('common:timeline.maintenance');
      }
      const component = details.component.replace('_', ' ').toLowerCase();
      return details.status.toLowerCase() === 'cleaned'
        ? t('common:timeline.actionLabel.cleaned', { component })
        : t('common:timeline.actionLabel.replaced', { component });
    }
    default:
      return action.type;
  }
};

const getEventTone = (event: DecoratedEvent): MarkerTone => {
  if (event.type === 'inspection') {
    const ins = event.data as InspectionResponse;
    if (ins.status === InspectionStatus.SCHEDULED) {
      return event.isOverdue ? 'red' : 'scheduled';
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
      case 'STATUS_CHANGE':
        return 'sky';
      default:
        return 'stone';
    }
  }
  return 'stone';
};

const actionIconTone: Partial<Record<MarkerTone, string>> = {
  orange: 'text-orange-600 dark:text-orange-400',
  rose: 'text-rose-600 dark:text-rose-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  sky: 'text-sky-600 dark:text-sky-400',
  stone: 'text-muted-foreground',
};

type DayGroup = {
  key: string;
  date: Date;
  events: DecoratedEvent[];
};

const groupEventsByDay = (events: DecoratedEvent[]): DayGroup[] => {
  const map = new Map<string, DayGroup>();
  for (const event of events) {
    const date = startOfDay(event.timestamp);
    const key = format(date, 'yyyy-MM-dd');
    let group = map.get(key);
    if (!group) {
      group = { key, date, events: [] };
      map.set(key, group);
    }
    group.events.push(event);
  }
  return Array.from(map.values());
};

const matchesActionFilter = (
  filter: EventTypeFilter,
  type: ActionResponse['type'],
) => {
  switch (filter) {
    case 'all':
      return true;
    case 'feeding':
      return type === 'FEEDING';
    case 'treatment':
      return type === 'TREATMENT';
    case 'harvest':
      return type === 'HARVEST';
    case 'notes':
      return type === 'NOTE';
    case 'other':
      return (
        type === 'FRAME' ||
        type === 'OTHER' ||
        type === 'BOX_CONFIGURATION' ||
        type === 'MAINTENANCE'
      );
    default:
      return false;
  }
};

const rangeStartDate = (range: DateRangeFilter): Date | null => {
  const months = { '1month': 1, '3months': 3, '6months': 6, year: 12 } as const;
  return range === 'all' ? null : subMonths(new Date(), months[range]);
};

const HiveBadge: React.FC<{ data: TimelineEvent['data'] }> = ({ data }) => {
  const { getHiveName } = useTimelineRow();
  const hiveId = 'hiveId' in data ? (data.hiveId as string) : undefined;
  const name = hiveId ? getHiveName?.(hiveId) : undefined;
  if (!name) return null;
  return (
    <Badge variant="outline" className="text-xs py-0 ml-1">
      {name}
    </Badge>
  );
};

const DeleteRowButton: React.FC<{ onDelete: () => void }> = ({ onDelete }) => {
  const { t } = useTranslation('common');
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('actions.delete')}
      className={cn(rowActionClass, 'hover:text-destructive')}
      onClick={e => {
        e.stopPropagation();
        onDelete();
      }}
    >
      <Trash2 className="size-3" />
    </Button>
  );
};

const InspectionEntry: React.FC<{ event: DecoratedEvent }> = ({ event }) => {
  const { t } = useTranslation('common');
  const { getHiveName, onInspectionClick, onDoInspection, onReschedule } =
    useTimelineRow();
  const inspection = event.data as InspectionResponse;
  const isScheduled = inspection.status === InspectionStatus.SCHEDULED;
  const isCancelled = inspection.status === InspectionStatus.CANCELLED;
  const { isOverdue } = event;
  const clickable = !!onInspectionClick && !isScheduled;

  return (
    <div
      className={cn(
        'rounded-md -mx-2 px-2 py-1.5 transition-colors',
        clickable && 'cursor-pointer',
        isOverdue
          ? 'bg-destructive/5 hover:bg-destructive/10 ring-1 ring-inset ring-destructive/20'
          : !isScheduled && 'hover:bg-accent/70',
      )}
      onClick={clickable ? () => onInspectionClick(inspection) : undefined}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isOverdue ? (
              <AlertCircle className="size-3.5 text-destructive-foreground shrink-0" />
            ) : (
              <CalendarIcon
                className={cn(
                  'size-3.5 shrink-0',
                  isScheduled ? 'text-honey' : 'text-muted-foreground',
                )}
              />
            )}
            <span className="font-medium text-sm text-foreground">
              {isScheduled
                ? t('common:timeline.inspectHive', {
                    hiveName: getHiveName?.(inspection.hiveId) ?? '',
                  })
                : t('common:timeline.inspection')}
            </span>
            {!isScheduled && <HiveBadge data={inspection} />}
            {isOverdue && (
              <StatusPill tone="danger" size="sm">
                {t('common:timeline.overdue')}
              </StatusPill>
            )}
            {isScheduled && !isOverdue && (
              <StatusPill tone="warning" size="sm">
                {t('common:timeline.scheduled')}
              </StatusPill>
            )}
            {isCancelled && (
              <StatusPill size="sm">
                {t('common:timeline.cancelled')}
              </StatusPill>
            )}
          </div>

          {!isScheduled && !isCancelled && inspection.observations && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap tabular-nums">
              {inspection.observations.strength !== null && (
                <StatusPill size="sm">
                  <ActivityIcon />
                  {t('common:timeline.strength')}:{' '}
                  {inspection.observations.strength}
                </StatusPill>
              )}
              {inspection.observations.honeyStores !== null && (
                <StatusPill tone="warning" size="sm">
                  <DropletsIcon />
                  {t('common:timeline.honey')}:{' '}
                  {inspection.observations.honeyStores}
                </StatusPill>
              )}
              {inspection.observations.queenSeen !== null && (
                <StatusPill
                  tone={
                    inspection.observations.queenSeen ? 'warning' : 'neutral'
                  }
                  size="sm"
                >
                  <Crown />
                  {inspection.observations.queenSeen
                    ? t('common:timeline.queenSeen')
                    : t('common:timeline.queenNotSeen')}
                </StatusPill>
              )}
            </div>
          )}

          {inspection.notes && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <FileTextIcon className="size-3" />
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
                className="size-7 shrink-0 opacity-60 hover:opacity-100"
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className="size-4" />
                <span className="sr-only">
                  {t('common:actions.openMenu', 'Open menu')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  onDoInspection(inspection);
                }}
              >
                <CheckCircle className="size-4 mr-2" />
                {t('common:timeline.doInspection')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  onReschedule(inspection);
                }}
              >
                <CalendarIcon className="size-4 mr-2" />
                {t('common:timeline.reschedule')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

const QuickCheckEntry: React.FC<{ quickCheck: QuickCheckResponse }> = ({
  quickCheck,
}) => {
  const { t } = useTranslation('common');
  const { onDeleteQuickCheck } = useTimelineRow();
  return (
    <div className="flex items-start gap-2">
      <ClipboardCheck className="size-3.5 mt-0.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap text-sm font-medium text-foreground">
          {t('common:quickCheck.title')}
          <HiveBadge data={quickCheck} />
        </div>
        {quickCheck.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {quickCheck.tags.map(tag => (
              <StatusPill key={tag} tone="success" size="sm">
                {tag.replace(/_/g, ' ')}
              </StatusPill>
            ))}
          </div>
        )}
        {quickCheck.note && (
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
        <DeleteRowButton onDelete={() => onDeleteQuickCheck(quickCheck)} />
      )}
    </div>
  );
};

const PhotoEntry: React.FC<{ photo: PhotoResponse }> = ({ photo }) => {
  const { t } = useTranslation('common');
  const { onDeletePhoto } = useTimelineRow();
  return (
    <div className="flex items-start gap-2">
      <Camera className="size-3.5 mt-0.5 text-violet-600 dark:text-violet-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap text-sm font-medium text-foreground">
          {t('common:timeline.photos', { defaultValue: 'Photo' })}
          <HiveBadge data={photo} />
        </div>
        {photo.caption && (
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
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
        <DeleteRowButton onDelete={() => onDeletePhoto(photo)} />
      )}
    </div>
  );
};

const DocumentEntry: React.FC<{ document: DocumentResponse }> = ({
  document,
}) => {
  const { onDeleteDocument } = useTimelineRow();
  return (
    <div className="flex items-start gap-2">
      <FileTextIcon className="size-3.5 mt-0.5 text-sky-600 dark:text-sky-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap text-sm font-medium text-foreground">
          {document.title}
          <HiveBadge data={document} />
        </div>
        {document.notes && (
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {document.notes}
          </div>
        )}
        <DocumentDownloadLink
          documentId={document.id}
          fileName={document.fileName}
        />
      </div>
      {onDeleteDocument && (
        <DeleteRowButton onDelete={() => onDeleteDocument(document)} />
      )}
    </div>
  );
};

const ActionEntry: React.FC<{ action: ActionResponse; tone: MarkerTone }> = ({
  action,
  tone,
}) => {
  const { t } = useTranslation(['common', 'hive']);
  const { onActionClick, onEditAction, onDeleteAction, onUndoSplit } =
    useTimelineRow();
  const clickable = !!(action.harvestId || onActionClick);

  return (
    <div
      className={cn(
        'flex items-start gap-2',
        clickable &&
          'cursor-pointer rounded-md -mx-2 px-2 py-1 -mt-1 hover:bg-accent/70 transition-colors',
      )}
      onClick={onActionClick ? () => onActionClick(action) : undefined}
    >
      <span
        className={cn('mt-0.5 shrink-0 [&>svg]:size-4', actionIconTone[tone])}
      >
        {getActionIcon(action)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground/90">
          {getActionLabel(action, t)}
          <HiveBadge data={action} />
          {action.inspectionId && (
            <StatusPill tone="warning" size="sm" asChild>
              <Link
                to={`/inspections/${action.inspectionId}`}
                onClick={e => e.stopPropagation()}
                className="ml-1 align-middle font-normal"
              >
                {t('common:timeline.fromInspection')}
              </Link>
            </StatusPill>
          )}
        </div>
        {action.notes && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {action.notes}
          </div>
        )}
      </div>
      {!action.harvestId && (onEditAction || onDeleteAction) && (
        <div className="flex items-center gap-0.5">
          {onUndoSplit && action.type === ActionType.SPLIT && (
            <Button
              variant="ghost"
              size="icon"
              className={rowActionClass}
              title={t('common:timeline.undoSplit', 'Undo split')}
              aria-label={t('common:timeline.undoSplit', 'Undo split')}
              onClick={e => {
                e.stopPropagation();
                onUndoSplit(action);
              }}
            >
              <Undo2 className="size-3" />
            </Button>
          )}
          {onEditAction && (
            <Button
              variant="ghost"
              size="icon"
              className={rowActionClass}
              aria-label={t('common:actions.edit')}
              onClick={e => {
                e.stopPropagation();
                onEditAction(action);
              }}
            >
              <Pencil className="size-3" />
            </Button>
          )}
          {onDeleteAction && (
            <DeleteRowButton onDelete={() => onDeleteAction(action)} />
          )}
        </div>
      )}
    </div>
  );
};

const TimelineEventRow = memo(function TimelineEventRow({
  event,
}: {
  event: DecoratedEvent;
}) {
  const { t } = useTranslation('common');
  const tone = getEventTone(event);
  const data = event.data;
  const createdByUserName =
    'createdByUserName' in data ? data.createdByUserName : undefined;

  let entry: React.ReactNode;
  switch (event.type) {
    case 'inspection':
      entry = <InspectionEntry event={event} />;
      break;
    case 'quick-check':
      entry = <QuickCheckEntry quickCheck={data as QuickCheckResponse} />;
      break;
    case 'photo':
      entry = <PhotoEntry photo={data as PhotoResponse} />;
      break;
    case 'document':
      entry = <DocumentEntry document={data as DocumentResponse} />;
      break;
    default:
      entry = <ActionEntry action={data as ActionResponse} tone={tone} />;
  }

  return (
    <div className="relative grid grid-cols-[28px_1fr] gap-x-3 sm:gap-x-4 pb-4 group/row">
      {/* honeycomb marker + spine segment */}
      <div className="relative flex justify-center pt-1.5">
        <div
          className="absolute top-0 bottom-[-16px] left-1/2 -translate-x-px w-px border-l border-dashed"
          aria-hidden
        />
        <div className="relative z-10 bg-background p-0.5 rounded-full">
          <Hexagon tone={tone} pulse={event.isOverdue} />
        </div>
      </div>

      <div className="min-w-0 pt-0.5">
        {/* date + time + author */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-overline tabular-nums text-muted-foreground">
            {formatEntryDate(event.date, t)}
            <span className="text-muted-foreground/50 mx-1.5">·</span>
            <span className="text-muted-foreground/80">
              {formatTime(event.date)}
            </span>
          </span>
          {createdByUserName && (
            <>
              <span className="text-muted-foreground/50" aria-hidden>
                ·
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {createdByUserName}
              </span>
            </>
          )}
        </div>
        {entry}
      </div>
    </div>
  );
});

const DayDivider: React.FC<{ date: Date; isFirst: boolean }> = ({
  date,
  isFirst,
}) => {
  const { t, i18n } = useTranslation('common');
  const shortDate = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
  }).format(date);
  return (
    <div
      className={cn(
        'sticky top-0 z-20 grid grid-cols-[28px_1fr] gap-x-3 sm:gap-x-4 bg-background/80 backdrop-blur-md',
        isFirst ? 'pb-2 pt-1' : 'pb-2 pt-3',
      )}
    >
      <div aria-hidden />
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="font-overline text-muted-foreground shrink-0 tabular-nums">
          {formatDayContext(date, t)}
          <span className="text-muted-foreground/50 mx-1.5">·</span>
          {shortDate}
        </span>
        <div
          className="h-px flex-1 bg-gradient-to-r from-border to-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
};

const TimelineSkeleton = () => (
  <div className="relative" aria-busy="true">
    {[1, 2, 3].map(i => (
      <div
        key={i}
        className="relative grid grid-cols-[28px_1fr] gap-x-3 sm:gap-x-4 pb-6"
      >
        <div className="relative flex justify-center pt-1.5">
          {i < 3 && (
            <div className="absolute top-0 bottom-[-24px] left-1/2 -translate-x-px w-px border-l border-dashed" />
          )}
          <Skeleton
            className="relative z-10 size-4 rounded-none"
            style={{ clipPath: HEXAGON_CLIP }}
          />
        </div>
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

export const TimelineEventList: React.FC<TimelineEventListProps> = ({
  inspections,
  actions,
  quickChecks,
  photos,
  documents,
  isLoading,
  maxDisplayed = 10,
  emptyMessage,
  handlers,
  getHiveName,
  hives,
  children,
}) => {
  const { t } = useTranslation('common');
  const [showAll, setShowAll] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] =
    useState<EventTypeFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>('all');
  const [hiveFilter, setHiveFilter] = useState<string>('all');

  const {
    setReschedulingInspection,
    handleDoInspection,
    rescheduleDialogElement,
  } = useScheduledInspectionActions(hiveId =>
    getHiveName ? (getHiveName(hiveId) ?? hiveId) : hiveId,
  );

  const rowContext = useMemo<TimelineRowContextValue>(
    () => ({
      ...handlers,
      getHiveName,
      onDoInspection: handleDoInspection,
      onReschedule: setReschedulingInspection,
    }),
    [handlers, getHiveName, handleDoInspection, setReschedulingInspection],
  );

  const timelineEvents = useMemo(() => {
    const startTime = rangeStartDate(dateRangeFilter)?.getTime() ?? null;
    const now = Date.now();
    const events: DecoratedEvent[] = [];

    // Parse each date once; sorting and grouping reuse the timestamp.
    const add = (
      id: string,
      date: string,
      type: TimelineEvent['type'],
      data: TimelineEvent['data'],
      isOverdue = false,
    ) => {
      const timestamp = new Date(date).getTime();
      if (startTime !== null && timestamp < startTime) return;
      if (
        hiveFilter !== 'all' &&
        !('hiveId' in data && data.hiveId === hiveFilter)
      ) {
        return;
      }
      events.push({ id, date, type, data, timestamp, isOverdue });
    };

    if (eventTypeFilter === 'all' || eventTypeFilter === 'inspections') {
      for (const inspection of inspections) {
        const isScheduled = inspection.status === InspectionStatus.SCHEDULED;
        const timestamp = new Date(inspection.date).getTime();
        add(
          `inspection-${inspection.id}`,
          inspection.date,
          'inspection',
          inspection,
          isScheduled && timestamp < now,
        );
      }
    }

    for (const action of actions) {
      if (matchesActionFilter(eventTypeFilter, action.type)) {
        add(`action-${action.id}`, action.date, 'action', action);
      }
    }

    if (eventTypeFilter === 'all' || eventTypeFilter === 'quick-checks') {
      for (const quickCheck of quickChecks) {
        add(
          `quick-check-${quickCheck.id}`,
          quickCheck.date,
          'quick-check',
          quickCheck,
        );
      }
    }

    if (photos && (eventTypeFilter === 'all' || eventTypeFilter === 'photos')) {
      for (const photo of photos) {
        add(`photo-${photo.id}`, photo.date, 'photo', photo);
      }
    }

    if (
      documents &&
      (eventTypeFilter === 'all' || eventTypeFilter === 'documents')
    ) {
      for (const document of documents) {
        add(`document-${document.id}`, document.date, 'document', document);
      }
    }

    // Overdue inspections first, then newest first.
    return events.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return b.timestamp - a.timestamp;
    });
  }, [
    inspections,
    actions,
    quickChecks,
    photos,
    documents,
    eventTypeFilter,
    dateRangeFilter,
    hiveFilter,
  ]);

  const displayedEvents = useMemo(
    () => (showAll ? timelineEvents : timelineEvents.slice(0, maxDisplayed)),
    [showAll, timelineEvents, maxDisplayed],
  );
  const groupedDays = useMemo(
    () => groupEventsByDay(displayedEvents),
    [displayedEvents],
  );

  const hasActiveFilters =
    eventTypeFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    hiveFilter !== 'all';

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  return (
    <TimelineRowContext value={rowContext}>
      {/* Filter rail */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <Select
          value={eventTypeFilter}
          onValueChange={value => setEventTypeFilter(value as EventTypeFilter)}
        >
          <SelectTrigger
            className={pillTriggerClass(eventTypeFilter !== 'all')}
          >
            <ActivityIcon
              className={pillIconClass(eventTypeFilter !== 'all')}
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
            <SelectItem value="notes">{t('common:timeline.notes')}</SelectItem>
            <SelectItem value="other">{t('common:timeline.other')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={dateRangeFilter}
          onValueChange={value => setDateRangeFilter(value as DateRangeFilter)}
        >
          <SelectTrigger
            className={pillTriggerClass(dateRangeFilter !== 'all')}
          >
            <CalendarIcon
              className={pillIconClass(dateRangeFilter !== 'all')}
            />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common:timeline.allTime')}</SelectItem>
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
            <SelectTrigger className={pillTriggerClass(hiveFilter !== 'all')}>
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
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
            {t('common:timeline.clearFilters')}
          </Button>
        )}

        {children && <div className="flex gap-2 ml-auto">{children}</div>}
      </div>

      <div className="relative">
        {displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 px-4 rounded-xl border border-dashed">
            <div
              className="size-10 mb-3 bg-honey-muted"
              style={{ clipPath: HEXAGON_CLIP }}
              aria-hidden
            />
            <p className="text-sm text-muted-foreground max-w-xs">
              {hasActiveFilters
                ? t('common:timeline.noMatchingFilters')
                : (emptyMessage ?? t('common:timeline.noActivity'))}
            </p>
          </div>
        ) : (
          <>
            {groupedDays.map((group, gi) => (
              <div key={group.key}>
                <DayDivider date={group.date} isFirst={gi === 0} />
                {group.events.map(event => (
                  <TimelineEventRow key={event.id} event={event} />
                ))}
              </div>
            ))}

            {timelineEvents.length > maxDisplayed && (
              <div className="grid grid-cols-[28px_1fr] gap-x-3 sm:gap-x-4 pt-1 pb-2">
                <div />
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className="justify-start text-xs h-8 px-2 text-muted-foreground hover:text-foreground w-fit"
                >
                  {showAll
                    ? t('common:timeline.showLess')
                    : t('common:timeline.showMore', {
                        count: timelineEvents.length - maxDisplayed,
                      })}
                  <ChevronDownIcon
                    className={cn(
                      'size-3 transition-transform',
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
    </TimelineRowContext>
  );
};
