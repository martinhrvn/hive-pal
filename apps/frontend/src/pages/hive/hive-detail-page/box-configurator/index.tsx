import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Save, X, Snowflake } from 'lucide-react';
import {
  HiveDetailResponse,
  Box,
  BoxTypeEnum,
  BoxVariantEnum,
  getHiveSystem,
  getEquivalentVariant,
  isVariantCompatible,
} from 'shared-schemas';
import { BoxStack } from './BoxStack';
import { BoxConfigPanel } from './BoxConfigPanel';
import { useUpdateHiveBoxes } from '@/api/hooks/useHives';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BoxConfiguratorProps {
  hive: HiveDetailResponse | undefined;
}

export const BoxConfigurator = ({ hive }: BoxConfiguratorProps) => {
  const [boxes, setBoxes] = useState<Box[]>(hive?.boxes || []);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const updateBoxesMutation = useUpdateHiveBoxes();

  // Get main box variant (position 0)
  const mainBox = useMemo(
    () => boxes.find((b) => b.position === 0),
    [boxes],
  );
  const mainBoxVariant = mainBox?.variant;

  // Check winterization status
  const allWinterized = useMemo(
    () => boxes.length > 0 && boxes.every((b) => b.winterized),
    [boxes],
  );
  const anyWinterized = useMemo(
    () => boxes.some((b) => b.winterized),
    [boxes],
  );

  const handleWinterizeAll = useCallback((winterized: boolean) => {
    setBoxes((prevBoxes) =>
      prevBoxes.map((box) => ({ ...box, winterized })),
    );
  }, []);

  const handleAddBox = useCallback(() => {
    const newBox: Box = {
      id: `temp-${Date.now()}`,
      position: boxes.length,
      frameCount: 10,
      maxFrameCount: 10,
      hasExcluder: false,
      type: BoxTypeEnum.BROOD,
      variant: BoxVariantEnum.LANGSTROTH_DEEP,
      color: '#3b82f6', // blue-500
    };
    setBoxes([...boxes, newBox]);
    setSelectedBoxId(newBox.id ?? null);
    setIsEditing(true);
  }, [boxes]);

  const handleRemoveBox = useCallback(
    (boxId: string) => {
      setBoxes(prevBoxes => {
        const filtered = prevBoxes.filter(b => b.id !== boxId);
        // Recalculate positions
        return filtered.map((box, index) => ({
          ...box,
          position: index,
        }));
      });
      if (selectedBoxId === boxId) {
        setSelectedBoxId(null);
      }
    },
    [selectedBoxId],
  );

  const handleBoxUpdate = useCallback((updatedBox: Box) => {
    setBoxes((prevBoxes) => {
      // If updating main box (position 0) variant, auto-convert incompatible boxes
      if (updatedBox.position === 0 && updatedBox.variant) {
        const newSystem = getHiveSystem(updatedBox.variant);

        return prevBoxes.map((box) => {
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
            return { ...box, variant: newVariant };
          }

          return box;
        });
      }

      return prevBoxes.map((box) =>
        box.id === updatedBox.id ? updatedBox : box,
      );
    });
  }, []);

  const handleReorder = useCallback((newBoxes: Box[]) => {
    // Sort by position and ensure positions are sequential
    const sortedBoxes = [...newBoxes].sort((a, b) => a.position - b.position);
    const reorderedBoxes = sortedBoxes.map((box, index) => ({
      ...box,
      position: index,
    }));
    setBoxes(reorderedBoxes);
  }, []);

  const handleSave = async () => {
    if (!hive?.id) return;

    try {
      await updateBoxesMutation.mutateAsync({
        id: hive.id,
        boxes: boxes.map(box => ({
          ...box,
          // Remove temporary IDs
          id: box.id?.startsWith('temp-') ? undefined : box.id,
        })),
      });
      toast.success('Box configuration saved successfully');
      setIsEditing(false);
    } catch {
      toast.error('Failed to save box configuration');
    }
  };

  const handleCancel = () => {
    setBoxes(hive?.boxes || []);
    setIsEditing(false);
    setSelectedBoxId(null);
  };

  const selectedBox = boxes.find(b => b.id === selectedBoxId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Box Configuration</CardTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={() => handleWinterizeAll(!allWinterized)}
                      variant="outline"
                      size="sm"
                      title={
                        allWinterized
                          ? 'Remove winterization'
                          : 'Winterize all boxes'
                      }
                    >
                      <Snowflake
                        className={cn(
                          'h-4 w-4 mr-1',
                          anyWinterized && 'text-blue-500',
                        )}
                      />
                      {allWinterized ? 'Unwinterize' : 'Winterize All'}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="sm"
                      disabled={updateBoxesMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    size="sm"
                    variant="outline"
                  >
                    Edit Configuration
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Visualize and configure your hive's box stack. Boxes are shown
                from bottom to top.
              </p>

              <BoxStack
                boxes={boxes}
                selectedBoxId={selectedBoxId}
                onSelectBox={setSelectedBoxId}
                onReorder={handleReorder}
                onRemoveBox={handleRemoveBox}
                isEditing={isEditing}
              />

              {isEditing && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleAddBox}
                    variant="outline"
                    className="w-full max-w-xs"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Box
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isEditing && selectedBox && (
        <div className="lg:col-span-1">
          <BoxConfigPanel
            box={selectedBox}
            onUpdate={handleBoxUpdate}
            mainBoxVariant={mainBoxVariant}
            isMainBox={selectedBox.position === 0}
          />
        </div>
      )}
    </div>
  );
};
