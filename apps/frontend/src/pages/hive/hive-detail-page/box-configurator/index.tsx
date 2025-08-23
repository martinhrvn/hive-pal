import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Save, X } from 'lucide-react';
import {
  HiveDetailResponse,
  Box,
  BoxTypeEnum,
  BoxVariantEnum,
} from 'shared-schemas';
import { BoxStack } from './BoxStack';
import { BoxConfigPanel } from './BoxConfigPanel';
import { useUpdateHiveBoxes } from '@/api/hooks/useHives';
import { toast } from 'sonner';

interface BoxConfiguratorProps {
  hive: HiveDetailResponse | undefined;
}

export const BoxConfigurator = ({ hive }: BoxConfiguratorProps) => {
  const [boxes, setBoxes] = useState<Box[]>(hive?.boxes || []);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const updateBoxesMutation = useUpdateHiveBoxes();

  const handleAddBox = useCallback(() => {
    const newBox: Box = {
      id: `temp-${Date.now()}`,
      position: boxes.length,
      frameCount: 10,
      maxFrameCount: 10,
      hasExcluder: false,
      type: BoxTypeEnum.BROOD,
      variant: BoxVariantEnum.LANGSTROTH_DEEP,
      color: '#8B4513',
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
    setBoxes(prevBoxes =>
      prevBoxes.map(box => (box.id === updatedBox.id ? updatedBox : box)),
    );
  }, []);

  const handleReorder = useCallback((newBoxes: Box[]) => {
    // Update positions based on new order
    const reorderedBoxes = newBoxes.map((box, index) => ({
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
    } catch (error) {
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
          <BoxConfigPanel box={selectedBox} onUpdate={handleBoxUpdate} />
        </div>
      )}
    </div>
  );
};
