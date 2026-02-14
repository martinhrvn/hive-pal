import {
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Box,
  BoxTypeEnum,
  BoxVariantEnum,
  getHiveSystem,
  getEquivalentVariant,
  isVariantCompatible,
  findFrameSizeForVariant,
} from 'shared-schemas';
import { useFrameSizes } from '@/api/hooks';
import { BoxStack } from './BoxStack';
import { BoxConfigPanel } from './BoxConfigPanel';
import { CompactBoxConfig } from './CompactBoxConfig';

export interface BoxBuilderRef {
  getBoxes: () => Box[];
  setBoxes: (boxes: Box[]) => void;
}

interface BoxBuilderProps {
  initialBoxes?: Box[];
  onChange?: (boxes: Box[]) => void;
  simplified?: boolean;
}

export const BoxBuilder = forwardRef<BoxBuilderRef, BoxBuilderProps>(
  ({ initialBoxes = [], onChange, simplified = false }, ref) => {
    const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
    const { data: frameSizes = [] } = useFrameSizes();

    // Get main box variant (position 0)
    const mainBox = useMemo(
      () => boxes.find((b) => b.position === 0),
      [boxes],
    );
    useImperativeHandle(ref, () => ({
      getBoxes: () => boxes,
      setBoxes: (newBoxes: Box[]) => setBoxes(newBoxes),
    }));

    const handleAddBox = useCallback(() => {
      const defaultFs = findFrameSizeForVariant(
        frameSizes,
        BoxVariantEnum.LANGSTROTH_DEEP,
      );
      const newBox: Box = {
        id: `temp-${Date.now()}`,
        position: boxes.length,
        frameCount: 10,
        maxFrameCount: 10,
        hasExcluder: false,
        type: boxes.length === 0 ? BoxTypeEnum.BROOD : BoxTypeEnum.HONEY,
        variant: BoxVariantEnum.LANGSTROTH_DEEP,
        frameSizeId: defaultFs?.id ?? null,
        color: boxes.length === 0 ? '#3b82f6' : '#f59e0b',
      };
      const updatedBoxes = [...boxes, newBox];
      setBoxes(updatedBoxes);
      setSelectedBoxId(newBox.id ?? null);
      onChange?.(updatedBoxes);
    }, [boxes, onChange, frameSizes]);

    const handleRemoveBox = useCallback(
      (boxId: string) => {
        setBoxes(prevBoxes => {
          const filtered = prevBoxes.filter(b => b.id !== boxId);
          const reordered = filtered.map((box, index) => ({
            ...box,
            position: index,
          }));
          onChange?.(reordered);
          return reordered;
        });
        if (selectedBoxId === boxId) {
          setSelectedBoxId(null);
        }
      },
      [selectedBoxId, onChange],
    );

    const handleBoxUpdate = useCallback(
      (updatedBox: Box) => {
        setBoxes((prevBoxes) => {
          // If updating main box (position 0) variant, auto-convert incompatible boxes
          if (updatedBox.position === 0 && updatedBox.variant) {
            const newSystem = getHiveSystem(updatedBox.variant);

            const updated = prevBoxes.map((box) => {
              if (box.id === updatedBox.id) {
                return updatedBox;
              }

              // Check if other boxes need variant update
              if (
                box.variant &&
                !isVariantCompatible(updatedBox.variant, box.variant)
              ) {
                // Auto-convert to equivalent in new system
                const newVariant = getEquivalentVariant(box.variant, newSystem);
                const newFs = findFrameSizeForVariant(frameSizes, newVariant);
                return {
                  ...box,
                  variant: newVariant,
                  frameSizeId: newFs?.id ?? box.frameSizeId,
                };
              }

              return box;
            });
            onChange?.(updated);
            return updated;
          }

          const updated = prevBoxes.map((box) =>
            box.id === updatedBox.id ? updatedBox : box,
          );
          onChange?.(updated);
          return updated;
        });
      },
      [onChange, frameSizes],
    );

    const handleReorder = useCallback((newBoxes: Box[]) => {
      const sortedBoxes = [...newBoxes].sort((a, b) => a.position - b.position);
      const reorderedBoxes = sortedBoxes.map((box, index) => ({
        ...box,
        position: index,
      }));
      setBoxes(reorderedBoxes);
      onChange?.(reorderedBoxes);
    }, [onChange]);

    const selectedBox = boxes.find(b => b.id === selectedBoxId);

    if (simplified) {
      return (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Configure your hive's initial box setup. You can modify this later.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <BoxStack
                boxes={boxes}
                selectedBoxId={selectedBoxId}
                onSelectBox={setSelectedBoxId}
                onReorder={handleReorder}
                onRemoveBox={handleRemoveBox}
                isEditing={true}
                frameSizes={frameSizes}
              />

              <Button
                onClick={handleAddBox}
                variant="outline"
                className="w-full"
                type="button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Box
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50 h-fit">
              {selectedBox ? (
                <>
                  <div className="font-medium text-sm mb-3">Configure Selected Box</div>
                  <CompactBoxConfig
                    box={selectedBox}
                    onUpdate={handleBoxUpdate}
                    mainBoxFrameSizeId={mainBox?.frameSizeId ?? undefined}
                    isMainBox={selectedBox.position === 0}
                    frameSizes={frameSizes}
                  />
                </>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Click on a box to configure its properties
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <BoxStack
            boxes={boxes}
            selectedBoxId={selectedBoxId}
            onSelectBox={setSelectedBoxId}
            onReorder={handleReorder}
            onRemoveBox={handleRemoveBox}
            isEditing={true}
          />

          <Button
            onClick={handleAddBox}
            variant="outline"
            className="w-full"
            type="button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Box
          </Button>
        </div>

        {selectedBox && (
          <div className="lg:col-span-1">
            <BoxConfigPanel
              box={selectedBox}
              onUpdate={handleBoxUpdate}
              mainBoxFrameSizeId={mainBox?.frameSizeId ?? undefined}
              isMainBox={selectedBox.position === 0}
              frameSizes={frameSizes}
            />
          </div>
        )}
      </div>
    );
  }
);

BoxBuilder.displayName = 'BoxBuilder';