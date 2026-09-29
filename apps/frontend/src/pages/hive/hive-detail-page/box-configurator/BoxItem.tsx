import { Box } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, X, Package, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBoxHeight, getBoxTypeLabel } from '@/utils/box-display';

interface BoxItemProps {
  box: Box;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isEditing: boolean;
  frameSizeName?: string;
}

export const BoxItem = ({
  box,
  isSelected,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isEditing,
  frameSizeName,
}: BoxItemProps) => {
  const height = getBoxHeight(box.variant, 'detail', box.type);
  const defaultColor = '#CD853F'; // Default wood color

  const getBoxTypeBadgeClass = (type: string) => {
    const classes: Record<string, string> = {
      BROOD: 'bg-green-100 text-green-800 border-green-200',
      HONEY: 'bg-amber-100 text-amber-800 border-amber-200',
      FEEDER: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return classes[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div
      className={cn(
        'relative w-64 rounded border-2 cursor-pointer transition-all',
        isSelected && isEditing ? 'ring-2 ring-primary ring-offset-2' : '',
        isEditing ? 'hover:shadow-lg' : '',
      )}
      style={{
        height: `${height}px`,
        backgroundColor: box.color || defaultColor,
        borderColor: 'rgba(0, 0, 0, 0.2)',
      }}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Winterized indicator in upper left */}
      {box.winterized && (
        <div className="absolute top-2 left-2">
          <Snowflake className="h-5 w-5 text-blue-400 [filter:drop-shadow(0_0_2px_white)_drop-shadow(0_0_1px_white)]" />
        </div>
      )}

      {/* Type badge in upper right */}
      <div className="absolute top-2 right-2">
       <Badge
           variant="secondary"
           className={cn('font-semibold border', getBoxTypeBadgeClass(box.type))}
         >
           {getBoxTypeLabel(box.type, 'long')}
         </Badge>
      </div>

      {/* Frame count in bottom left */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1">
        <Package className="h-4 w-4 text-white/90" />
        <span className="text-white font-semibold text-sm">
          {box.frameCount}/{box.maxFrameCount || 10}
        </span>
      </div>

      {/* Frame size name (hidden on short boxes to avoid overlapping badge/frame count) */}
      {frameSizeName && height >= 56 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span
            className="text-white/70 text-xs font-medium"
            title={frameSizeName}
          >
            {frameSizeName}
          </span>
        </div>
      )}

      {/* Controls when editing */}
      {isEditing && (
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={e => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={e => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            onClick={e => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Wood texture overlay for visual effect */}
      <div
        className="absolute inset-0 rounded-md opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />
    </div>
  );
};
