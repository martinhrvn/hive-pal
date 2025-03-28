import { ClipboardCheck, Droplet, Grid, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ActionDtoType,
  FeedingActionDetailsDto,
  FrameActionDetailsDto,
  TreatmentActionDetailsDto,
} from 'api-client';
import { ActionResponse } from 'shared-schemas';

type ActionIconProps = {
  type: ActionDtoType;
};

const ActionIcon = ({ type }: ActionIconProps) => {
  switch (type) {
    case 'FEEDING':
      return <Droplet className="h-4 w-4" />;
    case 'TREATMENT':
      return <Pill className="h-4 w-4" />;
    case 'FRAME':
      return <Grid className="h-4 w-4" />;
    default:
      return null;
  }
};

type FeedingDetailsProps = {
  details: FeedingActionDetailsDto;
};

const FeedingDetails = ({ details }: FeedingDetailsProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
        {details.feedType}
      </Badge>
      <span>
        {details.amount} {details.unit}
      </span>
      {details.concentration && <span>{details.concentration}</span>}
    </div>
  );
};

type TreatmentDetailsProps = {
  details: TreatmentActionDetailsDto;
};

const TreatmentDetails = ({ details }: TreatmentDetailsProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
        {details.product}
      </Badge>
      <span>
        {details.quantity} {details.unit}
      </span>
      {details.duration && <span>{details.duration}</span>}
    </div>
  );
};

type FrameDetailsProps = {
  details: FrameActionDetailsDto;
};

const FrameDetails = ({ details }: FrameDetailsProps) => {
  const quantity = details.quantity;
  const framesText =
    quantity > 0 ? `+${quantity} frames` : `${quantity} frames`;

  return (
    <div className="flex gap-2">
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
        {framesText}
      </Badge>
    </div>
  );
};

type ActionDetailsProps = {
  action: ActionResponse;
};

const ActionDetails = ({ action }: ActionDetailsProps) => {
  const { type, details } = action;

  switch (type) {
    case 'FEEDING':
      return <FeedingDetails details={details as FeedingActionDetailsDto} />;
    case 'TREATMENT':
      return (
        <TreatmentDetails details={details as TreatmentActionDetailsDto} />
      );
    case 'FRAME':
      return <FrameDetails details={details as FrameActionDetailsDto} />;
    default:
      return <span>Unknown action type</span>;
  }
};

type ActionItemProps = {
  action: ActionResponse;
};

const ActionItem = ({ action }: ActionItemProps) => {
  return (
    <div className="border-b pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        <ActionIcon type={action.type} />
        <h3 className="font-medium">
          {action.type.charAt(0) + action.type.slice(1).toLowerCase()}
        </h3>
      </div>
      <ActionDetails action={action} />
      {action.notes && (
        <p className="text-sm text-gray-600 mt-2">{action.notes}</p>
      )}
    </div>
  );
};

type ActionsCardProps = {
  actions: ActionResponse[];
};

export const ActionsCard = ({ actions }: ActionsCardProps) => {
  if (!actions || actions.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Actions
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
