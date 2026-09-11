// Renders an inspection's beekeeping actions (feeding, treatment, frames, …) as
// compact, colour-coded chips — one per distinct action type, deduplicated with
// a ×count. Used in the inspections table's "Actions" column.
import {
  Box,
  ClipboardCheck,
  Droplet,
  Grid,
  MessageSquare,
  Pill,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActionResponse, ActionType } from 'shared-schemas';
import { cn } from '@/lib/utils';

type ActionVisual = {
  Icon: React.ComponentType<{ className?: string }>;
  tone: string;
};

const FALLBACK_VISUAL: ActionVisual = {
  Icon: ClipboardCheck,
  tone: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
};

const FALLBACK_LABEL = { key: 'common:actionTypes.other', fallback: 'Other' };

// Icon + colour tone per action type (mirrors the inspection detail actions
// card). Partial so action types added to the enum later fall back gracefully
// instead of breaking the build.
const ACTION_TYPE_VISUAL: Partial<Record<ActionType, ActionVisual>> = {
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
  [ActionType.HARVEST]: {
    Icon: ClipboardCheck,
    tone: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
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
  [ActionType.OTHER]: {
    Icon: ClipboardCheck,
    tone: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  },
};

const ACTION_TYPE_I18N: Partial<
  Record<ActionType, { key: string; fallback: string }>
> = {
    [ActionType.FEEDING]: { key: 'common:actionTypes.feeding', fallback: 'Feeding' },
    [ActionType.TREATMENT]: {
      key: 'common:actionTypes.treatment',
      fallback: 'Treatment',
    },
    [ActionType.FRAME]: { key: 'common:actionTypes.frame', fallback: 'Frames' },
    [ActionType.HARVEST]: {
      key: 'common:actionTypes.harvest',
      fallback: 'Harvest',
    },
    [ActionType.BOX_CONFIGURATION]: {
      key: 'common:actionTypes.boxConfiguration',
      fallback: 'Box config',
    },
    [ActionType.MAINTENANCE]: {
      key: 'common:actionTypes.maintenance',
      fallback: 'Maintenance',
    },
    [ActionType.NOTE]: { key: 'common:actionTypes.note', fallback: 'Note' },
    [ActionType.OTHER]: { key: 'common:actionTypes.other', fallback: 'Other' },
  };

/**
 * Renders the actions recorded in an inspection as compact chips, one per
 * distinct action type (with a ×count when a type occurs more than once).
 * Shows a muted dash when there are no actions.
 */
export const ActionTypeBadges = ({
  actions,
}: {
  actions: ActionResponse[];
}) => {
  const { t } = useTranslation('common');

  if (!actions || actions.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  // Count occurrences per type, preserving first-seen order.
  const counts = new Map<ActionType, number>();
  for (const action of actions) {
    counts.set(action.type, (counts.get(action.type) ?? 0) + 1);
  }

  return (
    <div className="flex flex-wrap gap-1">
      {[...counts.entries()].map(([type, count]) => {
        const visual = ACTION_TYPE_VISUAL[type] ?? FALLBACK_VISUAL;
        const { Icon } = visual;
        const label = ACTION_TYPE_I18N[type] ?? FALLBACK_LABEL;
        return (
          <span
            key={type}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap',
              visual.tone,
            )}
          >
            <Icon className="h-3 w-3 shrink-0" />
            {t(label.key, { defaultValue: label.fallback })}
            {count > 1 && <span className="tabular-nums">×{count}</span>}
          </span>
        );
      })}
    </div>
  );
};
