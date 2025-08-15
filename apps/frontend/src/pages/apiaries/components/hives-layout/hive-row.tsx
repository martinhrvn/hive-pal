import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { HiveCard } from './hive-card';
import { HiveResponse } from 'shared-schemas';
import { cn } from '@/lib/utils';

interface HiveRowProps {
  rowIndex: number;
  hives: HiveResponse[];
  onRemoveRow?: (rowIndex: number) => void;
  onDropHive?: (hiveId: string, rowIndex: number, colIndex: number) => void;
  onDragStart?: (hive: HiveResponse) => void;
  onDragEnd?: () => void;
  canRemove?: boolean;
  className?: string;
}

export const HiveRow = ({
  rowIndex,
  hives,
  onRemoveRow,
  onDropHive,
  onDragStart,
  onDragEnd,
  canRemove = true,
  className,
}: HiveRowProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, colIndex: number) => {
    e.preventDefault();
    const hiveId = e.dataTransfer.getData('text/plain');
    if (hiveId && onDropHive) {
      onDropHive(hiveId, rowIndex, colIndex);
    }
  };

  const handleDragStart = (e: React.DragEvent, hive: HiveResponse) => {
    e.dataTransfer.setData('text/plain', hive.id);
    if (onDragStart) {
      onDragStart(hive);
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Row {rowIndex + 1}
        </h3>
        {canRemove && onRemoveRow && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveRow(rowIndex)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div
        className="flex flex-wrap gap-3 min-h-[80px]"
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e, hives.length)}
      >
        {hives.map(hive => (
          <div
            key={hive.id}
            draggable
            onDragStart={e => handleDragStart(e, hive)}
            onDragEnd={handleDragEnd}
          >
            <HiveCard hive={hive} />
          </div>
        ))}

        {/* Drop zone for empty spaces */}
        <div className="min-w-[120px] min-h-[80px] border-2 border-dashed border-muted-foreground/20 rounded-md flex items-center justify-center hover:border-muted-foreground/40 transition-colors">
          <Plus className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>
    </Card>
  );
};
