import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FrameSize, FrameSizeStatus, UpdateFrameSizeDto } from 'shared-schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

/**
 * Shared editor for a custom frame size, used by the user settings card and
 * the admin review tables. Dimensions live on the shared catalogue row, so an
 * edit reaches every box that references the size — the dialog says so when
 * the size is already approved and therefore visible to other beekeepers.
 *
 * The draft is seeded once from `frameSize`; consumers should pass a `key`
 * that changes per row (e.g. the id) so switching rows resets the form.
 */

type Draft = {
  name: string;
  width: string;
  height: string;
  depth: string;
};

const toDraft = (frameSize: FrameSize): Draft => ({
  name: frameSize.name,
  width: String(frameSize.width),
  height: String(frameSize.height),
  depth: String(frameSize.depth),
});

const parseDimension = (value: string): number | null => {
  if (value.trim() === '') return null;
  // Accept the decimal comma users type on a Slovak keyboard.
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

interface FrameSizeEditDialogProps {
  frameSize: FrameSize;
  onClose: () => void;
  onSave: (id: string, data: UpdateFrameSizeDto) => Promise<void>;
}

export const FrameSizeEditDialog = ({
  frameSize,
  onClose,
  onSave,
}: FrameSizeEditDialogProps) => {
  const { t } = useTranslation('common');
  const [draft, setDraft] = useState<Draft>(() => toDraft(frameSize));
  const [isSaving, setIsSaving] = useState(false);

  const width = parseDimension(draft.width);
  const height = parseDimension(draft.height);
  const depth = parseDimension(draft.depth);
  const name = draft.name.trim();
  const canSave =
    name.length >= 2 &&
    width !== null &&
    height !== null &&
    depth !== null &&
    !isSaving;
  const isShared = frameSize.status === FrameSizeStatus.APPROVED;

  const handleSubmit = async () => {
    if (!canSave || width === null || height === null || depth === null) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(frameSize.id, { name, width, height, depth });
      onClose();
    } catch {
      // Keep the draft open; the mutation's onError toast explains why.
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={nextOpen => {
        if (!nextOpen && !isSaving) onClose();
      }}
    >
      <DialogContent data-test="frame-size-edit-dialog">
        <form
          className="space-y-4"
          onSubmit={event => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('frameSizeEdit.title')}</DialogTitle>
            <DialogDescription>
              {t('frameSizeEdit.description')}
            </DialogDescription>
          </DialogHeader>

          {isShared && (
            <p
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
              data-test="frame-size-edit-shared-notice"
            >
              {t('frameSizeEdit.sharedNotice')}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="frame-size-edit-name">
              {t('frameSizeEdit.name')}
            </Label>
            <Input
              id="frame-size-edit-name"
              data-test="frame-size-edit-name"
              value={draft.name}
              onChange={event =>
                setDraft(previous => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="frame-size-edit-width">
                {t('frameSizeEdit.width')}
              </Label>
              <Input
                id="frame-size-edit-width"
                data-test="frame-size-edit-width"
                inputMode="decimal"
                value={draft.width}
                onChange={event =>
                  setDraft(previous => ({
                    ...previous,
                    width: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frame-size-edit-height">
                {t('frameSizeEdit.height')}
              </Label>
              <Input
                id="frame-size-edit-height"
                data-test="frame-size-edit-height"
                inputMode="decimal"
                value={draft.height}
                onChange={event =>
                  setDraft(previous => ({
                    ...previous,
                    height: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frame-size-edit-depth">
                {t('frameSizeEdit.depth')}
              </Label>
              <Input
                id="frame-size-edit-depth"
                data-test="frame-size-edit-depth"
                inputMode="decimal"
                value={draft.depth}
                onChange={event =>
                  setDraft(previous => ({
                    ...previous,
                    depth: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              data-test="frame-size-edit-save"
              disabled={!canSave}
            >
              {isSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {t('actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
