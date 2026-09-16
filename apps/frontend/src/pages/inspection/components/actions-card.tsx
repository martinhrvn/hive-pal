import { useTranslation } from 'react-i18next';
import {
  ArrowLeftRight,
  Box,
  ClipboardCheck,
  Droplet,
  Grid,
  MessageSquare,
  Pill,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InspectionSection } from './inspection-section';

import {
  ActionResponse,
  ActionType,
  BoxConfigurationActionDetails,
  FeedingActionDetails,
  FrameActionDetails,
  MaintenanceActionDetails,
  NoteActionDetails,
  StatusChangeActionDetails,
  TreatmentActionDetails,
} from 'shared-schemas';
import { cn } from '@/lib/utils';

// ─── Icon palette per action type ─────────────────────────────────────────────

const ACTION_VISUAL: Record<
  ActionType,
  { Icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  [ActionType.FEEDING]: {
    Icon: Droplet,
    tone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  },
  [ActionType.TREATMENT]: {
    Icon: Pill,
    tone: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  },
  [ActionType.FRAME]: {
    Icon: Grid,
    tone: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  [ActionType.BOX_CONFIGURATION]: {
    Icon: Box,
    tone: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  },
  [ActionType.MAINTENANCE]: {
    Icon: Wrench,
    tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  [ActionType.NOTE]: {
    Icon: MessageSquare,
    tone: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  },
  [ActionType.STATUS_CHANGE]: {
    Icon: ArrowLeftRight,
    tone: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  },
  [ActionType.HARVEST]: {
    Icon: ClipboardCheck,
    tone: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
  },
  [ActionType.OTHER]: {
    Icon: ClipboardCheck,
    tone: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  },
};

// ─── Detail renderers ─────────────────────────────────────────────────────────

const FeedingDetails = ({ details }: { details: FeedingActionDetails }) => (
  <div className="flex gap-2 flex-wrap items-center">
    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-normal">
      {details.feedType}
    </Badge>
    <span className="font-medium tabular-nums">
      {details.amount} {details.unit}
    </span>
    {details.concentration && (
      <span className="text-stone-500 dark:text-stone-400">
        · {details.concentration}
      </span>
    )}
  </div>
);

const TreatmentDetails = ({ details }: { details: TreatmentActionDetails }) => (
  <div className="flex gap-2 flex-wrap items-center">
    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 font-normal">
      {details.product}
    </Badge>
    {details.quantity != null && (
      <span className="font-medium tabular-nums">
        {details.quantity} {details.unit}
      </span>
    )}
    {details.duration && (
      <span className="text-stone-500 dark:text-stone-400">
        · {details.duration}
      </span>
    )}
  </div>
);

const FrameDetails = ({ details }: { details: FrameActionDetails }) => {
  const q = details.quantity;
  return (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-normal tabular-nums">
      {q > 0 ? `+${q}` : q} frames
    </Badge>
  );
};

const BOX_TYPE_LABEL: Record<string, string> = {
  BROOD: 'Brood box',
  HONEY: 'Honey super',
  FEEDER: 'Feeder',
};

const BoxConfigurationDetails = ({
  details,
}: {
  details: BoxConfigurationActionDetails;
}) => {
  const changes: string[] = [];
  if (details.boxesAdded > 0)
    changes.push(
      `+${details.boxesAdded} box${details.boxesAdded === 1 ? '' : 'es'}`,
    );
  if (details.boxesRemoved > 0)
    changes.push(
      `-${details.boxesRemoved} box${details.boxesRemoved === 1 ? '' : 'es'}`,
    );
  if (details.framesAdded > 0)
    changes.push(
      `+${details.framesAdded} frame${details.framesAdded === 1 ? '' : 's'}`,
    );
  if (details.framesRemoved > 0)
    changes.push(
      `-${details.framesRemoved} frame${details.framesRemoved === 1 ? '' : 's'}`,
    );

  type BoxSummary = { type: string; frameCount: number };
  const boxes: BoxSummary[] = details.boxes ?? [];
  const grouped = boxes.reduce<
    Record<string, { count: number; frames: number[] }>
  >((acc, box) => {
    const key = box.type;
    if (!acc[key]) acc[key] = { count: 0, frames: [] };
    acc[key].count += 1;
    acc[key].frames.push(box.frameCount);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {changes.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {changes.map((c) => (
            <Badge
              key={c}
              className="bg-stone-100 text-stone-800 hover:bg-stone-200 font-normal tabular-nums"
            >
              {c}
            </Badge>
          ))}
        </div>
      )}
      {boxes.length > 0 ? (
        <div className="space-y-0.5">
          <p className="font-overline text-stone-500 dark:text-stone-400">
            Result
          </p>
          {Object.entries(grouped).map(([type, { count, frames }]) => {
            const label = BOX_TYPE_LABEL[type] ?? type;
            const plural = count === 1 ? '' : 's';
            const isFramed = type !== 'FEEDER';
            let frameSummary: string | null;
            if (!isFramed) {
              frameSummary = null;
            } else if (frames.every((f) => f === frames[0])) {
              frameSummary = `${frames[0]} frames`;
            } else {
              frameSummary = `${frames.join(', ')} frames`;
            }
            return (
              <p key={type} className="text-sm">
                <span className="font-medium tabular-nums">{count}</span>{' '}
                {label}
                {plural}
                {frameSummary && (
                  <span className="text-stone-500 dark:text-stone-400">
                    {' '}
                    · {frameSummary}
                  </span>
                )}
              </p>
            );
          })}
        </div>
      ) : (
        changes.length === 0 && (
          <span className="text-sm italic text-stone-500 dark:text-stone-400">
            No changes
          </span>
        )
      )}
    </div>
  );
};

const MaintenanceDetails = ({
  details,
}: {
  details: MaintenanceActionDetails;
}) => {
  const componentLabel: Record<string, string> = {
    BOX: 'Box',
    BOTTOM_BOARD: 'Bottom Board',
    COVER: 'Cover',
  };
  const statusLabel: Record<string, string> = {
    CLEANED: 'Cleaned',
    REPLACED: 'Replaced',
  };
  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Badge className="bg-stone-100 text-stone-800 hover:bg-stone-200 font-normal">
        {componentLabel[details.component] ?? details.component}
      </Badge>
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-normal">
        {statusLabel[details.status] ?? details.status}
      </Badge>
    </div>
  );
};

const NoteDetails = ({ details }: { details: NoteActionDetails }) => (
  <p className="text-sm text-stone-700 dark:text-stone-300 italic">
    “{details.content}”
  </p>
);

const HIVE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DEAD: 'Dead',
  SOLD: 'Sold',
  UNKNOWN: 'Unknown',
  ARCHIVED: 'Archived',
};

const statusLabel = (status: string) => HIVE_STATUS_LABEL[status] ?? status;

const StatusChangeDetails = ({
  details,
}: {
  details: StatusChangeActionDetails;
}) => (
  <div className="flex gap-2 flex-wrap items-center">
    {details.fromStatus && (
      <>
        <Badge className="bg-stone-100 text-stone-800 hover:bg-stone-200 font-normal">
          {statusLabel(details.fromStatus)}
        </Badge>
        <span className="text-stone-500 dark:text-stone-400">→</span>
      </>
    )}
    <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-200 font-normal">
      {statusLabel(details.toStatus)}
    </Badge>
  </div>
);

// ─── Action label ─────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  FEEDING: 'Feeding',
  TREATMENT: 'Treatment',
  FRAME: 'Frames',
  BOX_CONFIGURATION: 'Box Configuration',
  MAINTENANCE: 'Maintenance',
  NOTE: 'Note',
  STATUS_CHANGE: 'Status Change',
  HARVEST: 'Harvest',
  OTHER: 'Other',
};

// ─── Single action row ────────────────────────────────────────────────────────

const ActionItem = ({
  action,
  isLast,
}: {
  action: ActionResponse;
  isLast: boolean;
}) => {
  const { details } = action;
  const visual = ACTION_VISUAL[action.type] ?? ACTION_VISUAL[ActionType.OTHER];
  const { Icon } = visual;

  const renderDetails = () => {
    switch (details.type) {
      case 'FEEDING':
        return <FeedingDetails details={details} />;
      case 'TREATMENT':
        return <TreatmentDetails details={details} />;
      case 'FRAME':
        return <FrameDetails details={details} />;
      case 'BOX_CONFIGURATION':
        return <BoxConfigurationDetails details={details} />;
      case 'MAINTENANCE':
        return <MaintenanceDetails details={details} />;
      case 'NOTE':
        return <NoteDetails details={details} />;
      case 'STATUS_CHANGE':
        return <StatusChangeDetails details={details} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative grid grid-cols-[2rem_1fr] @sm/sec:grid-cols-[2.25rem_1fr] gap-x-3 gap-y-1 pt-4 pb-5">
      <span
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full self-start mt-0.5',
          visual.tone,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-base text-stone-900 dark:text-stone-50 leading-tight">
          {ACTION_LABELS[action.type] ?? action.type}
        </h3>
        <div className="mt-1.5 text-sm text-stone-700 dark:text-stone-300">
          {renderDetails()}
        </div>
        {action.notes && (
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed border-l-2 border-stone-200 dark:border-stone-800 pl-3">
            {action.notes}
          </p>
        )}
      </div>
      {!isLast && (
        <div className="col-span-2 absolute left-0 right-0 bottom-0 border-t border-stone-200/70 dark:border-stone-800/70" />
      )}
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

type ActionsCardProps = {
  actions: ActionResponse[];
};

export const ActionsCard = ({ actions }: ActionsCardProps) => {
  const { t } = useTranslation('inspection');
  if (!actions || actions.length === 0) return null;

  return (
    <InspectionSection
      title={t('form.actions.title', { defaultValue: 'Actions' })}
      icon={<ClipboardCheck className="h-4 w-4" />}
    >
      <div className="-mt-4">
        {actions.map((action, i) => (
          <ActionItem
            key={action.id}
            action={action}
            isLast={i === actions.length - 1}
          />
        ))}
      </div>
    </InspectionSection>
  );
};
