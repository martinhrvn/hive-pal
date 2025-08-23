import { Box } from 'shared-schemas';
import { BoxItem } from './BoxItem';
import { QueenExcluder } from './QueenExcluder';

interface BoxStackProps {
  boxes: Box[];
  selectedBoxId: string | null;
  onSelectBox: (boxId: string | null) => void;
  onReorder: (boxes: Box[]) => void;
  onRemoveBox: (boxId: string) => void;
  isEditing: boolean;
}

export const BoxStack = ({
  boxes,
  selectedBoxId,
  onSelectBox,
  onReorder,
  onRemoveBox,
  isEditing,
}: BoxStackProps) => {
  // Sort boxes by position (bottom to top)
  const sortedBoxes = [...boxes].sort((a, b) => b.position - a.position);

  const handleMoveUp = (boxId: string) => {
    const index = boxes.findIndex(b => b.id === boxId);
    if (index > 0) {
      const newBoxes = [...boxes];
      [newBoxes[index], newBoxes[index - 1]] = [newBoxes[index - 1], newBoxes[index]];
      onReorder(newBoxes);
    }
  };

  const handleMoveDown = (boxId: string) => {
    const index = boxes.findIndex(b => b.id === boxId);
    if (index < boxes.length - 1) {
      const newBoxes = [...boxes];
      [newBoxes[index], newBoxes[index + 1]] = [newBoxes[index + 1], newBoxes[index]];
      onReorder(newBoxes);
    }
  };

  if (boxes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          {isEditing ? 'Click "Add Box" to start building your hive' : 'No boxes configured yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-0 py-4">
      {sortedBoxes.map((box, index) => (
        <div key={box.id} className="flex flex-col items-center">
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
          />
          {index < sortedBoxes.length - 1 && sortedBoxes[index].hasExcluder && (
            <QueenExcluder />
          )}
        </div>
      ))}
    </div>
  );
};