import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiveWithBoxesResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { useHivesWithBoxes } from '@/api/hooks';
import { Package, Snowflake, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getStatusColor } from '@/utils/status-colors';
import { getBoxHeight, getBoxTypeLabel } from '@/utils/box-display';

interface HiveMinimapProps {
  apiaryId?: string;
  className?: string;
  highlightedHiveId?: string;
  showHeader?: boolean;
}

interface MinimapHiveProps {
  hive: HiveWithBoxesResponse;
  onClick: (hiveId: string) => void;
  isHighlighted?: boolean;
}

const MinimapHive = ({ hive, onClick, isHighlighted }: MinimapHiveProps) => {
  // Sort boxes by position (bottom to top) and limit to show max 3 boxes for minimap
  const sortedBoxes = hive.boxes
    ? [...hive.boxes].sort((a, b) => b.position - a.position).slice(0, 3)
    : [];

  // Check if any box is winterized
  const isWinterized = hive.boxes?.some(box => box.winterized) ?? false;

  return (
    <div
      className={cn(
        'group cursor-pointer hover:scale-110 transition-transform flex flex-col items-center',
        isHighlighted && 'scale-110',
      )}
      onClick={() => onClick(hive.id)}
      title={hive.name}
    >
      {/* Status indicator */}
      <div
        className={cn(
          'relative',
          isHighlighted &&
            'rounded-md ring-2 ring-amber-500 ring-offset-2 ring-offset-background p-0.5',
        )}
      >
        <div
          className={cn(
            'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full z-10 border border-white',
            getStatusColor(hive.status),
          )}
        />

        {/* Winterized indicator */}
        {isWinterized && (
          <div className="absolute -top-1 -left-1 z-10">
            <Snowflake className="h-3.5 w-3.5 text-blue-500 [filter:drop-shadow(0_0_2px_white)_drop-shadow(0_0_1px_white)]" />
          </div>
        )}

        {/* Mini hive visualization */}
        {sortedBoxes.length > 0 ? (
          <div className="flex flex-col items-center space-y-[2px]">
            {sortedBoxes.map((box, index) => {
              const height = getBoxHeight(box.variant, 'minimap', box.type);
              const defaultColor = '#CD853F';

              return (
                <div
                  key={box.id || index}
                  className={cn(
                    'relative rounded-sm border border-gray-400/60 hover:shadow-sm transition-shadow',
                    index === 0 && 'rounded-t-sm',
                    index === sortedBoxes.length - 1 && 'rounded-b-sm',
                  )}
                  style={{
                    backgroundColor: box.color || defaultColor,
                    borderColor: 'rgba(0, 0, 0, 0.3)',
                    width: '85px',
                    height: `${height}px`,
                  }}
                >
                  {/* Box type indicator */}
                  <div className="absolute top-0.5 right-1">
                    <span className="text-white/90 text-[9px] font-medium">
                      {getBoxTypeLabel(box.type)}
                    </span>
                  </div>

                  {/* Frame count for larger boxes */}
                  {height >= 28 && (
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

export const HiveMinimap = ({
  apiaryId,
  className,
  highlightedHiveId,
  showHeader = true,
}: HiveMinimapProps) => {
  const navigate = useNavigate();
  const { data: rawHives = [] } = useHivesWithBoxes({ apiaryId, includeInactive: true });
  const allHives = rawHives.filter((h) => h.status !== 'ARCHIVED');

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
        {showHeader && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Hive Layout
            </h3>
            {apiaryId && (
              <Link
                to={`/apiaries/${apiaryId}?tab=hives`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Edit Hive Layout
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
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
                      <MinimapHive
                        hive={hive}
                        onClick={handleHiveClick}
                        isHighlighted={hive.id === highlightedHiveId}
                      />
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
