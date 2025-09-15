import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { HiveCard } from './hive-card';
import { HiveWithBoxesResponse } from 'shared-schemas';
import { useHivesWithBoxes, useUpdateHive } from '@/api/hooks';

interface HivesLayoutProps {
  apiaryId: string;
}

const INITIAL_ROWS = 5;
const INITIAL_COLS = 5;

export const HivesLayout = ({ apiaryId }: HivesLayoutProps) => {
  const { t } = useTranslation('hive');
  const { data: allHives = [], refetch } = useHivesWithBoxes({ apiaryId });
  const updateHiveMutation = useUpdateHive();
  const [draggedHive, setDraggedHive] = useState<HiveWithBoxesResponse | null>(
    null,
  );

  // Organize hives by position
  const { hivesGrid, unpositionedHives, maxRow, maxCol } = useMemo(() => {
    const grid: Record<string, HiveWithBoxesResponse> = {};
    const unpositioned: HiveWithBoxesResponse[] = [];
    let maxRowNum = 0;
    let maxColNum = 0;

    allHives.forEach(hive => {
      if (
        hive.positionRow !== null &&
        hive.positionRow !== undefined &&
        hive.positionCol !== null &&
        hive.positionCol !== undefined
      ) {
        const key = `${hive.positionRow}-${hive.positionCol}`;
        grid[key] = hive;
        maxRowNum = Math.max(maxRowNum, hive.positionRow);
        maxColNum = Math.max(maxColNum, hive.positionCol);
      } else {
        unpositioned.push(hive);
      }
    });

    return {
      hivesGrid: grid,
      unpositionedHives: unpositioned,
      maxRow: maxRowNum,
      maxCol: maxColNum,
    };
  }, [allHives]);

  // Calculate grid dimensions - start with 5x5, expand as needed
  const gridDimensions = useMemo(() => {
    let rows = Math.max(INITIAL_ROWS, maxRow + 1);
    let cols = Math.max(INITIAL_COLS, maxCol + 1);

    // Check if we need to expand (if last row or column has hives)
    let shouldExpandRows = false;
    let shouldExpandCols = false;

    // Check if last row has any hives
    for (let col = 0; col < cols; col++) {
      if (hivesGrid[`${rows - 1}-${col}`]) {
        shouldExpandRows = true;
        break;
      }
    }

    // Check if last column has any hives
    for (let row = 0; row < rows; row++) {
      if (hivesGrid[`${row}-${cols - 1}`]) {
        shouldExpandCols = true;
        break;
      }
    }

    // Expand if needed
    if (shouldExpandRows) rows += 1;
    if (shouldExpandCols) cols += 1;

    return { rows, cols };
  }, [maxRow, maxCol, hivesGrid]);

  const handleDropHive = async (hiveId: string, row: number, col: number) => {
    try {
      await updateHiveMutation.mutateAsync({
        id: hiveId,
        data: {
          id: hiveId,
          positionRow: row,
          positionCol: col,
        },
      });
      await refetch();
    } catch (error) {
      console.error('Failed to update hive position:', error);
    }
  };

  const handleRemoveHivePosition = async (hiveId: string) => {
    try {
      await updateHiveMutation.mutateAsync({
        id: hiveId,
        data: {
          id: hiveId,
          positionRow: undefined,
          positionCol: undefined,
        },
      });
      await refetch();
    } catch (error) {
      console.error('Failed to remove hive position:', error);
    }
  };

  const handleDragStart = (hive: HiveWithBoxesResponse) => {
    setDraggedHive(hive);
  };

  const handleDragEnd = () => {
    setDraggedHive(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    const hiveId = e.dataTransfer.getData('text/plain');
    if (hiveId) {
      handleDropHive(hiveId, row, col);
    }
  };

  const renderGridCell = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const hive = hivesGrid[key];

    if (hive) {
      return (
        <div
          key={key}
          className="relative group"
          draggable
          onDragStart={e => {
            e.dataTransfer.setData('text/plain', hive.id);
            handleDragStart(hive);
          }}
          onDragEnd={handleDragEnd}
        >
          <HiveCard hive={hive} isDragging={draggedHive?.id === hive.id} />
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background shadow-sm border"
            onClick={() => handleRemoveHivePosition(hive.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    // Empty cell that can receive drops
    return (
      <div
        key={key}
        className="min-w-[120px] min-h-[80px] border border-dashed border-muted-foreground/20 rounded-md hover:border-muted-foreground/30 hover:bg-muted/20 transition-all flex items-center justify-center"
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e, row, col)}
      >
        <Plus className="h-4 w-4 text-muted-foreground/20" />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('layout.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('layout.grid')}: {gridDimensions.rows} × {gridDimensions.cols}
        </p>
      </div>

      {/* Grid layout */}
      <div className="overflow-auto max-h-[600px]">
        <div
          className="grid gap-2 w-fit"
          style={{
            gridTemplateColumns: `repeat(${gridDimensions.cols}, minmax(120px, 1fr))`,
          }}
        >
          {Array.from({ length: gridDimensions.rows }, (_, row) =>
            Array.from({ length: gridDimensions.cols }, (_, col) =>
              renderGridCell(row, col),
            ),
          )}
        </div>
      </div>

      {/* Unpositioned hives */}
      {unpositionedHives.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t('layout.unpositionedHives')}
          </h3>
          <div className="flex flex-wrap gap-3">
            {unpositionedHives.map(hive => (
              <div
                key={hive.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', hive.id);
                  handleDragStart(hive);
                }}
                onDragEnd={handleDragEnd}
                className="cursor-move"
              >
                <HiveCard
                  hive={hive}
                  isDragging={draggedHive?.id === hive.id}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {allHives.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t('layout.noHivesInApiary')}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('layout.dragToOrganize')}
          </p>
        </Card>
      )}
    </div>
  );
};
