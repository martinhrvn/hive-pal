import { useState, useCallback, useMemo } from 'react';
import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Box,
  BoxTypeEnum,
  BoxVariantEnum,
  getHiveSystem,
  getEquivalentVariant,
  isVariantCompatible,
  findFrameSizeForVariant,
} from 'shared-schemas';
import { BoxStack } from '@/pages/hive/hive-detail-page/box-configurator/BoxStack';
import { BoxConfigPanel } from '@/pages/hive/hive-detail-page/box-configurator/BoxConfigPanel';
import { useFrameSizes } from '@/api/hooks';
import type { BoxConfigurationActionData } from '../schema';

const normalizeBoxSummary = (
  boxesSummary:
    | Array<{ type: string; frameCount: number }>
    | undefined,
  fallbackBoxes: Box[],
): Box[] | undefined => {
  if (!boxesSummary?.length) return undefined;

  return boxesSummary.map((summaryBox, index) => {
    const fallbackBox = fallbackBoxes[index];

    return {
      ...fallbackBox,
      hasExcluder: fallbackBox?.hasExcluder ?? false,
      maxFrameCount:
        fallbackBox?.maxFrameCount ?? Math.max(summaryBox.frameCount, 1),
      variant: fallbackBox?.variant,
      frameSizeId: fallbackBox?.frameSizeId ?? null,
      color: fallbackBox?.color,
      winterized: fallbackBox?.winterized ?? false,
      type: summaryBox.type as Box['type'],
      frameCount: summaryBox.frameCount,
      position: index,
    };
  });
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoxConfigurationFormProps {
  initialBoxes: Box[];
  hiveId?: string;
  onSave: (action: BoxConfigurationActionData) => void;
  onCancel: () => void;
}

interface BoxConfigurationViewProps {
  action: BoxConfigurationActionData;
  onRemove: () => void;
}

// ─── Diff helper ──────────────────────────────────────────────────────────────

function diffBoxes(
  before: Box[],
  after: Box[],
): Pick<
  BoxConfigurationActionData,
  'boxesAdded' | 'boxesRemoved' | 'framesAdded' | 'framesRemoved' | 'totalBoxes' | 'totalFrames'
> {
  const beforeCount = before.length;
  const afterCount = after.length;
  const boxesAdded = Math.max(0, afterCount - beforeCount);
  const boxesRemoved = Math.max(0, beforeCount - afterCount);

  const beforeFrames = before.reduce((s, b) => s + b.frameCount, 0);
  const afterFrames = after.reduce((s, b) => s + b.frameCount, 0);
  const framesAdded = Math.max(0, afterFrames - beforeFrames);
  const framesRemoved = Math.max(0, beforeFrames - afterFrames);

  return {
    boxesAdded,
    boxesRemoved,
    framesAdded,
    framesRemoved,
    totalBoxes: afterCount,
    totalFrames: afterFrames,
  };
}

// ─── Form (inside sheet) ──────────────────────────────────────────────────────

export const BoxConfigurationForm = ({
  initialBoxes,
  hiveId,
  onSave,
  onCancel,
}: BoxConfigurationFormProps) => {
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const { data: frameSizes = [] } = useFrameSizes();

  const mainBox = useMemo(() => boxes.find(b => b.position === 0), [boxes]);

  const handleAddBox = useCallback(() => {
    const defaultFs = findFrameSizeForVariant(frameSizes, BoxVariantEnum.LANGSTROTH_DEEP);
    const newBox: Box = {
      id: `temp-${Date.now()}`,
      position: boxes.length,
      frameCount: 10,
      maxFrameCount: 10,
      hasExcluder: false,
      type: boxes.length === 0 ? BoxTypeEnum.BROOD : BoxTypeEnum.HONEY,
      variant: BoxVariantEnum.LANGSTROTH_DEEP,
      frameSizeId: defaultFs?.id ?? null,
      color: '#3b82f6',
      winterized: false,
    };
    const updated = [...boxes, newBox];
    setBoxes(updated);
    setSelectedBoxId(newBox.id ?? null);
  }, [boxes, frameSizes]);

  const handleRemoveBox = useCallback(
    (boxId: string) => {
      setBoxes(prev => {
        const filtered = prev.filter(b => b.id !== boxId);
        return filtered.map((box, index) => ({ ...box, position: index }));
      });
      if (selectedBoxId === boxId) setSelectedBoxId(null);
    },
    [selectedBoxId],
  );

  const handleBoxUpdate = useCallback(
    (updatedBox: Box) => {
      setBoxes(prev => {
        if (updatedBox.position === 0 && updatedBox.variant) {
          const newSystem = getHiveSystem(updatedBox.variant);
          return prev.map(box => {
            if (box.id === updatedBox.id) return updatedBox;
            if (box.variant && !isVariantCompatible(updatedBox.variant, box.variant)) {
              const newVariant = getEquivalentVariant(box.variant, newSystem);
              const newFs = findFrameSizeForVariant(frameSizes, newVariant);
              return { ...box, variant: newVariant, frameSizeId: newFs?.id ?? box.frameSizeId };
            }
            return box;
          });
        }
        return prev.map(box => (box.id === updatedBox.id ? updatedBox : box));
      });
    },
    [frameSizes],
  );

  const handleReorder = useCallback((newBoxes: Box[]) => {
    const sorted = [...newBoxes].sort((a, b) => a.position - b.position);
    setBoxes(sorted.map((box, index) => ({ ...box, position: index })));
  }, []);

  const handleConfirm = () => {
    const diff = diffBoxes(initialBoxes, boxes);
    onSave({
      type: 'BOX_CONFIGURATION',
      ...diff,
      updatedBoxes: boxes,
    });
  };

  const selectedBox = boxes.find(b => b.id === selectedBoxId);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Instruction */}
      <p className="text-sm text-muted-foreground">
        Configure the hive's box stack. Changes will be recorded as an action on this inspection and applied to the hive when the inspection is saved.
      </p>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-auto">
        {/* Box stack visual */}
        <div className="flex-1 min-w-0">
          <BoxStack
            boxes={boxes}
            selectedBoxId={selectedBoxId}
            onSelectBox={setSelectedBoxId}
            onReorder={handleReorder}
            onRemoveBox={handleRemoveBox}
            isEditing={true}
            frameSizes={frameSizes}
            hiveId={hiveId}
          />

          <div className="flex justify-center mt-3">
            <Button
              onClick={handleAddBox}
              variant="outline"
              className="w-full max-w-xs"
              type="button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Box
            </Button>
          </div>
        </div>

        {/* Config panel for selected box */}
        {selectedBox && (
          <div className="lg:w-72 shrink-0">
            <BoxConfigPanel
              box={selectedBox}
              onUpdate={handleBoxUpdate}
              mainBoxFrameSizeId={mainBox?.frameSizeId ?? undefined}
              isMainBox={selectedBox.position === 0}
              frameSizes={frameSizes}
              hiveId={hiveId}
            />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 pt-2 border-t">
        <Button variant="outline" className="flex-1" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" type="button" onClick={handleConfirm}>
          Confirm Changes
        </Button>
      </div>
    </div>
  );
};

// ─── Trigger button + sheet wrapper ──────────────────────────────────────────

interface BoxConfigurationActionProps {
  initialBoxes: Box[];
  hiveId?: string;
  onSave: (action: BoxConfigurationActionData) => void;
  onRemove: () => void;
  existingAction?: BoxConfigurationActionData;
}

export const BoxConfigurationAction = ({
  initialBoxes,
  hiveId,
  onSave,
  onRemove,
  existingAction,
}: BoxConfigurationActionProps) => {
  const [open, setOpen] = useState(false);

  const handleSave = (action: BoxConfigurationActionData) => {
    onSave(action);
    setOpen(false);
  };

  // Determine the starting boxes for the sheet:
  // If there's already a recorded action with updatedBoxes, start from those
  const sheetInitialBoxes =
    existingAction?.updatedBoxes ??
    normalizeBoxSummary(existingAction?.boxesSummary, initialBoxes) ??
    initialBoxes;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Layers size={16} className="mr-1" />
        Box Configuration
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[90dvh] flex flex-col sm:h-[80dvh]"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Box Configuration
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-auto py-2">
            <BoxConfigurationForm
              initialBoxes={sheetInitialBoxes}
              hiveId={hiveId}
              onSave={handleSave}
              onCancel={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* If action already recorded, show a summary view inline */}
      {existingAction && (
        <BoxConfigurationView action={existingAction} onRemove={onRemove} />
      )}
    </>
  );
};

// ─── View (summary card shown in the actions list) ────────────────────────────

export const BoxConfigurationView = ({
  action,
  onRemove,
}: BoxConfigurationViewProps) => {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex items-center gap-3">
        <Layers className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <div className="font-medium text-sm">Box Configuration</div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {action.boxesAdded > 0 && (
              <div>+{action.boxesAdded} box{action.boxesAdded === 1 ? '' : 'es'} added</div>
            )}
            {action.boxesRemoved > 0 && (
              <div>−{action.boxesRemoved} box{action.boxesRemoved === 1 ? '' : 'es'} removed</div>
            )}
            {action.framesAdded > 0 && (
              <div>+{action.framesAdded} frame{action.framesAdded === 1 ? '' : 's'} added</div>
            )}
            {action.framesRemoved > 0 && (
              <div>−{action.framesRemoved} frame{action.framesRemoved === 1 ? '' : 's'} removed</div>
            )}
            <div>
              Total: {action.totalBoxes} box{action.totalBoxes === 1 ? '' : 'es'},{' '}
              {action.totalFrames} frame{action.totalFrames === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        Remove
      </Button>
    </div>
  );
};
