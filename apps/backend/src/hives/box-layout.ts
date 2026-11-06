import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { Box as PrismaBox, Prisma } from '@/prisma/client';
import {
  Box,
  BoxSnapshot,
  boxSnapshotSchema,
  isVariantCompatible,
} from 'shared-schemas';

/**
 * Hive box layout helpers shared by the hive box configurator endpoint and by
 * inspections that change the hive's boxes. Every write goes through the
 * caller's transaction so a box change commits together with whatever
 * recorded it.
 */

/** A box layout as either the API sends it or as it is stored. */
type LayoutInput = Box | BoxSnapshot;

export interface BoxLayoutDiff {
  boxesAdded: number;
  boxesRemoved: number;
  framesAdded: number;
  framesRemoved: number;
  totalBoxes: number;
  totalFrames: number;
}

const snapshotListSchema = z.array(boxSnapshotSchema);

/** Parses a stored snapshot column; undefined when absent or malformed. */
export const parseBoxSnapshots = (
  value: Prisma.JsonValue | null | undefined,
): BoxSnapshot[] | undefined => {
  if (value == null) return undefined;
  const parsed = snapshotListSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

/** The hive's boxes as a storable snapshot (no ids, ISO dates). */
export const toBoxSnapshots = (boxes: PrismaBox[]): BoxSnapshot[] =>
  [...boxes]
    .sort((a, b) => a.position - b.position)
    .map((box) => ({
      position: box.position,
      frameCount: box.frameCount,
      maxFrameCount: box.maxFrameCount,
      hasExcluder: box.hasExcluder,
      type: box.type as BoxSnapshot['type'],
      variant: (box.variant as BoxSnapshot['variant']) ?? null,
      frameSizeId: box.frameSizeId ?? null,
      color: box.color ?? null,
      addedAt: box.addedAt.toISOString(),
      winterized: box.winterized,
    }));

export const loadHiveBoxes = (
  tx: Prisma.TransactionClient,
  hiveId: string,
): Promise<PrismaBox[]> =>
  tx.box.findMany({ where: { hiveId }, orderBy: { position: 'asc' } });

const frameTotal = (boxes: { frameCount: number }[]) =>
  boxes.reduce((sum, box) => sum + (box.frameCount || 0), 0);

export const diffBoxLayouts = (
  before: { frameCount: number }[],
  after: { frameCount: number }[],
): BoxLayoutDiff => {
  const beforeFrames = frameTotal(before);
  const afterFrames = frameTotal(after);
  return {
    boxesAdded: Math.max(0, after.length - before.length),
    boxesRemoved: Math.max(0, before.length - after.length),
    framesAdded: Math.max(0, afterFrames - beforeFrames),
    framesRemoved: Math.max(0, beforeFrames - afterFrames),
    totalBoxes: after.length,
    totalFrames: afterFrames,
  };
};

export const hasLayoutChanges = (diff: BoxLayoutDiff) =>
  diff.boxesAdded > 0 ||
  diff.boxesRemoved > 0 ||
  diff.framesAdded > 0 ||
  diff.framesRemoved > 0;

/** Rejects layouts whose boxes don't fit the main (bottom) box's hive system. */
export const assertCompatibleVariants = (boxes: LayoutInput[]): void => {
  const mainVariant = boxes.find((b) => b.position === 0)?.variant;
  if (!mainVariant) return;
  const incompatible = boxes.filter(
    (b) =>
      b.position !== 0 &&
      b.variant &&
      !isVariantCompatible(mainVariant, b.variant),
  );
  if (incompatible.length > 0) {
    throw new BadRequestException(
      `Boxes at positions ${incompatible.map((b) => b.position).join(', ')} ` +
        `are not compatible with the main box variant (${mainVariant})`,
    );
  }
};

const toDate = (value: string | Date | null | undefined): Date | undefined => {
  if (value instanceof Date) return value;
  return value ? new Date(value) : undefined;
};

/**
 * Replaces the hive's boxes with `next`. Boxes are deleted and recreated
 * wholesale (nothing references Box.id). A box re-sent without addedAt keeps
 * the original one, matched by id and then by position.
 */
export const replaceHiveBoxes = async (
  tx: Prisma.TransactionClient,
  hiveId: string,
  previous: PrismaBox[],
  next: LayoutInput[],
): Promise<void> => {
  assertCompatibleVariants(next);

  const previousById = new Map(previous.map((box) => [box.id, box]));
  const previousByPosition = new Map(
    previous.map((box) => [box.position, box]),
  );
  const resolveAddedAt = (box: LayoutInput): Date => {
    const explicit = toDate(box.addedAt);
    if (explicit) return explicit;
    const id = 'id' in box ? box.id : undefined;
    const byId = id ? previousById.get(id) : undefined;
    return (
      byId?.addedAt ??
      previousByPosition.get(box.position)?.addedAt ??
      new Date()
    );
  };

  await tx.box.deleteMany({ where: { hiveId } });
  // Always let Prisma generate fresh ids: reusing client-supplied ones only
  // risks unique-constraint collisions.
  await tx.box.createMany({
    data: next.map((box) => ({
      hiveId,
      position: box.position,
      frameCount: box.frameCount,
      hasExcluder: box.hasExcluder,
      type: box.type,
      maxFrameCount: box.maxFrameCount ?? undefined,
      variant: box.variant ?? null,
      frameSizeId: box.frameSizeId ?? null,
      color: box.color ?? null,
      addedAt: resolveAddedAt(box),
      winterized: box.winterized ?? false,
    })),
  });
};
