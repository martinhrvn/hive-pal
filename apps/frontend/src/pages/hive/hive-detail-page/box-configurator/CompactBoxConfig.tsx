import { useMemo } from 'react';
import {
  Box,
  BoxTypeEnum,
  BoxVariantEnum,
  getCompatibleVariants,
} from 'shared-schemas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

const getVariantLabel = (variant: BoxVariantEnum): string => {
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

interface CompactBoxConfigProps {
  box: Box;
  onUpdate: (box: Box) => void;
  mainBoxVariant?: BoxVariantEnum;
  isMainBox?: boolean;
}

export const CompactBoxConfig = ({
  box,
  onUpdate,
  mainBoxVariant,
  isMainBox,
}: CompactBoxConfigProps) => {
  // Get available variants based on main box
  const availableVariants = useMemo(() => {
    if (isMainBox || !mainBoxVariant) {
      return Object.values(BoxVariantEnum);
    }
    return getCompatibleVariants(mainBoxVariant);
  }, [mainBoxVariant, isMainBox]);

  const handleTypeChange = (value: string) => {
    onUpdate({ ...box, type: value as BoxTypeEnum });
  };

  const handleVariantChange = (value: string) => {
    onUpdate({ ...box, variant: value as BoxVariantEnum });
  };

  const handleFrameCountChange = (value: number[]) => {
    onUpdate({ ...box, frameCount: value[0] });
  };

  const handleExcluderChange = (checked: boolean) => {
    onUpdate({ ...box, hasExcluder: checked });
  };

  const handleWinterizedChange = (checked: boolean) => {
    onUpdate({ ...box, winterized: checked });
  };

  const handleColorChange = (color: string) => {
    onUpdate({ ...box, color });
  };

  const colorPresets = [
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#22c55e', // green
    '#ef4444', // red
    '#8b5cf6', // violet
    '#6b7280', // gray
  ];

  return (
    <div className="space-y-3">
      {/* Two column grid for compact layout */}
      <div className="grid grid-cols-1 gap-3">
        {/* Box Purpose */}
        <div>
          <Label htmlFor="box-type" className="text-xs">Purpose</Label>
          <Select value={box.type} onValueChange={handleTypeChange}>
            <SelectTrigger id="box-type" className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BoxTypeEnum.BROOD}>Brood Box</SelectItem>
              <SelectItem value={BoxTypeEnum.HONEY}>Honey Super</SelectItem>
              <SelectItem value={BoxTypeEnum.FEEDER}>Feeder Box</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Box Variant */}
        <div>
          <Label htmlFor="box-variant" className="text-xs">Box Type</Label>
          <Select value={box.variant || ''} onValueChange={handleVariantChange}>
            <SelectTrigger id="box-variant" className="h-8 text-sm">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {availableVariants.map((variant) => (
                <SelectItem key={variant} value={variant}>
                  {getVariantLabel(variant)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frame Count */}
        <div>
          <Label htmlFor="frame-count" className="text-xs">
            Frames: {box.frameCount} / {box.maxFrameCount || 10}
          </Label>
          <Slider
            id="frame-count"
            min={0}
            max={box.maxFrameCount || 10}
            step={1}
            value={[box.frameCount]}
            onValueChange={handleFrameCountChange}
            className="mt-1"
          />
        </div>

        {/* Queen Excluder */}
        <div className="flex items-center space-x-2 pt-1">
          <Checkbox
            id="queen-excluder"
            checked={box.hasExcluder}
            onCheckedChange={handleExcluderChange}
            className="h-4 w-4"
          />
          <Label
            htmlFor="queen-excluder"
            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Queen excluder above
          </Label>
        </div>

        {/* Winterized */}
        <div className="flex items-center space-x-2 pt-1">
          <Checkbox
            id="winterized"
            checked={box.winterized ?? false}
            onCheckedChange={handleWinterizedChange}
            className="h-4 w-4"
          />
          <Label
            htmlFor="winterized"
            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Winterized
          </Label>
        </div>

        {/* Color Selection */}
        <div>
          <Label className="text-xs">Color</Label>
          <div className="flex gap-1 mt-1">
            {colorPresets.map(color => (
              <button
                key={color}
                type="button"
                className={`w-7 h-7 rounded border-2 transition-all ${
                  box.color === color ? 'border-primary scale-110' : 'border-gray-300 hover:border-gray-500'
                }`}
                style={{ backgroundColor: color }}
                onClick={(e) => {
                  e.preventDefault();
                  handleColorChange(color);
                }}
                title={color}
              />
            ))}
            <Input
              type="color"
              value={box.color || '#CD853F'}
              onChange={e => handleColorChange(e.target.value)}
              className="h-7 w-7 p-0 border-2"
              title="Custom color"
            />
          </div>
        </div>
      </div>
    </div>
  );
};