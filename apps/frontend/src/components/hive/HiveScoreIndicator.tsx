import { HiveStatus } from 'shared-schemas';
import { cn } from '@/lib/utils';

interface HiveScoreIndicatorProps {
  status: HiveStatus;
  score: number | null;
  inspectionType: 'subjective' | 'data_driven';
  strength?: number | null;
  totalFrames?: number | null;
}

export const HiveScoreIndicator = ({
  status,
  score,
  inspectionType,
  strength,
  totalFrames,
}: HiveScoreIndicatorProps) => {
  const getStatusColor = (hiveStatus: HiveStatus) => {
    switch (hiveStatus) {
      case HiveStatus.ACTIVE:
        return 'bg-green-500';
      case HiveStatus.INACTIVE:
        return 'bg-yellow-500';
      case HiveStatus.DEAD:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // If no score, show status dot indicator
  if (score == null) {
    return (
      <div
        className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          getStatusColor(status),
        )}
      />
    );
  }

  // For subjective inspection, display overall score
  if (inspectionType === 'subjective') {
    return (
      <span className="text-xs font-semibold tabular-nums text-muted-foreground flex-shrink-0">
        {(score as number).toFixed(1)}/10
      </span>
    );
  }

  // For data-driven inspection, display strength with optional frame count
  return (
    <span className="text-xs font-semibold tabular-nums text-muted-foreground flex-shrink-0">
      {strength}
      {totalFrames != null && (
        <span className="font-normal">/{totalFrames}</span>
      )}
    </span>
  );
};
