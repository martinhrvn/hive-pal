import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiveWithBoxesResponse, BoxVariantEnum } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { useHivesWithBoxes } from '@/api/hooks';
import { Package } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface HiveMinimapProps {
  apiaryId?: string;
  className?: string;
}

interface MinimapHiveProps {
  hive: HiveWithBoxesResponse;
  onClick: (hiveId: string) => void;
}

const MinimapHive = ({ hive, onClick }: MinimapHiveProps) => {
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
    if (!variant) return 'h-10';

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

    if (deepVariants.includes(variant)) return 'h-15';
    if (shallowVariants.includes(variant)) return 'h-10';
    return 'h-8'; // Default for WARRE, TOP_BAR, CUSTOM
  };

  const getBoxTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BROOD: 'B',
      HONEY: 'H',
      FEEDER: 'F',
    };
    return labels[type] || type.charAt(0);
  };

  // Sort boxes by position (bottom to top) and limit to show max 3 boxes for minimap
  const sortedBoxes = hive.boxes
    ? [...hive.boxes].sort((a, b) => b.position - a.position).slice(0, 3)
    : [];

  return (
    <div
      className="group cursor-pointer hover:scale-110 transition-transform flex flex-col items-center"
      onClick={() => onClick(hive.id)}
      title={hive.name}
    >
      {/* Status indicator */}
      <div className="relative">
        <div
          className={cn(
            'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full z-10 border border-white',
            getStatusColor(hive.status),
          )}
        />

        {/* Mini hive visualization */}
        {sortedBoxes.length > 0 ? (
          <div className="flex flex-col items-center space-y-[2px]">
            {sortedBoxes.map((box, index) => {
              const height = getBoxHeight(box.variant);
              const defaultColor = '#CD853F';

              return (
                <div
                  key={box.id || index}
                  className={cn(
                    'relative rounded-sm border border-gray-400/60 hover:shadow-sm transition-shadow',
                    height,
                    index === 0 && 'rounded-t-sm',
                    index === sortedBoxes.length - 1 && 'rounded-b-sm',
                  )}
                  style={{
                    backgroundColor: box.color || defaultColor,
                    borderColor: 'rgba(0, 0, 0, 0.3)',
                    width: '85px',
                  }}
                >
                  {/* Box type indicator */}
                  <div className="absolute top-0.5 right-1">
                    <span className="text-white/90 text-[9px] font-medium">
                      {getBoxTypeLabel(box.type)}
                    </span>
                  </div>

                  {/* Frame count for larger boxes */}
                  {height === 'h-15' && (
                    <div className="absolute bottom-0.5 left-1 flex items-center gap-0.5">
                      <Package className="h-2 w-2 text-white/80" />
                      <span className="text-white/90 text-[9px]">
                        {box.frameCount}
                      </span>
                    </div>
                  )}

                  {/* Wood texture overlay */}
                  <div
                    className="absolute inset-0 rounded-sm opacity-20"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px)',
                    }}
                  />
                </div>
              );
            })}

            {hive.boxes && hive.boxes.length > 3 && (
              <div className="text-[8px] text-muted-foreground mt-0.5">
                +{hive.boxes.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-[85px] h-10 border-2 border-dashed border-gray-300 rounded-sm">
            <span className="text-xs text-muted-foreground">Empty</span>
          </div>
        )}
      </div>

      {/* Hive name label */}
      <span className="text-xs font-medium text-center mt-1.5 max-w-[85px] truncate">
        {hive.name}
      </span>
    </div>
  );
};

export const HiveMinimap = ({ apiaryId, className }: HiveMinimapProps) => {
  const navigate = useNavigate();
  const { data: allHives = [] } = useHivesWithBoxes({ apiaryId });

  // Filter only positioned hives and organize by position
  const { hivesGrid, minRow, minCol, maxRow, maxCol, hasHives } =
    useMemo(() => {
      const grid: Record<string, HiveWithBoxesResponse> = {};
      let minRowNum = Infinity;
      let minColNum = Infinity;
      let maxRowNum = -1;
      let maxColNum = -1;
      let hasPositionedHives = false;

      allHives.forEach(hive => {
        if (
          hive.positionRow !== null &&
          hive.positionRow !== undefined &&
          hive.positionCol !== null &&
          hive.positionCol !== undefined
        ) {
          const key = `${hive.positionRow}-${hive.positionCol}`;
          grid[key] = hive;
          minRowNum = Math.min(minRowNum, hive.positionRow);
          minColNum = Math.min(minColNum, hive.positionCol);
          maxRowNum = Math.max(maxRowNum, hive.positionRow);
          maxColNum = Math.max(maxColNum, hive.positionCol);
          hasPositionedHives = true;
        }
      });

      // If no positioned hives, reset min values
      if (!hasPositionedHives) {
        minRowNum = 0;
        minColNum = 0;
        maxRowNum = 0;
        maxColNum = 0;
      }

      return {
        hivesGrid: grid,
        minRow: minRowNum,
        minCol: minColNum,
        maxRow: maxRowNum,
        maxCol: maxColNum,
        hasHives: hasPositionedHives,
      };
    }, [allHives]);

  const handleHiveClick = (hiveId: string) => {
    navigate(`/hives/${hiveId}`);
  };

  if (!hasHives) {
    return null;
  }

  // Calculate the actual grid dimensions needed (minimal grid)
  const gridRows = maxRow - minRow + 1;
  const gridCols = maxCol - minCol + 1;

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Hive Layout
        </h3>
        <div className="overflow-auto max-h-[500px]">
          <div
            className="grid gap-3 w-fit mx-auto p-2"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(100px, 1fr))`,
            }}
          >
            {Array.from({ length: gridRows }, (_, rowIndex) => {
              const actualRow = rowIndex + minRow;
              return Array.from({ length: gridCols }, (_, colIndex) => {
                const actualCol = colIndex + minCol;
                const key = `${actualRow}-${actualCol}`;
                const hive = hivesGrid[key];

                return (
                  <div
                    key={key}
                    className="flex items-center justify-center"
                    style={{ minHeight: '80px' }}
                  >
                    {hive && (
                      <MinimapHive hive={hive} onClick={handleHiveClick} />
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};
