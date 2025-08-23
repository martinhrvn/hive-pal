import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HiveWithBoxesResponse, BoxVariantEnum } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface HiveCardProps {
  hive: HiveWithBoxesResponse;
  isDragging?: boolean;
  className?: string;
}

export const HiveCard = ({ hive, isDragging, className }: HiveCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'INACTIVE':
        return 'bg-yellow-500';
      case 'DEAD':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBoxHeight = (variant?: BoxVariantEnum) => {
    if (!variant) return 'h-8';

    const deepVariants = [
      BoxVariantEnum.LANGSTROTH_DEEP,
      BoxVariantEnum.B_DEEP,
      BoxVariantEnum.NATIONAL_DEEP,
      BoxVariantEnum.DADANT,
    ];

    const shallowVariants = [
      BoxVariantEnum.LANGSTROTH_SHALLOW,
      BoxVariantEnum.B_SHALLOW,
      BoxVariantEnum.NATIONAL_SHALLOW,
    ];

    if (deepVariants.includes(variant)) return 'h-12';
    if (shallowVariants.includes(variant)) return 'h-8';
    return 'h-10'; // Default for WARRE, TOP_BAR, CUSTOM
  };

  const getBoxTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BROOD: 'B',
      HONEY: 'H',
      FEEDER: 'F',
    };
    return labels[type] || type.charAt(0);
  };

  // Sort boxes by position (bottom to top) and limit to show max 4-5 boxes
  const sortedBoxes = hive.boxes ? [...hive.boxes]
    .sort((a, b) => b.position - a.position)
    .slice(0, 4) : [];

  return (
    <Card
      className={cn(
        'cursor-move hover:shadow-md transition-shadow min-w-[140px] max-w-[180px] overflow-hidden',
        isDragging && 'opacity-50',
        className
      )}
    >
      {/* Header with hive info */}
      <div className="p-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm truncate">{hive.name}</h4>
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              getStatusColor(hive.status)
            )}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {hive.status}
          </Badge>
          
          {hive.lastInspectionDate && (
            <p className="text-xs text-muted-foreground">
              {new Date(hive.lastInspectionDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      
      {/* Mini hive visualization */}
      {sortedBoxes.length > 0 ? (
        <div className="px-4 pb-3">
          <div className="flex flex-col items-center space-y-0.5">
            {sortedBoxes.map((box, index) => {
              const height = getBoxHeight(box.variant);
              const defaultColor = '#CD853F';
              
              return (
                <div
                  key={box.id || index}
                  className={cn(
                    'relative w-full rounded-sm border border-gray-400/60',
                    height,
                    index === 0 && 'rounded-t-sm',
                    index === sortedBoxes.length - 1 && 'rounded-b-sm'
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
        <div className="px-4 pb-3">
          <div className="flex items-center justify-center h-16 border-2 border-dashed border-gray-300 rounded">
            <p className="text-xs text-muted-foreground">No boxes</p>
          </div>
        </div>
      )}
    </Card>
  );
};