import { useTranslation } from 'react-i18next';
import { Box, ClipboardCheck, Droplet, Grid, MessageSquare, Pill, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  ActionResponse,
  ActionType,
  BoxConfigurationActionDetails,
  FeedingActionDetails,
  FrameActionDetails,
  MaintenanceActionDetails,
  NoteActionDetails,
  TreatmentActionDetails,
} from 'shared-schemas';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ActionIcon = ({ type }: { type: ActionType }) => {
  switch (type) {
    case ActionType.FEEDING:          return <Droplet className="h-4 w-4" />;
    case ActionType.TREATMENT:        return <Pill className="h-4 w-4" />;
    case ActionType.FRAME:            return <Grid className="h-4 w-4" />;
    case ActionType.BOX_CONFIGURATION: return <Box className="h-4 w-4" />;
    case ActionType.MAINTENANCE:      return <Wrench className="h-4 w-4" />;
    case ActionType.NOTE:             return <MessageSquare className="h-4 w-4" />;
    default:                          return null;
  }
};

// ─── Detail renderers ─────────────────────────────────────────────────────────

const FeedingDetails = ({ details }: { details: FeedingActionDetails }) => (
  <div className="flex gap-2 flex-wrap items-center">
    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{details.feedType}</Badge>
    <span>{details.amount} {details.unit}</span>
    {details.concentration && <span className="text-muted-foreground">{details.concentration}</span>}
  </div>
);

const TreatmentDetails = ({ details }: { details: TreatmentActionDetails }) => (
  <div className="flex gap-2 flex-wrap items-center">
    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">{details.product}</Badge>
    {details.quantity != null && <span>{details.quantity} {details.unit}</span>}
    {details.duration && <span className="text-muted-foreground">{details.duration}</span>}
  </div>
);

const FrameDetails = ({ details }: { details: FrameActionDetails }) => {
  const q = details.quantity;
  return (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
      {q > 0 ? `+${q}` : q} frames
    </Badge>
  );
};

const BOX_TYPE_LABEL: Record<string, string> = {
  BROOD: 'Brood box',
  HONEY: 'Honey super',
  FEEDER: 'Feeder',
};

const BoxConfigurationDetails = ({ details }: { details: BoxConfigurationActionDetails }) => {
  const changes: string[] = [];
  if (details.boxesAdded > 0)    changes.push(`+${details.boxesAdded} box${details.boxesAdded === 1 ? '' : 'es'}`);
  if (details.boxesRemoved > 0)  changes.push(`-${details.boxesRemoved} box${details.boxesRemoved === 1 ? '' : 'es'}`);
  if (details.framesAdded > 0)   changes.push(`+${details.framesAdded} frame${details.framesAdded === 1 ? '' : 's'}`);
  if (details.framesRemoved > 0) changes.push(`-${details.framesRemoved} frame${details.framesRemoved === 1 ? '' : 's'}`);

  // Group the resulting boxes by type
  type BoxSummary = { type: string; frameCount: number };
  const boxes: BoxSummary[] = details.boxes ?? [];
  const grouped = boxes.reduce<Record<string, { count: number; frames: number[] }>>(
    (acc, box) => {
      const key = box.type;
      if (!acc[key]) acc[key] = { count: 0, frames: [] };
      acc[key].count += 1;
      acc[key].frames.push(box.frameCount);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-2">
      {/* Change summary badges */}
      {changes.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {changes.map(c => (
            <Badge key={c} className="bg-slate-100 text-slate-800 hover:bg-slate-200">{c}</Badge>
          ))}
        </div>
      )}

      {/* Resulting box breakdown */}
      {boxes.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Result</p>
          {Object.entries(grouped).map(([type, { count, frames }]) => {
            const label = BOX_TYPE_LABEL[type] ?? type;
            const plural = count === 1 ? '' : 's';
            // Only show frame count if the box type has frames (not feeders)
            const isFramed = type !== 'FEEDER';
            let frameSummary: string | null;
            if (!isFramed) {
              frameSummary = null;
            } else if (frames.every(f => f === frames[0])) {
              frameSummary = `${frames[0]} frames`;
            } else {
              frameSummary = `${frames.join(', ')} frames`;
            }
            return (
              <p key={type} className="text-sm">
                {count} {label}{plural}
                {frameSummary && <span className="text-muted-foreground"> ({frameSummary})</span>}
              </p>
            );
          })}
        </div>
      ) : (
        changes.length === 0 && (
          <span className="text-sm text-muted-foreground">No changes</span>
        )
      )}
    </div>
  );
};

const MaintenanceDetails = ({ details }: { details: MaintenanceActionDetails }) => {
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
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
        {componentLabel[details.component] ?? details.component}
      </Badge>
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
        {statusLabel[details.status] ?? details.status}
      </Badge>
    </div>
  );
};

const NoteDetails = ({ details }: { details: NoteActionDetails }) => (
  <p className="text-sm">{details.content}</p>
);

// ─── Action label ─────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  FEEDING:           'Feeding',
  TREATMENT:         'Treatment',
  FRAME:             'Frames',
  BOX_CONFIGURATION: 'Box Configuration',
  MAINTENANCE:       'Maintenance',
  NOTE:              'Note',
  HARVEST:           'Harvest',
  OTHER:             'Other',
};

// ─── Single action row ────────────────────────────────────────────────────────

const ActionItem = ({ action }: { action: ActionResponse }) => {
  const { details } = action;

  const renderDetails = () => {
    switch (details.type) {
      case 'FEEDING':           return <FeedingDetails details={details} />;
      case 'TREATMENT':         return <TreatmentDetails details={details} />;
      case 'FRAME':             return <FrameDetails details={details} />;
      case 'BOX_CONFIGURATION': return <BoxConfigurationDetails details={details} />;
      case 'MAINTENANCE':       return <MaintenanceDetails details={details} />;
      case 'NOTE':              return <NoteDetails details={details} />;
      default:                  return null;
    }
  };

  const detailsNode = renderDetails();

  return (
    <div className="border-b pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        <ActionIcon type={action.type} />
        <h3 className="font-medium">{ACTION_LABELS[action.type] ?? action.type}</h3>
      </div>
      {detailsNode}
      {action.notes && (
        <p className="text-sm text-muted-foreground mt-2">{action.notes}</p>
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
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {t('form.actions.title')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map(action => (
            <ActionItem key={action.id} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
