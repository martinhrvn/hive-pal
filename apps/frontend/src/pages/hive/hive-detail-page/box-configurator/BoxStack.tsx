import { useMemo } from 'react';
import { Box, FrameSize, ActionResponse } from 'shared-schemas';
import { BoxItem } from './BoxItem';
import { QueenExcluder } from './QueenExcluder';
import { MaintenancePopover } from './MaintenancePopover';
import { useTranslation } from 'react-i18next';

interface BoxStackProps {
  boxes: Box[];
  selectedBoxId: string | null;
  onSelectBox: (boxId: string | null) => void;
  onReorder: (boxes: Box[]) => void;
  onRemoveBox: (boxId: string) => void;
  isEditing: boolean;
  frameSizes?: FrameSize[];
  hiveId?: string;
  maintenanceActions?: ActionResponse[];
}

export const BoxStack = ({
  boxes,
  selectedBoxId,
  onSelectBox,
  onReorder,
  onRemoveBox,
  isEditing,
  frameSizes = [],
  hiveId,
  maintenanceActions = [],
}: BoxStackProps) => {
  const { t } = useTranslation(['inspection', 'hive']);

  // Sort boxes by position (bottom to top)
  const sortedBoxes = [...boxes].sort((a, b) => b.position - a.position);

  // Find the most recent maintenance action per component
  const lastMaintenanceByComponent = useMemo(() => {
    const map: Record<string, ActionResponse> = {};
    // Actions are already sorted by date desc from the API
    for (const action of maintenanceActions) {
      if (action.details?.type === 'MAINTENANCE') {
        const comp = action.details.component;
        if (!map[comp]) {
          map[comp] = action;
        }
      }
    }
    return map;
  }, [maintenanceActions]);

  const handleMoveUp = (boxId: string) => {
    const boxToMove = boxes.find(b => b.id === boxId);
    if (!boxToMove || boxToMove.position >= boxes.length - 1) return;

    const newBoxes = boxes.map(box => {
      if (box.id === boxId) {
        return { ...box, position: box.position + 1 };
      } else if (box.position === boxToMove.position + 1) {
        return { ...box, position: box.position - 1 };
      }
      return box;
    });

    onReorder(newBoxes);
  };

  const handleMoveDown = (boxId: string) => {
    const boxToMove = boxes.find(b => b.id === boxId);
    if (!boxToMove || boxToMove.position <= 0) return;

    const newBoxes = boxes.map(box => {
      if (box.id === boxId) {
        return { ...box, position: box.position - 1 };
      } else if (box.position === boxToMove.position - 1) {
        return { ...box, position: box.position + 1 };
      }
      return box;
    });

    onReorder(newBoxes);
  };

  if (boxes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          {isEditing
            ? t('hive:boxConfigurator.clickToAdd')
            : t('hive:boxConfigurator.noBoxes')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-1 py-4">
      {/* Cover */}
      <div
        className="w-64 h-6 rounded-t-lg border-2 bg-muted flex items-center justify-between px-3"
        style={{ borderColor: 'rgba(0, 0, 0, 0.2)' }}
      >
        <span className="text-xs font-medium text-muted-foreground">
          {t('inspection:form.actions.maintenance_section.cover')}
        </span>
        {hiveId && (
          <MaintenancePopover
            hiveId={hiveId}
            component="COVER"
            lastMaintenance={lastMaintenanceByComponent['COVER']}
          />
        )}
      </div>

      {sortedBoxes.map(box => (
        <div key={box.id} className="flex flex-col items-center">
          {box.hasExcluder && <QueenExcluder />}
          <BoxItem
            box={box}
            isSelected={selectedBoxId === box.id}
            onSelect={() => onSelectBox(box.id || null)}
            onRemove={() => onRemoveBox(box.id!)}
            onMoveUp={() => handleMoveUp(box.id!)}
            onMoveDown={() => handleMoveDown(box.id!)}
            canMoveUp={box.position < boxes.length - 1}
            canMoveDown={box.position > 0}
            isEditing={isEditing}
            frameSizeName={
              box.frameSizeId
                ? frameSizes.find(fs => fs.id === box.frameSizeId)?.name
                : undefined
            }
          />
        </div>
      ))}

      {/* Bottom Board */}
      <div
        className="w-64 h-6 rounded-b-lg border-2 bg-muted flex items-center justify-between px-3"
        style={{ borderColor: 'rgba(0, 0, 0, 0.2)' }}
      >
        <span className="text-xs font-medium text-muted-foreground">
          {t('inspection:form.actions.maintenance_section.bottomBoard')}
        </span>
        {hiveId && (
          <MaintenancePopover
            hiveId={hiveId}
            component="BOTTOM_BOARD"
            lastMaintenance={lastMaintenanceByComponent['BOTTOM_BOARD']}
          />
        )}
      </div>
    </div>
  );
};
