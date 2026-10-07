import { z } from 'zod';
import {
  additionalObservationSchema,
  broodPatternSchema,
  reminderObservationSchema,
} from './observations.schema';
import {
  maintenanceComponentSchema,
  maintenanceStatusSchema,
} from '../actions/details.schema';

/**
 * Schema for AI-generated inspection drafts (voice transcript → structured
 * inspection). This is the single contract between the AI service
 * (apps/ai-app), the backend (which stores the draft), and the frontend
 * (which turns it into per-field form suggestions).
 *
 * The draft mirrors createInspectionSchema (canonical API shape) but is
 * lenient by design: every value the model may get wrong degrades to null /
 * is dropped via `.catch()` instead of failing the whole draft, because a
 * partially usable draft is always better than none.
 */

// Weather values match the inspection form's weather picker options.
export const aiWeatherConditionSchema = z.enum([
  'sunny',
  'partly-cloudy',
  'cloudy',
  'rainy',
]);

const lenient = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().catch(null);

// Enum arrays keep the valid entries and silently drop invalid ones.
const lenientEnumArray = <T extends z.ZodType<string>>(item: T) =>
  z
    .array(z.unknown())
    .nullish()
    .catch(null)
    .transform(values =>
      (values ?? []).flatMap(value => {
        const parsed = item.safeParse(value);
        return parsed.success ? [parsed.data] : [];
      }),
    );

export const aiDraftObservationsSchema = z.object({
  strength: lenient(z.number().int().min(0)),
  uncappedBrood: lenient(z.number().int().min(0).max(10)),
  cappedBrood: lenient(z.number().int().min(0).max(10)),
  honeyStores: lenient(z.number().int().min(0).max(10)),
  pollenStores: lenient(z.number().int().min(0).max(10)),
  queenCells: lenient(z.number().int().min(0)),
  swarmCells: lenient(z.boolean()),
  supersedureCells: lenient(z.boolean()),
  queenSeen: lenient(z.boolean()),
  totalFrames: lenient(z.number().int().min(0)),
  eggsFrames: lenient(z.number().int().min(0)),
  uncappedBroodFrames: lenient(z.number().int().min(0)),
  cappedBroodFrames: lenient(z.number().int().min(0)),
  droneBroodFrames: lenient(z.number().int().min(0)),
  pollenFrames: lenient(z.number().int().min(0)),
  nectarFrames: lenient(z.number().int().min(0)),
  honeyFrames: lenient(z.number().int().min(0)),
  emptyFrames: lenient(z.number().int().min(0)),
  broodPattern: broodPatternSchema.catch(null),
  additionalObservations: lenientEnumArray(additionalObservationSchema),
  reminderObservations: lenientEnumArray(reminderObservationSchema),
});

// Action types the AI is allowed to suggest. HARVEST and BOX_CONFIGURATION
// are deliberately excluded — they change hive state and are too error-prone
// to prefill from speech.
export const aiDraftActionTypeSchema = z.enum([
  'FEEDING',
  'TREATMENT',
  'FRAME',
  'MAINTENANCE',
  'NOTE',
  'OTHER',
]);

// Details mirror actionDetailsSchema but with every field optional — the
// beekeeper rarely speaks all of feedType/amount/unit/… in one breath.
// Unknown values stay null/undefined so the form flags them for completion
// instead of receiving fabricated empty strings.
const aiFeedingDetailsSchema = z.object({
  type: z.literal('FEEDING'),
  feedType: lenient(z.string()),
  amount: lenient(z.number().positive()),
  unit: lenient(z.string()),
  concentration: lenient(z.string()),
});

const aiTreatmentDetailsSchema = z.object({
  type: z.literal('TREATMENT'),
  // Preferably a TREATMENT_PRODUCTS id (e.g. OXALIC_ACID); free text is kept
  // as a custom product name.
  product: lenient(z.string()),
  quantity: lenient(z.number().positive()),
  unit: lenient(z.string()),
  duration: lenient(z.string()),
});

const aiFrameDetailsSchema = z.object({
  type: z.literal('FRAME'),
  quantity: lenient(z.number().int()),
});

const aiMaintenanceDetailsSchema = z.object({
  type: z.literal('MAINTENANCE'),
  component: lenient(maintenanceComponentSchema),
  status: lenient(maintenanceStatusSchema),
});

const aiNoteDetailsSchema = z.object({
  type: z.literal('NOTE'),
  content: lenient(z.string()),
});

const aiOtherDetailsSchema = z.object({
  type: z.literal('OTHER'),
});

export const aiDraftActionSchema = z
  .object({
    type: aiDraftActionTypeSchema,
    notes: lenient(z.string()),
    details: z.discriminatedUnion('type', [
      aiFeedingDetailsSchema,
      aiTreatmentDetailsSchema,
      aiFrameDetailsSchema,
      aiMaintenanceDetailsSchema,
      aiNoteDetailsSchema,
      aiOtherDetailsSchema,
    ]),
  })
  .refine(action => action.type === action.details.type, {
    message: 'Action type must match details.type',
  });

// Invalid actions are dropped, valid ones kept.
const aiDraftActionListSchema = z
  .array(z.unknown())
  .nullish()
  .catch(null)
  .transform(actions =>
    (actions ?? []).flatMap(action => {
      const parsed = aiDraftActionSchema.safeParse(action);
      return parsed.success ? [parsed.data] : [];
    }),
  );

export const aiInspectionDraftSchema = z.object({
  // ISO-8601 datetime if the beekeeper spoke a date/time, otherwise null.
  date: lenient(z.string().datetime({ offset: true, local: true })),
  temperature: lenient(z.number()),
  weatherConditions: lenient(aiWeatherConditionSchema),
  notes: lenient(z.string()),
  observations: aiDraftObservationsSchema.nullish().catch(null),
  actions: aiDraftActionListSchema,
});

export type AiWeatherCondition = z.infer<typeof aiWeatherConditionSchema>;
export type AiDraftObservations = z.infer<typeof aiDraftObservationsSchema>;
export type AiDraftAction = z.infer<typeof aiDraftActionSchema>;
export type AiInspectionDraft = z.infer<typeof aiInspectionDraftSchema>;
