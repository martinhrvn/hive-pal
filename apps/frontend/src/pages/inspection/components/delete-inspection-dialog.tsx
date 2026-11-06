import { useTranslation } from 'react-i18next';
import {
  ActionType,
  type ActionResponse,
  type BoxConfigurationActionDetails,
  type Box,
  sameBoxLayout,
} from 'shared-schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteInspectionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly actions: ActionResponse[];
  /** The hive's current boxes; undefined while the hive is loading. */
  readonly hiveBoxes: Box[] | undefined;
  readonly isPending: boolean;
  readonly onDelete: (revertHiveChanges: boolean) => void;
}

type Translate = ReturnType<typeof useTranslation>['t'];

const frameChangeLabel = (delta: number, t: Translate) =>
  t('inspection:detailSidebar.frameChange', {
    change: t(
      delta > 0
        ? 'inspection:boxConfigAction.framesAdded'
        : 'inspection:boxConfigAction.framesRemoved',
      { count: Math.abs(delta) },
    ),
  });

const boxChangeLabel = (
  details: BoxConfigurationActionDetails,
  t: Translate,
) => {
  const changes = [
    ['boxesAdded', details.boxesAdded],
    ['boxesRemoved', details.boxesRemoved],
    ['framesAdded', details.framesAdded],
    ['framesRemoved', details.framesRemoved],
  ] as const;
  const parts = changes
    .filter(([, count]) => count > 0)
    .map(([key, count]) => t(`inspection:boxConfigAction.${key}`, { count }));
  // A change that only rearranged boxes has no counts: show the result instead.
  const summary =
    parts.length > 0
      ? parts.join(', ')
      : t('inspection:boxConfigAction.total', {
          boxes: t('inspection:boxConfigAction.boxCount', {
            count: details.totalBoxes,
          }),
          frames: t('inspection:boxConfigAction.frameCount', {
            count: details.totalFrames,
          }),
        });
  return t('inspection:detailSidebar.boxChange', { changes: summary });
};

/**
 * What deleting an inspection can undo on the hive. Restoring the box layout
 * from before the inspection also covers its frame changes; it is only
 * possible while the hive's boxes still match what the inspection left.
 */
const getHiveChanges = (
  actions: ActionResponse[],
  hiveBoxes: Box[] | undefined,
) => {
  let frameDelta = 0;
  let boxChange: BoxConfigurationActionDetails | undefined;
  for (const { details } of actions) {
    if (details.type === ActionType.FRAME) frameDelta += details.quantity;
    if (details.type === ActionType.BOX_CONFIGURATION) boxChange = details;
  }

  const boxUndoable = Boolean(
    boxChange?.appliedLayout &&
    hiveBoxes &&
    sameBoxLayout(hiveBoxes, boxChange.appliedLayout),
  );
  return { frameDelta, boxChange, boxUndoable };
};

export const DeleteInspectionDialog = ({
  open,
  onOpenChange,
  actions,
  hiveBoxes,
  isPending,
  onDelete,
}: DeleteInspectionDialogProps) => {
  const { t } = useTranslation(['inspection', 'common']);
  const { frameDelta, boxChange, boxUndoable } = getHiveChanges(
    actions,
    hiveBoxes,
  );

  const undoItems: string[] = [];
  if (boxChange && boxUndoable) undoItems.push(boxChangeLabel(boxChange, t));
  if (frameDelta !== 0) undoItems.push(frameChangeLabel(frameDelta, t));
  const canUndo = undoItems.length > 0;
  const boxChangeLocked = Boolean(boxChange) && !boxUndoable;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('inspection:detailSidebar.deleteInspection')}
          </DialogTitle>
          <DialogDescription>
            {canUndo
              ? t('inspection:detailSidebar.hiveChangesDescription')
              : t('common:messages.confirmDelete')}
          </DialogDescription>
        </DialogHeader>

        {(canUndo || boxChangeLocked) && (
          <div className="space-y-3 text-sm">
            {canUndo && (
              <div className="space-y-1">
                <p className="font-medium">
                  {t('inspection:detailSidebar.undoListTitle')}
                </p>
                <ul
                  data-test="delete-inspection-undo-list"
                  className="list-disc space-y-0.5 pl-5 text-muted-foreground"
                >
                  {undoItems.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {boxChangeLocked && (
              <p
                data-test="delete-inspection-box-locked"
                className="text-muted-foreground"
              >
                {t('inspection:detailSidebar.boxChangeNotUndoable')}
              </p>
            )}
          </div>
        )}

        {canUndo ? (
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
            <Button
              data-test="delete-inspection-undo"
              onClick={() => onDelete(true)}
              variant="destructive"
              className="w-full"
              disabled={isPending}
            >
              {t('inspection:detailSidebar.deleteUndoHiveChanges')}
            </Button>
            <Button
              data-test="delete-inspection-keep"
              onClick={() => onDelete(false)}
              variant="outline"
              className="w-full"
              disabled={isPending}
            >
              {t('inspection:detailSidebar.deleteKeepHive')}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('common:actions.cancel')}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              data-test="delete-inspection-confirm"
              onClick={() => onDelete(false)}
              variant="destructive"
              disabled={isPending}
            >
              {isPending
                ? t('common:actions.deleting')
                : t('common:actions.delete')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
