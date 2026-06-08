import { Card } from '@/components/ui/card';
import { HiveWithBoxesResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { Package, Snowflake } from 'lucide-react';
import { AlertsPopover } from '@/components/alerts';
import { HiveScoreIndicator } from '@/components/hive';
import { getBoxHeight, getBoxTypeLabel } from '@/utils/box-display';

interface HiveCardProps {
  hive: HiveWithBoxesResponse;
  isSubjective?: boolean;
  isDragging?: boolean;
  className?: string;
}

export const HiveCard = ({
  hive,
  isSubjective = false,
  isDragging,
  className,
}: HiveCardProps) => {
  // Sort boxes by position (bottom to top) and limit to show max 4-5 boxes
  const sortedBoxes = hive.boxes
    ? [...hive.boxes].sort((a, b) => b.position - a.position).slice(0, 4)
    : [];

  // Check if any box is winterized
  const isWinterized = hive.boxes?.some(box => box.winterized) ?? false;

  return (
    <Card
      className={cn(
        'cursor-move hover:shadow-md transition-shadow min-w-[140px] max-w-[180px] overflow-hidden',
        isDragging && 'opacity-50',
        className,
      )}
    >
      {/* Header with hive info */}
      <div className="space-y-0.5 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            {isWinterized && (
              <Snowflake className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 drop-shadow-sm" />
            )}
            <h4 className="font-medium text-sm truncate">{hive.name}</h4>
          </div>
          <HiveScoreIndicator
            status={hive.status}
            score={
              (isSubjective
                ? hive.lastInspectionOverallScore
                : hive.lastInspectionStrength) ?? null
            }
            inspectionType={isSubjective ? 'subjective' : 'data_driven'}
            strength={hive.lastInspectionStrength}
            totalFrames={hive.lastInspectionTotalFrames}
          />
        </div>

        {hive.lastInspectionDate && (
          <p className="text-xs text-muted-foreground">
            Last: {new Date(hive.lastInspectionDate).toLocaleDateString()}
          </p>
        )}

        {/* Alerts with popover */}
        <AlertsPopover alerts={hive.alerts || []} />
      </div>

      {/* Mini hive visualization */}
      {sortedBoxes.length > 0 ? (
        <div className="px-2 ">
          <div className="flex flex-col items-center space-y-0.5">
             {sortedBoxes.map((box, index) => {
               const height = getBoxHeight(box.variant, 'hive-card');
               const defaultColor = '#CD853F';

              return (
                <div
                  key={box.id || index}
                  className={cn(
                    'relative w-full rounded-sm border border-gray-400/60',
                    height,
                    index === 0 && 'rounded-t-sm',
                    index === sortedBoxes.length - 1 && 'rounded-b-sm',
                  )}
                  style={{
                    backgroundColor: box.color || defaultColor,
                    borderColor: 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Box type indicator */}
                  <div className="absolute top-0.5 right-1">
                    <span className="text-white/90 text-xs font-medium">
                      {getBoxTypeLabel(box.type)}
                    </span>
                  </div>

                  {/* Frame count for larger boxes */}
                  {(height === 'h-12' || height === 'h-10') && (
                    <div className="absolute bottom-0.5 left-1 flex items-center gap-0.5">
                      <Package className="h-2.5 w-2.5 text-white/80" />
                      <span className="text-white/90 text-xs">
                        {box.frameCount}
                      </span>
                    </div>
                  )}

                  {/* Wood texture overlay */}
                  <div
                    className="absolute inset-0 rounded-sm opacity-20"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                    }}
                  />
                </div>
              );
            })}

            {hive.boxes && hive.boxes.length > 4 && (
              <div className="text-xs text-muted-foreground mt-1">
                +{hive.boxes.length - 4} more
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-2 pb-2">
          <div className="flex items-center justify-center h-16 border-2 border-dashed border-gray-300 rounded">
            <p className="text-xs text-muted-foreground">No boxes</p>
          </div>
        </div>
      )}
    </Card>
  );
};
