import { useMemo, useState } from 'react';
import {
  Box,
  BoxTypeEnum,
  BoxVariantEnum,
  FrameSize,
  FrameSizeStatus,
  getVariantForFrameSize,
  getCompatibleFrameSizes,
} from 'shared-schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useSubmitFrameSize, useUserProfile } from '@/api/hooks';
import { ActionResponse } from 'shared-schemas';
import { MaintenanceInline } from './MaintenancePopover';
import { useTranslation } from 'react-i18next';

const DEFAULT_BOX_COLOR = '#CD853F';

const COLOR_PRESETS = [
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
];

interface BoxConfigPanelProps {
  box: Box;
  onUpdate: (box: Box) => void;
  mainBoxFrameSizeId?: string;
  isMainBox?: boolean;
  frameSizes?: FrameSize[];
  hiveId?: string;
  lastBoxMaintenance?: ActionResponse;
}

export const BoxConfigPanel = ({
  box,
  onUpdate,
  mainBoxFrameSizeId,
  isMainBox,
  frameSizes = [],
  hiveId,
  lastBoxMaintenance,
}: BoxConfigPanelProps) => {
  const { t } = useTranslation(['hive', 'common']);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [newFrameSize, setNewFrameSize] = useState({
    name: '',
    width: 0,
    height: 0,
    depth: 0,
  });
  const submitFrameSize = useSubmitFrameSize();
  const { data: currentUser } = useUserProfile();
  const currentUserId = currentUser?.id;

  // Filter frame sizes for secondary boxes by compatibility with main box
  const availableFrameSizes = useMemo(() => {
    if (isMainBox || !mainBoxFrameSizeId) return frameSizes;
    const mainFs = frameSizes.find(fs => fs.id === mainBoxFrameSizeId);
    if (!mainFs) return frameSizes;
    return getCompatibleFrameSizes(frameSizes, mainFs);
  }, [frameSizes, isMainBox, mainBoxFrameSizeId]);

  const builtInSizes = useMemo(
    () => availableFrameSizes.filter(fs => fs.isBuiltIn),
    [availableFrameSizes],
  );
  const communitySizes = useMemo(
    () =>
      availableFrameSizes.filter(
        fs =>
          !fs.isBuiltIn &&
          fs.status === FrameSizeStatus.APPROVED &&
          fs.createdByUserId !== currentUserId,
      ),
    [availableFrameSizes, currentUserId],
  );
  const mySizes = useMemo(
    () =>
      availableFrameSizes.filter(fs => fs.createdByUserId === currentUserId),
    [availableFrameSizes, currentUserId],
  );

  const handleFrameSizeChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomFields(true);
      return;
    }
    setShowCustomFields(false);
    if (value === '__none__') {
      onUpdate({ ...box, frameSizeId: null });
      return;
    }
    const selectedFs = frameSizes.find(fs => fs.id === value);
    const variant = selectedFs
      ? getVariantForFrameSize(selectedFs)
      : box.variant;
    onUpdate({ ...box, frameSizeId: value, variant });
  };

  const handleCustomSubmit = () => {
    submitFrameSize.mutate(newFrameSize, {
      onSuccess: created => {
        setShowCustomFields(false);
        setNewFrameSize({ name: '', width: 0, height: 0, depth: 0 });
        onUpdate({
          ...box,
          frameSizeId: created.id,
          variant: BoxVariantEnum.CUSTOM,
        });
      },
    });
  };

  const handleTypeChange = (value: string) => {
    onUpdate({ ...box, type: value as BoxTypeEnum });
  };

  const handleWinterizedChange = (checked: boolean) => {
    onUpdate({ ...box, winterized: checked });
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
        <CardTitle className="text-lg">
          {t('hive:boxConfigurator.boxProperties')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Box Type */}
        <div className="space-y-2">
          <Label htmlFor="box-type">{t('hive:boxConfigurator.purpose')}</Label>
          <Select value={box.type} onValueChange={handleTypeChange}>
            <SelectTrigger id="box-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BoxTypeEnum.BROOD}>
                {t('hive:boxConfigurator.boxTypes.brood')}
              </SelectItem>
              <SelectItem value={BoxTypeEnum.HONEY}>
                {t('hive:boxConfigurator.boxTypes.honey')}
              </SelectItem>
              <SelectItem value={BoxTypeEnum.FEEDER}>
                {t('hive:boxConfigurator.boxTypes.feeder')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Frame Size */}
        {availableFrameSizes.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="frame-size">
              {t('hive:boxConfigurator.frameSize')}
            </Label>
            <Select
              value={
                showCustomFields ? '__custom__' : box.frameSizeId || '__none__'
              }
              onValueChange={handleFrameSizeChange}
            >
              <SelectTrigger id="frame-size">
                <SelectValue
                  placeholder={t('hive:boxConfigurator.noFrameSizeSelected')}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  {t('hive:boxConfigurator.noFrameSize')}
                </SelectItem>
                {builtInSizes.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t('hive:boxConfigurator.builtIn')}
                    </SelectLabel>
                    {builtInSizes.map(fs => (
                      <SelectItem key={fs.id} value={fs.id}>
                        {t('hive:boxConfigurator.frameSizeOption', {
                          name: fs.name,
                          width: fs.width,
                          height: fs.height,
                          depth: fs.depth,
                        })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {communitySizes.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t('hive:boxConfigurator.community')}
                    </SelectLabel>
                    {communitySizes.map(fs => (
                      <SelectItem key={fs.id} value={fs.id}>
                        {t('hive:boxConfigurator.frameSizeOption', {
                          name: fs.name,
                          width: fs.width,
                          height: fs.height,
                          depth: fs.depth,
                        })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {mySizes.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t('hive:boxConfigurator.mySizes')}
                    </SelectLabel>
                    {mySizes.map(fs => (
                      <SelectItem key={fs.id} value={fs.id}>
                        {t('hive:boxConfigurator.frameSizeOption', {
                          name: fs.name,
                          width: fs.width,
                          height: fs.height,
                          depth: fs.depth,
                        })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                <SelectItem value="__custom__">
                  {t('hive:boxConfigurator.customFrameSize')}
                </SelectItem>
              </SelectContent>
            </Select>
            {showCustomFields && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="space-y-2">
                  <Label htmlFor="fs-name">{t('hive:fields.name')}</Label>
                  <Input
                    id="fs-name"
                    value={newFrameSize.name}
                    onChange={e =>
                      setNewFrameSize({ ...newFrameSize, name: e.target.value })
                    }
                    placeholder={t(
                      'hive:boxConfigurator.frameSizeNamePlaceholder',
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fs-width">
                      {t('hive:boxConfigurator.widthMm')}
                    </Label>
                    <Input
                      id="fs-width"
                      type="number"
                      min="1"
                      value={newFrameSize.width || ''}
                      onChange={e =>
                        setNewFrameSize({
                          ...newFrameSize,
                          width: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fs-height">
                      {t('hive:boxConfigurator.heightMm')}
                    </Label>
                    <Input
                      id="fs-height"
                      type="number"
                      min="1"
                      value={newFrameSize.height || ''}
                      onChange={e =>
                        setNewFrameSize({
                          ...newFrameSize,
                          height: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fs-depth">
                      {t('hive:boxConfigurator.depthMm')}
                    </Label>
                    <Input
                      id="fs-depth"
                      type="number"
                      min="1"
                      value={newFrameSize.depth || ''}
                      onChange={e =>
                        setNewFrameSize({
                          ...newFrameSize,
                          depth: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomFields(false)}
                  >
                    {t('common:actions.cancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCustomSubmit}
                    disabled={
                      submitFrameSize.isPending ||
                      !newFrameSize.name ||
                      !newFrameSize.width ||
                      !newFrameSize.height ||
                      !newFrameSize.depth
                    }
                  >
                    {submitFrameSize.isPending
                      ? t('hive:boxConfigurator.submitting')
                      : t('hive:form.submit')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Frame Count */}
        <div className="space-y-2">
          <Label htmlFor="frame-count">
            {t('hive:boxConfigurator.frameCountOf', {
              count: box.frameCount,
              max: box.maxFrameCount || 10,
            })}
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
          <Label htmlFor="max-frames">
            {t('hive:boxConfigurator.maximumFrames')}
          </Label>
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
          <Label htmlFor="box-color">{t('hive:boxConfigurator.color')}</Label>
          <div className="flex gap-2">
            <Input
              id="box-color"
              type="color"
              value={box.color || DEFAULT_BOX_COLOR}
              onChange={e => handleColorChange(e.target.value)}
              className="h-10 w-20"
            />
            <Input
              type="text"
              value={box.color || DEFAULT_BOX_COLOR}
              onChange={e => handleColorChange(e.target.value)}
              placeholder={DEFAULT_BOX_COLOR}
              className="flex-1"
            />
          </div>
        </div>

        {/* Queen Excluder */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="queen-excluder"
            checked={box.hasExcluder}
            onCheckedChange={checked => handleExcluderChange(checked === true)}
          />
          <Label
            htmlFor="queen-excluder"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t('hive:boxConfigurator.queenExcluder')}
          </Label>
        </div>

        {/* Winterized */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="winterized"
            checked={box.winterized ?? false}
            onCheckedChange={checked =>
              handleWinterizedChange(checked === true)
            }
          />
          <Label
            htmlFor="winterized"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t('hive:boxConfigurator.winterized')}
          </Label>
        </div>

        {/* Color Presets */}
        <div className="space-y-2">
          <Label>{t('hive:boxConfigurator.colorPresets')}</Label>
          <div className="grid grid-cols-5 gap-2">
            {COLOR_PRESETS.map(color => (
              <button
                key={color}
                type="button"
                className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                style={{ backgroundColor: color }}
                onClick={e => {
                  e.preventDefault();
                  handleColorChange(color);
                }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Maintenance */}
        {hiveId && (
          <div className="space-y-2 border-t pt-4">
            <Label>{t('hive:boxConfigurator.maintenance')}</Label>
            <MaintenanceInline
              hiveId={hiveId}
              component="BOX"
              lastMaintenance={lastBoxMaintenance}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
