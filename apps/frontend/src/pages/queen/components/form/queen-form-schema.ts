import { z } from 'zod';
import type { TFunction } from 'i18next';
import {
  queenMatingTypeSchema,
  queenStatusSchema,
  type QueenDetail,
  type CreateQueen,
} from 'shared-schemas';

// Queens are kept a handful of years; older entries are almost always typos.
const MAX_QUEEN_AGE_YEARS = 10;

const text = (max = 200) => z.string().trim().max(max);
const rating = z.number().int().min(1).max(5).nullable();

export const createQueenFormSchema = (
  t: TFunction,
  { requireHive }: { requireHive: boolean },
) =>
  z
    .object({
      hiveId: z.string(),
      name: text(),
      year: z.number().int().nullable(),
      color: z.string(),
      marking: text(),
      status: queenStatusSchema,
      source: text(),
      breeder: text(),
      line: text(),
      motherQueenId: z.string(),
      matingType: queenMatingTypeSchema.nullable(),
      matingStation: text(),
      matedAt: z.date().nullable(),
      installedAt: z.date(),
      replacedAt: z.date().nullable(),
      gentleness: rating,
      hygiene: rating,
      swarmResistance: rating,
      honeyProduction: rating,
      notes: text(5000),
    })
    .superRefine((values, ctx) => {
      if (requireHive && !values.hiveId) {
        ctx.addIssue({
          code: 'custom',
          path: ['hiveId'],
          message: t('queen:validation.hiveRequired'),
        });
      }
      // Evaluated per submit so the range stays right across a new year.
      const max = new Date().getFullYear();
      const min = max - MAX_QUEEN_AGE_YEARS + 1;
      if (values.year == null || values.year < min || values.year > max) {
        ctx.addIssue({
          code: 'custom',
          path: ['year'],
          message: t('queen:validation.yearRange', { min, max }),
        });
      }
    });

export type QueenFormValues = z.infer<ReturnType<typeof createQueenFormSchema>>;

const toDate = (iso: string | null | undefined) => (iso ? new Date(iso) : null);

export const getQueenFormDefaults = ({
  queen,
  hiveId,
  motherQueenId,
}: {
  queen?: QueenDetail;
  hiveId?: string;
  motherQueenId?: string;
}): QueenFormValues => ({
  hiveId: queen?.hiveId ?? hiveId ?? '',
  name: queen?.name ?? '',
  year: queen ? queen.year : new Date().getFullYear(),
  color: queen?.color ?? '',
  marking: queen?.marking ?? '',
  status: queen?.status ?? 'ACTIVE',
  source: queen?.source ?? '',
  breeder: queen?.breeder ?? '',
  line: queen?.line ?? '',
  motherQueenId: queen?.motherQueenId ?? motherQueenId ?? '',
  matingType: queen?.matingType ?? null,
  matingStation: queen?.matingStation ?? '',
  matedAt: toDate(queen?.matedAt),
  installedAt: toDate(queen?.installedAt) ?? new Date(),
  replacedAt: toDate(queen?.replacedAt),
  gentleness: queen?.gentleness ?? null,
  hygiene: queen?.hygiene ?? null,
  swarmResistance: queen?.swarmResistance ?? null,
  honeyProduction: queen?.honeyProduction ?? null,
  notes: queen?.notes ?? '',
});

const orNull = (value: string) => value || null;

/** Form values to the API payload. `hiveId` is left to the caller. */
export const toQueenPayload = (
  values: QueenFormValues,
): Omit<CreateQueen, 'hiveId'> => ({
  name: orNull(values.name),
  year: values.year,
  color: orNull(values.color),
  marking: orNull(values.marking),
  status: values.status,
  source: orNull(values.source),
  breeder: orNull(values.breeder),
  line: orNull(values.line),
  motherQueenId: orNull(values.motherQueenId),
  matingType: values.matingType,
  // A station only makes sense for station mating
  matingStation:
    values.matingType === 'MATING_STATION'
      ? orNull(values.matingStation)
      : null,
  matedAt: values.matedAt?.toISOString() ?? null,
  installedAt: values.installedAt.toISOString(),
  replacedAt: values.replacedAt?.toISOString() ?? null,
  gentleness: values.gentleness,
  hygiene: values.hygiene,
  swarmResistance: values.swarmResistance,
  honeyProduction: values.honeyProduction,
  notes: orNull(values.notes),
});
