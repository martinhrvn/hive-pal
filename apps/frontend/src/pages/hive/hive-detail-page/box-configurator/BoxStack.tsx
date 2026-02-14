import { Box, FrameSize } from 'shared-schemas';
import { BoxItem } from './BoxItem';
import { QueenExcluder } from './QueenExcluder';

interface BoxStackProps {
  boxes: Box[];
  selectedBoxId: string | null;
  onSelectBox: (boxId: string | null) => void;
  onReorder: (boxes: Box[]) => void;
  onRemoveBox: (boxId: string) => void;
  isEditing: boolean;
  frameSizes?: FrameSize[];
}

export const BoxStack = ({
  boxes,
  selectedBoxId,
  onSelectBox,
  onReorder,
  onRemoveBox,
  isEditing,
  frameSizes = [],
}: BoxStackProps) => {
  // Sort boxes by position (bottom to top)
  const sortedBoxes = [...boxes].sort((a, b) => b.position - a.position);

  const handleMoveUp = (boxId: string) => {
    // Moving up in the stack means increasing position (going higher physically)
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
    // Moving down in the stack means decreasing position (going lower physically)
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
            ? 'Click "Add Box" to start building your hive'
            : 'No boxes configured yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-1 py-4">
      {sortedBoxes.map(box => (
        <div key={box.id} className="flex flex-col items-center">
          {/* Show queen excluder above this box if hasExcluder is true */}
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
                ? frameSizes.find((fs) => fs.id === box.frameSizeId)?.name
                : undefined
            }
          />
        </div>
      ))}
    </div>
  );
};
