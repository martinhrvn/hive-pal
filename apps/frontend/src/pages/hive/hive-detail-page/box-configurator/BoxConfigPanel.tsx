import { Box, BoxTypeEnum, BoxVariantEnum } from 'shared-schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface BoxConfigPanelProps {
  box: Box;
  onUpdate: (box: Box) => void;
}

export const BoxConfigPanel = ({ box, onUpdate }: BoxConfigPanelProps) => {
  const handleTypeChange = (value: string) => {
    onUpdate({ ...box, type: value as BoxTypeEnum });
  };

  const handleVariantChange = (value: string) => {
    onUpdate({ ...box, variant: value as BoxVariantEnum });
  };

  const handleFrameCountChange = (value: number[]) => {
    onUpdate({ ...box, frameCount: value[0] });
  };

  const handleMaxFrameCountChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      onUpdate({
        ...box,
        maxFrameCount: num,
        frameCount: Math.min(box.frameCount, num),
      });
    }
  };

  const handleColorChange = (value: string) => {
    onUpdate({ ...box, color: value });
  };

  const handleExcluderChange = (checked: boolean) => {
    onUpdate({ ...box, hasExcluder: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Box Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Box Type */}
        <div className="space-y-2">
          <Label htmlFor="box-type">Purpose</Label>
          <Select value={box.type} onValueChange={handleTypeChange}>
            <SelectTrigger id="box-type">
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
        <div className="space-y-2">
          <Label htmlFor="box-variant">Box Type</Label>
          <Select value={box.variant || ''} onValueChange={handleVariantChange}>
            <SelectTrigger id="box-variant">
              <SelectValue placeholder="Select box type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BoxVariantEnum.LANGSTROTH_DEEP}>
                Langstroth Deep
              </SelectItem>
              <SelectItem value={BoxVariantEnum.LANGSTROTH_SHALLOW}>
                Langstroth Shallow
              </SelectItem>
              <SelectItem value={BoxVariantEnum.B_DEEP}>B Deep</SelectItem>
              <SelectItem value={BoxVariantEnum.B_SHALLOW}>
                B Shallow
              </SelectItem>
              <SelectItem value={BoxVariantEnum.DADANT}>Dadant</SelectItem>
              <SelectItem value={BoxVariantEnum.NATIONAL_DEEP}>
                National Deep
              </SelectItem>
              <SelectItem value={BoxVariantEnum.NATIONAL_SHALLOW}>
                National Shallow
              </SelectItem>
              <SelectItem value={BoxVariantEnum.WARRE}>Warré</SelectItem>
              <SelectItem value={BoxVariantEnum.TOP_BAR}>Top Bar</SelectItem>
              <SelectItem value={BoxVariantEnum.CUSTOM}>Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Frame Count */}
        <div className="space-y-2">
          <Label htmlFor="frame-count">
            Frames: {box.frameCount} / {box.maxFrameCount || 10}
          </Label>
          <Slider
            id="frame-count"
            min={0}
            max={box.maxFrameCount || 10}
            step={1}
            value={[box.frameCount]}
            onValueChange={handleFrameCountChange}
          />
        </div>

        {/* Max Frame Count */}
        <div className="space-y-2">
          <Label htmlFor="max-frames">Maximum Frames</Label>
          <Input
            id="max-frames"
            type="number"
            min="0"
            max="20"
            value={box.maxFrameCount || 10}
            onChange={e => handleMaxFrameCountChange(e.target.value)}
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="box-color">Color</Label>
          <div className="flex gap-2">
            <Input
              id="box-color"
              type="color"
              value={box.color || '#CD853F'}
              onChange={e => handleColorChange(e.target.value)}
              className="h-10 w-20"
            />
            <Input
              type="text"
              value={box.color || '#CD853F'}
              onChange={e => handleColorChange(e.target.value)}
              placeholder="#CD853F"
              className="flex-1"
            />
          </div>
        </div>

        {/* Queen Excluder */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="queen-excluder"
            checked={box.hasExcluder}
            onCheckedChange={handleExcluderChange}
          />
          <Label
            htmlFor="queen-excluder"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Queen excluder above this box
          </Label>
        </div>

        {/* Color Presets */}
        <div className="space-y-2">
          <Label>Color Presets</Label>
          <div className="grid grid-cols-5 gap-2">
            {[
              '#ef4444', // red-500
              '#f97316', // orange-500
              '#f59e0b', // amber-500
              '#eab308', // yellow-500
              '#84cc16', // lime-500
              '#22c55e', // green-500
              '#10b981', // emerald-500
              '#14b8a6', // teal-500
              '#06b6d4', // cyan-500
              '#0ea5e9', // sky-500
              '#3b82f6', // blue-500
              '#6366f1', // indigo-500
              '#8b5cf6', // violet-500
              '#a855f7', // purple-500
              '#d946ef', // fuchsia-500
              '#ec4899', // pink-500
              '#f43f5e', // rose-500
              '#6b7280', // gray-500
              '#a16207', // yellow-700
              '#92400e', // amber-700
            ].map(color => (
              <button
                key={color}
                className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
