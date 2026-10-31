import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { HiveWithBoxesResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';
import { useHivesWithBoxes } from '@/api/hooks';
import { Snowflake } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusColor } from '@/utils/status-colors';
import { BoxStack } from '@/components/hive/box-stack';

interface HiveMinimapProps {
  apiaryId?: string;
  className?: string;
  highlightedHiveId?: string;
}

interface MinimapHiveProps {
  hive: HiveWithBoxesResponse;
  isHighlighted?: boolean;
}

const MinimapHive = ({ hive, isHighlighted }: MinimapHiveProps) => {
  const isWinterized = hive.boxes?.some(box => box.winterized) ?? false;

  return (
    <Link
      to={`/hives/${hive.id}`}
      className={cn(
        'group flex flex-col items-center rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-105',
        isHighlighted && 'scale-110',
      )}
      title={hive.name}
    >
      {/* Status indicator */}
      <div
        className={cn(
          'relative',
          isHighlighted &&
            'rounded-md ring-2 ring-honey ring-offset-2 ring-offset-background p-0.5',
        )}
      >
        <div
          className={cn(
            'absolute -top-1 -right-1 z-10 size-2.5 rounded-full border border-card',
            getStatusColor(hive.status),
          )}
        />

        {isWinterized && (
          <div className="absolute -top-1 -left-1 z-10">
            <Snowflake className="size-3.5 text-info [filter:drop-shadow(0_0_2px_white)_drop-shadow(0_0_1px_white)]" />
          </div>
        )}

        <BoxStack boxes={hive.boxes} size="minimap" />
      </div>

      <span className="mt-1.5 max-w-[85px] truncate text-center text-xs font-medium">
        {hive.name}
      </span>
    </Link>
  );
};

export const HiveMinimap = ({
  apiaryId,
  className,
  highlightedHiveId,
}: HiveMinimapProps) => {
  const { t } = useTranslation('hive');
  const { data: rawHives, isLoading } = useHivesWithBoxes({
    apiaryId,
    includeInactive: true,
  });

  // Index positioned (non-archived) hives by grid cell.
  const { hivesGrid, minRow, minCol, maxRow, maxCol, hasHives } =
    useMemo(() => {
      const grid: Record<string, HiveWithBoxesResponse> = {};
      let minRowNum = Infinity;
      let minColNum = Infinity;
      let maxRowNum = -1;
      let maxColNum = -1;

      for (const hive of rawHives ?? []) {
        if (
          hive.status === 'ARCHIVED' ||
          hive.positionRow == null ||
          hive.positionCol == null
        ) {
          continue;
        }
        grid[`${hive.positionRow}-${hive.positionCol}`] = hive;
        minRowNum = Math.min(minRowNum, hive.positionRow);
        minColNum = Math.min(minColNum, hive.positionCol);
        maxRowNum = Math.max(maxRowNum, hive.positionRow);
        maxColNum = Math.max(maxColNum, hive.positionCol);
      }

      const hasPositionedHives = maxRowNum >= 0;
      return {
        hivesGrid: grid,
        minRow: hasPositionedHives ? minRowNum : 0,
        minCol: hasPositionedHives ? minColNum : 0,
        maxRow: hasPositionedHives ? maxRowNum : 0,
        maxCol: hasPositionedHives ? maxColNum : 0,
        hasHives: hasPositionedHives,
      };
    }, [rawHives]);

  if (isLoading) {
    return <Skeleton className={cn('h-32 w-full rounded-xl', className)} />;
  }

  if (!hasHives) {
    return (
      <Card className={cn('p-4 text-sm text-muted-foreground', className)}>
        {t(
          'layout.minimapEmpty',
          'No hives are placed on the layout yet. Arrange them from the apiary page.',
        )}
      </Card>
    );
  }

  // Calculate the actual grid dimensions needed (minimal grid)
  const gridRows = maxRow - minRow + 1;
  const gridCols = maxCol - minCol + 1;

  return (
    <Card className={cn('p-4', className)}>
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
                  className="flex min-h-20 items-center justify-center"
                >
                  {hive && (
                    <MinimapHive
                      hive={hive}
                      isHighlighted={hive.id === highlightedHiveId}
                    />
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>
    </Card>
  );
};
