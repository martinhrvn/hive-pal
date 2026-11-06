import { Prisma } from '@/prisma/client';
import {
  ActionType,
  BoxConfigurationActionDetails,
  BoxSnapshot,
  CreateAction,
  sameBoxLayout,
} from 'shared-schemas';
import {
  diffBoxLayouts,
  loadHiveBoxes,
  parseBoxSnapshots,
  replaceHiveBoxes,
  toBoxSnapshots,
} from '../hives/box-layout';

/**
 * Box changes recorded by an inspection. The inspection's BOX_CONFIGURATION
 * action may carry the hive's new layout; it is applied to the hive inside the
 * inspection's transaction, and the layouts before and after are kept on the
 * action so deleting the inspection can undo the change while the hive's
 * boxes are still exactly as the inspection left them.
 */

/** The inspection's stored box change, captured before its actions are replaced. */
export interface StoredBoxConfiguration {
  data: Prisma.BoxConfigurationActionUncheckedUpdateInput;
  previousBoxes?: BoxSnapshot[];
  /** Whether the hive's boxes still matched the inspection's result before this save. */
  unchangedSince: boolean;
}

const findBoxConfigRow = (tx: Prisma.TransactionClient, inspectionId: string) =>
  tx.boxConfigurationAction.findFirst({ where: { action: { inspectionId } } });

const incomingBoxConfiguration = (
  actions: CreateAction[] | undefined,
): BoxConfigurationActionDetails | undefined => {
  const details = actions?.find(
    (action) => action.details?.type === ActionType.BOX_CONFIGURATION,
  )?.details;
  return details?.type === ActionType.BOX_CONFIGURATION ? details : undefined;
};

const asJson = (snapshots: BoxSnapshot[]) =>
  snapshots as unknown as Prisma.InputJsonValue;

/** Reads the inspection's current box change so a re-save can keep it. */
export const captureBoxConfiguration = async (
  tx: Prisma.TransactionClient,
  inspectionId: string,
  hiveId: string,
): Promise<StoredBoxConfiguration | null> => {
  const row = await findBoxConfigRow(tx, inspectionId);
  if (!row) return null;
  const applied = parseBoxSnapshots(row.appliedBoxes);
  const unchangedSince = applied
    ? sameBoxLayout(toBoxSnapshots(await loadHiveBoxes(tx, hiveId)), applied)
    : false;
  return {
    data: {
      boxesAdded: row.boxesAdded,
      boxesRemoved: row.boxesRemoved,
      framesAdded: row.framesAdded,
      framesRemoved: row.framesRemoved,
      totalBoxes: row.totalBoxes,
      totalFrames: row.totalFrames,
      boxes: row.boxes ?? Prisma.DbNull,
      previousBoxes: row.previousBoxes ?? Prisma.DbNull,
      appliedBoxes: row.appliedBoxes ?? Prisma.DbNull,
    },
    previousBoxes: parseBoxSnapshots(row.previousBoxes),
    unchangedSince,
  };
};

/**
 * Applies the box change of a freshly (re)created set of inspection actions.
 * With a `layout`, the hive's boxes are replaced and the counts are computed
 * against the layout from before the inspection. Without one, a box change
 * saved earlier is kept as it was. Returns whether the stored "after" layout
 * should be refreshed once the save's other hive changes (frames) are done.
 */
export const applyBoxConfiguration = async (
  tx: Prisma.TransactionClient,
  inspectionId: string,
  hiveId: string,
  actions: CreateAction[] | undefined,
  stored: StoredBoxConfiguration | null,
): Promise<boolean> => {
  const incoming = incomingBoxConfiguration(actions);
  if (!incoming) return false;
  const row = await findBoxConfigRow(tx, inspectionId);
  if (!row) return false;

  if (!incoming.layout) {
    if (!stored) return false;
    await tx.boxConfigurationAction.update({
      where: { id: row.id },
      data: stored.data,
    });
    return stored.unchangedSince;
  }

  const current = await loadHiveBoxes(tx, hiveId);
  // When the inspection changes the boxes again, keep measuring (and undoing)
  // against the layout from before the inspection, unless the hive has been
  // changed by something else since: then the current boxes are the baseline.
  const before =
    stored?.unchangedSince && stored.previousBoxes
      ? stored.previousBoxes
      : toBoxSnapshots(current);
  await replaceHiveBoxes(tx, hiveId, current, incoming.layout);
  await tx.boxConfigurationAction.update({
    where: { id: row.id },
    data: {
      ...diffBoxLayouts(before, incoming.layout),
      boxes: incoming.layout.map(({ type, frameCount }) => ({
        type,
        frameCount,
      })),
      previousBoxes: asJson(before),
    },
  });
  return true;
};

/** Stores the hive's current boxes as the result of the inspection's change. */
export const recordAppliedLayout = async (
  tx: Prisma.TransactionClient,
  inspectionId: string,
  hiveId: string,
): Promise<void> => {
  const row = await findBoxConfigRow(tx, inspectionId);
  if (!row) return;
  await tx.boxConfigurationAction.update({
    where: { id: row.id },
    data: {
      appliedBoxes: asJson(toBoxSnapshots(await loadHiveBoxes(tx, hiveId))),
    },
  });
};

/**
 * Restores the hive's boxes from before the inspection, if the hive's boxes
 * are still exactly as the inspection left them. Returns whether it did.
 */
export const revertBoxConfiguration = async (
  tx: Prisma.TransactionClient,
  inspectionId: string,
  hiveId: string,
): Promise<boolean> => {
  const row = await findBoxConfigRow(tx, inspectionId);
  const previous = parseBoxSnapshots(row?.previousBoxes);
  const applied = parseBoxSnapshots(row?.appliedBoxes);
  if (!previous || !applied) return false;

  const current = await loadHiveBoxes(tx, hiveId);
  if (!sameBoxLayout(toBoxSnapshots(current), applied)) return false;

  await replaceHiveBoxes(tx, hiveId, current, previous);
  return true;
};
