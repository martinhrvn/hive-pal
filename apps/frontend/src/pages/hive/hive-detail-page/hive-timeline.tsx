import { useState, useMemo, useRef } from 'react';
import { format, formatDistanceToNow, subMonths } from 'date-fns';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  CreateStandaloneAction,
  ActionType,
} from 'shared-schemas';
import { useActions, useInspections, useCreateAction } from '@/api/hooks';
import { toast } from 'sonner';
import { Section } from '@/components/common/section';
import { cn } from '@/lib/utils';
import { AddActionDialog } from './actions/add-action-dialog';

type TimelineEvent = {
  id: string;
  date: string;
  type: 'inspection' | 'action' | 'note';
  data: InspectionResponse | ActionResponse;
};

interface HiveTimelineProps {
  hiveId: string | undefined;
}

type EventTypeFilter =
  | 'all'
  | 'inspections'
  | 'feeding'
  | 'treatment'
  | 'harvest'
  | 'notes'
  | 'other';
type DateRangeFilter = 'all' | '1month' | '3months' | '6months' | 'year';

export const HiveTimeline: React.FC<HiveTimelineProps> = ({ hiveId }) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] =
    useState<EventTypeFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] =
    useState<DateRangeFilter>('all');
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const createAction = useCreateAction();
  const MAX_DISPLAYED = 10;

  // Fetch inspections and actions
  const { data: inspections, isLoading: inspectionsLoading } = useInspections(
    hiveId ? { hiveId } : undefined,
  );

  const { data: actions, isLoading: actionsLoading } = useActions(
    hiveId ? { hiveId } : undefined,
    { enabled: !!hiveId },
  );

  // Combine all events into a unified timeline with filtering
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    const now = new Date();

    // Calculate date range
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

    // Add inspections to timeline
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

    // Add standalone actions to timeline (not tied to inspections)
    if (actions) {
      actions
        .filter(action => !action.inspectionId)
        .forEach(action => {
          const eventDate = new Date(action.date);
          if (!startDate || eventDate >= startDate) {
            // Filter by action type
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

    // Sort by date (newest first)
    return events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [inspections, actions, eventTypeFilter, dateRangeFilter]);

  const displayedEvents = showAll
    ? timelineEvents
    : timelineEvents.slice(0, MAX_DISPLAYED);

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

  const getActionLabel = (action: ActionResponse) => {
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
        if (action.details?.type === 'NOTE') {
          return 'Note';
        }
        return 'Note';
      case 'BOX_CONFIGURATION':
        return 'Box configuration';
      default:
        return action.type;
    }
  };

  const renderTimelineEvent = (
    event: TimelineEvent,
    _index: number,
    isLast: boolean,
  ) => {
    const isInspection = event.type === 'inspection';
    const inspection = isInspection ? (event.data as InspectionResponse) : null;
    const action = !isInspection ? (event.data as ActionResponse) : null;

    const isScheduled = inspection?.status === InspectionStatus.SCHEDULED;
    const isCancelled = inspection?.status === InspectionStatus.CANCELLED;

    return (
      <div key={event.id} className="flex gap-4 pb-8 relative">
        {/* Timeline line and dot */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'w-3 h-3 rounded-full border-2 bg-background z-10',
              isInspection ? 'border-blue-500' : 'border-gray-400',
              isScheduled && 'border-amber-500',
              isCancelled && 'border-gray-300',
            )}
          >
            {isInspection && (
              <CircleIcon className="w-2 h-2 -mt-0.5 -ml-0.5 fill-current text-blue-500" />
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
              className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -ml-2 transition-colors"
              onClick={() => navigate(`/inspections/${inspection.id}`)}
            >
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">Inspection</span>
                {isScheduled && (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-600 text-xs"
                  >
                    Scheduled
                  </Badge>
                )}
                {isCancelled && (
                  <Badge
                    variant="outline"
                    className="text-gray-500 border-gray-300 text-xs"
                  >
                    Cancelled
                  </Badge>
                )}
              </div>

              {!isScheduled && !isCancelled && inspection.observations && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  {inspection.observations.strength !== null && (
                    <span className="flex items-center gap-1">
                      <ActivityIcon className="h-3 w-3" />
                      Strength: {inspection.observations.strength}
                    </span>
                  )}
                  {inspection.observations.honeyStores !== null && (
                    <span className="flex items-center gap-1">
                      <DropletsIcon className="h-3 w-3" />
                      Honey: {inspection.observations.honeyStores}
                    </span>
                  )}
                  {inspection.observations.queenSeen !== null && (
                    <span className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Queen{' '}
                      {inspection.observations.queenSeen ? 'seen' : 'not seen'}
                    </span>
                  )}
                </div>
              )}

              {inspection.notes && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <FileTextIcon className="h-3 w-3" />
                  <span>Notes available</span>
                </div>
              )}
            </div>
          )}

          {/* Action content */}
          {action && (
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{getActionIcon(action)}</div>
              <div className="flex-1">
                <div className="text-sm">{getActionLabel(action)}</div>
                {action.notes && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {action.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!hiveId) return null;

  if (inspectionsLoading || actionsLoading) {
    return (
      <Section title="Activity Timeline">
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
      </Section>
    );
  }

  const hasActiveFilters =
    eventTypeFilter !== 'all' || dateRangeFilter !== 'all';

  const handleSaveNote = async () => {
    if (!hiveId || !noteContent.trim()) return;

    setIsSavingNote(true);
    try {
      const noteAction: CreateStandaloneAction = {
        hiveId,
        type: ActionType.NOTE,
        notes: noteContent.trim(),
        details: { type: ActionType.NOTE, content: noteContent.trim() },
        date: new Date().toISOString(),
      };

      await createAction.mutateAsync(noteAction);
      setNoteContent('');
      toast.success('Note added successfully');

      // Reset textarea height
      if (noteTextareaRef.current) {
        noteTextareaRef.current.style.height = 'auto';
      }
    } catch {
      toast.error('Failed to add note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  return (
    <Section title="Activity Timeline">
      {/* Quick Note Input */}
      <div className="mb-4 space-y-2">
        <Textarea
          ref={noteTextareaRef}
          value={noteContent}
          onChange={handleTextareaChange}
          placeholder="Add a quick note about this hive..."
          className="min-h-[80px] resize-none"
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {noteContent.length}/500 characters
          </span>
          <div className="flex gap-2">
            <Button
              onClick={handleSaveNote}
              disabled={!noteContent.trim() || isSavingNote}
              size="sm"
            >
              <StickyNote className="mr-2 h-4 w-4" />
              {isSavingNote ? 'Saving...' : 'Add Note'}
            </Button>
            {hiveId && <AddActionDialog hiveId={hiveId} />}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Select
          value={eventTypeFilter}
          onValueChange={value => setEventTypeFilter(value as EventTypeFilter)}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-3 w-3 mr-2" />
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="inspections">Inspections</SelectItem>
            <SelectItem value="feeding">Feeding</SelectItem>
            <SelectItem value="treatment">Treatments</SelectItem>
            <SelectItem value="harvest">Harvests</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="1month">Last month</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEventTypeFilter('all');
              setDateRangeFilter('all');
            }}
            className="h-9 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="relative">
        {displayedEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {hasActiveFilters
              ? 'No events match the selected filters'
              : 'No activity recorded for this hive yet'}
          </div>
        ) : (
          <>
            {displayedEvents.map((event, index) =>
              renderTimelineEvent(
                event,
                index,
                index === displayedEvents.length - 1,
              ),
            )}

            {timelineEvents.length > MAX_DISPLAYED && (
              <div className="pl-7 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs h-7 px-2"
                >
                  {showAll
                    ? 'Show less'
                    : `Show ${timelineEvents.length - MAX_DISPLAYED} more`}
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
    </Section>
  );
};
