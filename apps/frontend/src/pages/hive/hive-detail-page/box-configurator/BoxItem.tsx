import { Box, BoxVariantEnum } from 'shared-schemas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, X, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

const getBoxHeight = (variant?: BoxVariantEnum) => {
  if (!variant) return 'h-20';
  
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
  
  if (deepVariants.includes(variant)) return 'h-28';
  if (shallowVariants.includes(variant)) return 'h-20';
  return 'h-24'; // Default for WARRE, TOP_BAR, CUSTOM
};

const getBoxTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    BROOD: 'Brood',
    HONEY: 'Honey',
    FEEDER: 'Feeder',
  };
  return labels[type] || type;
};

const getVariantLabel = (variant?: BoxVariantEnum) => {
  if (!variant) return '';
  
  const labels: Record<BoxVariantEnum, string> = {
    [BoxVariantEnum.LANGSTROTH_DEEP]: 'Langstroth Deep',
    [BoxVariantEnum.LANGSTROTH_SHALLOW]: 'Langstroth Shallow',
    [BoxVariantEnum.B_DEEP]: 'B Deep',
    [BoxVariantEnum.B_SHALLOW]: 'B Shallow',
    [BoxVariantEnum.DADANT]: 'Dadant',
    [BoxVariantEnum.NATIONAL_DEEP]: 'National Deep',
    [BoxVariantEnum.NATIONAL_SHALLOW]: 'National Shallow',
    [BoxVariantEnum.WARRE]: 'Warré',
    [BoxVariantEnum.TOP_BAR]: 'Top Bar',
    [BoxVariantEnum.CUSTOM]: 'Custom',
  };
  return labels[variant];
};

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
}: BoxItemProps) => {
  const height = getBoxHeight(box.variant);
  const defaultColor = '#CD853F'; // Default wood color
  
  return (
    <div
      className={cn(
        'relative w-64 rounded-md border-2 cursor-pointer transition-all',
        height,
        isSelected && isEditing ? 'ring-2 ring-primary ring-offset-2' : '',
        isEditing ? 'hover:shadow-lg' : ''
      )}
      style={{
        backgroundColor: box.color || defaultColor,
        borderColor: 'rgba(0, 0, 0, 0.2)',
      }}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Box content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center p-2">
        <div className="flex items-center gap-2 mb-1">
          <Package className="h-4 w-4 text-white/80" />
          <span className="text-white font-medium text-sm">
            {getBoxTypeLabel(box.type)}
          </span>
        </div>
        
        <div className="flex gap-2 flex-wrap justify-center">
          <Badge variant="secondary" className="text-xs">
            {box.frameCount} frames
          </Badge>
          {box.variant && (
            <Badge variant="secondary" className="text-xs">
              {getVariantLabel(box.variant)}
            </Badge>
          )}
        </div>
      </div>

      {/* Controls when editing */}
      {isEditing && (
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={(e) => {
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
            onClick={(e) => {
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
            onClick={(e) => {
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
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />
    </div>
  );
};