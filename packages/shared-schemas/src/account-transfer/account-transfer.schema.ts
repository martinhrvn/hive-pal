import { z } from 'zod';

export const CURRENT_EXPORT_VERSION = '1.0';

export const accountTransferJobTypeSchema = z.enum(['EXPORT', 'IMPORT']);
export type AccountTransferJobType = z.infer<
  typeof accountTransferJobTypeSchema
>;

export const accountTransferJobStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
]);
export type AccountTransferJobStatus = z.infer<
  typeof accountTransferJobStatusSchema
>;

export const importSummarySchema = z.object({
  apiariesImported: z.int().nonnegative(),
  apiariesFailed: z.array(z.string()).default([]),
  hivesImported: z.int().nonnegative(),
  inspectionsImported: z.int().nonnegative(),
  actionsImported: z.int().nonnegative(),
  photosImported: z.int().nonnegative(),
  photosMissing: z.int().nonnegative(),
  documentsImported: z.int().nonnegative(),
  documentsMissing: z.int().nonnegative(),
  audioImported: z.int().nonnegative(),
  audioMissing: z.int().nonnegative(),
  membersLinked: z.int().nonnegative(),
  membersDropped: z.int().nonnegative(),
  equipmentItemsImported: z.int().nonnegative(),
  frameSizesImported: z.int().nonnegative(),
  warnings: z.array(z.string()).default([]),
});
export type ImportSummary = z.infer<typeof importSummarySchema>;

export const exportSummarySchema = z.object({
  apiariesExported: z.int().nonnegative(),
  hivesExported: z.int().nonnegative(),
  inspectionsExported: z.int().nonnegative(),
  actionsExported: z.int().nonnegative(),
  attachmentsExported: z.int().nonnegative(),
  totalBytes: z.int().nonnegative(),
});
export type ExportSummary = z.infer<typeof exportSummarySchema>;

export const accountTransferJobSchema = z.object({
  id: z.uuid(),
  type: accountTransferJobTypeSchema,
  status: accountTransferJobStatusSchema,
  createdAt: z.string().or(z.date()),
  startedAt: z.string().or(z.date()).nullable(),
  finishedAt: z.string().or(z.date()).nullable(),
  progress: z.string().nullable(),
  errorMessage: z.string().nullable(),
  resultExpiresAt: z.string().or(z.date()).nullable(),
  hasResult: z.boolean(),
  summary: z.union([importSummarySchema, exportSummarySchema]).nullable(),
});
export type AccountTransferJob = z.infer<typeof accountTransferJobSchema>;

export const accountTransferJobListSchema = z.array(accountTransferJobSchema);
export type AccountTransferJobList = z.infer<
  typeof accountTransferJobListSchema
>;

export const createJobResponseSchema = z.object({
  jobId: z.uuid(),
});
export type CreateJobResponse = z.infer<typeof createJobResponseSchema>;

// ---------------------------------------------------------------------------
// Export envelope (data.json inside the ZIP)
// ---------------------------------------------------------------------------

const idStringSchema = z.string();
const dateOrNullSchema = z.string().nullable().optional();

const apiaryRoleSchema = z.enum(['OWNER', 'EDITOR', 'VIEWER']);

const apiaryMemberExportSchema = z.looseObject({
  email: z.string(),
  role: apiaryRoleSchema,
});

const boxExportSchema = z.looseObject({
  id: idStringSchema,
  position: z.int(),
  frameCount: z.int(),
  maxFrameCount: z.int().optional(),
  hasExcluder: z.boolean().optional(),
  type: z.string(),
  variant: z.string().nullable().optional(),
  frameSizeId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  lastSanitized: dateOrNullSchema,
  addedAt: z.string().optional(),
  winterized: z.boolean().optional(),
});

const queenMovementExportSchema = z.looseObject({
  id: idStringSchema,
  fromHiveId: idStringSchema.nullable(),
  toHiveId: idStringSchema.nullable(),
  movedAt: z.string(),
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

const queenExportSchema = z.looseObject({
  id: idStringSchema,
  name: z.string().nullable().optional(),
  marking: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  year: z.int().nullable().optional(),
  source: z.string().nullable().optional(),
  status: z.string(),
  installedAt: dateOrNullSchema,
  replacedAt: dateOrNullSchema,
  statusChangedAt: dateOrNullSchema.optional(),
  cellCappedAt: dateOrNullSchema.optional(),
  emergedAt: dateOrNullSchema.optional(),
  notes: z.string().nullable().optional(),
  breeder: z.string().nullable().optional(),
  line: z.string().nullable().optional(),
  motherQueenId: idStringSchema.nullable().optional(),
  matingType: z.string().nullable().optional(),
  matingStation: z.string().nullable().optional(),
  matedAt: dateOrNullSchema.optional(),
  gentleness: z.int().nullable().optional(),
  hygiene: z.int().nullable().optional(),
  swarmResistance: z.int().nullable().optional(),
  honeyProduction: z.int().nullable().optional(),
  movements: z.array(queenMovementExportSchema).default([]),
});

const inspectionNoteExportSchema = z.looseObject({
  id: idStringSchema,
  text: z.string(),
});

const observationExportSchema = z.looseObject({
  id: idStringSchema,
  type: z.string(),
  numericValue: z.number().nullable().optional(),
  textValue: z.string().nullable().optional(),
  booleanValue: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const inspectionAudioExportSchema = z.looseObject({
  id: idStringSchema,
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.int(),
  duration: z.number().nullable().optional(),
  transcription: z.string().nullable().optional(),
  transcriptionStatus: z.string().optional(),
  analysisStatus: z.string().optional(),
  analysisResult: z.unknown().optional(),
  createdAt: z.string().optional(),
});

const actionExportSchema = z.looseObject({
  id: idStringSchema,
  hiveId: idStringSchema.nullable(),
  inspectionId: idStringSchema.nullable(),
  harvestId: idStringSchema.nullable(),
  type: z.string(),
  notes: z.string().nullable().optional(),
  date: z.string(),
  details: z
    .object({
      kind: z.string(),
      data: z.record(z.string(), z.unknown()),
    })
    .nullable()
    .optional(),
});

const inspectionExportSchema = z.looseObject({
  id: idStringSchema,
  hiveId: idStringSchema,
  date: z.string(),
  isAllDay: z.boolean().optional(),
  temperature: z.number().nullable().optional(),
  weatherConditions: z.string().nullable().optional(),
  status: z.string(),
  overallScore: z.number().nullable().optional(),
  populationScore: z.number().nullable().optional(),
  storesScore: z.number().nullable().optional(),
  queenScore: z.number().nullable().optional(),
  scoreWarnings: z.string().nullable().optional(),
  scoreConfidence: z.number().nullable().optional(),
  notes: z.array(inspectionNoteExportSchema).default([]),
  observations: z.array(observationExportSchema).default([]),
  audioRecordings: z.array(inspectionAudioExportSchema).default([]),
});

const measurementExportSchema = z.looseObject({
  id: idStringSchema,
  metric: z.string(),
  value: z.number(),
  unit: z.string().nullable().optional(),
  recordedAt: z.string(),
  source: z.string().nullable().optional(),
  boxId: z.string().nullable().optional(),
  side: z.string().nullable().optional(),
  inspectionId: z.string().nullable().optional(),
});

const alertExportSchema = z.looseObject({
  id: idStringSchema,
  type: z.string(),
  message: z.string(),
  severity: z.string(),
  status: z.string(),
  metadata: z.unknown().nullable().optional(),
  createdAt: z.string(),
});

const hiveExportSchema = z.looseObject({
  id: idStringSchema,
  name: z.string(),
  notes: z.string().nullable().optional(),
  status: z.string(),
  installationDate: dateOrNullSchema,
  positionRow: z.int().nullable().optional(),
  positionCol: z.int().nullable().optional(),
  settings: z.unknown().nullable().optional(),
  featurePhotoId: idStringSchema.nullable().optional(),
  boxes: z.array(boxExportSchema).default([]),
  queens: z.array(queenExportSchema).default([]),
  inspections: z.array(inspectionExportSchema).default([]),
  actions: z.array(actionExportSchema).default([]),
  measurements: z.array(measurementExportSchema).default([]),
  alerts: z.array(alertExportSchema).default([]),
});

const harvestHiveExportSchema = z.looseObject({
  id: idStringSchema,
  hiveId: idStringSchema,
  framesTaken: z.int(),
  honeyAmount: z.number().nullable().optional(),
  honeyAmountUnit: z.string().optional(),
  honeyPercentage: z.number().nullable().optional(),
});

const harvestExportSchema = z.looseObject({
  id: idStringSchema,
  date: z.string(),
  status: z.string(),
  totalWeight: z.number().nullable().optional(),
  totalWeightUnit: z.string().optional(),
  notes: z.string().nullable().optional(),
  harvestHives: z.array(harvestHiveExportSchema).default([]),
});

const batchInspectionHiveExportSchema = z.looseObject({
  id: idStringSchema,
  hiveId: idStringSchema,
  order: z.int(),
  status: z.string(),
  inspectionId: idStringSchema.nullable().optional(),
  completedAt: dateOrNullSchema,
  skippedCount: z.int().optional(),
});

const batchInspectionExportSchema = z.looseObject({
  id: idStringSchema,
  name: z.string(),
  status: z.string(),
  startedAt: dateOrNullSchema,
  completedAt: dateOrNullSchema,
  hives: z.array(batchInspectionHiveExportSchema).default([]),
});

const quickCheckPhotoExportSchema = z.looseObject({
  id: idStringSchema,
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.int(),
});

const quickCheckExportSchema = z.looseObject({
  id: idStringSchema,
  hiveId: idStringSchema.nullable().optional(),
  date: z.string(),
  note: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  photos: z.array(quickCheckPhotoExportSchema).default([]),
});

const photoExportSchema = z.looseObject({
  id: idStringSchema,
  hiveId: idStringSchema.nullable().optional(),
  inspectionId: idStringSchema.nullable().optional(),
  caption: z.string().nullable().optional(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.int(),
  date: z.string(),
  isFeatureOfApiary: z.boolean().optional(),
  isFeatureOfHive: z.boolean().optional(),
});

const documentExportSchema = z.looseObject({
  id: idStringSchema,
  hiveId: idStringSchema.nullable().optional(),
  title: z.string(),
  notes: z.string().nullable().optional(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.int(),
  date: z.string(),
});

const apiaryExportSchema = z.looseObject({
  id: idStringSchema,
  name: z.string(),
  location: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  settings: z.unknown().nullable().optional(),
  featurePhotoId: idStringSchema.nullable().optional(),
  hives: z.array(hiveExportSchema).default([]),
  harvests: z.array(harvestExportSchema).default([]),
  batchInspections: z.array(batchInspectionExportSchema).default([]),
  quickChecks: z.array(quickCheckExportSchema).default([]),
  photos: z.array(photoExportSchema).default([]),
  documents: z.array(documentExportSchema).default([]),
  members: z.array(apiaryMemberExportSchema).default([]),
});

const equipmentItemExportSchema = z.looseObject({
  id: idStringSchema,
  itemId: z.string(),
  name: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  perHive: z.number().optional(),
  extra: z.number().optional(),
  inExtraction: z.number().optional(),
  damaged: z.number().optional(),
  neededOverride: z.number().nullable().optional(),
  category: z.string(),
  scope: z.string().optional(),
  unit: z.string().optional(),
  isCustom: z.boolean().optional(),
  displayOrder: z.int().optional(),
});

const equipmentMultiplierExportSchema = z.looseObject({
  targetHives: z.int(),
});

const userFeedTypeExportSchema = z.looseObject({
  id: idStringSchema,
  label: z.string(),
  form: z.string(),
  density: z.number().nullable().optional(),
  sugarContent: z.number(),
  archived: z.boolean().optional(),
});

const frameSizeExportSchema = z.looseObject({
  id: idStringSchema,
  name: z.string(),
  width: z.number(),
  height: z.number(),
  depth: z.number(),
  status: z.string(),
});

export const exportEnvelopeSchema = z.looseObject({
  version: z.string(),
  exportedAt: z.string(),
  sourceInstance: z.looseObject({
    hostname: z.string().nullable().optional(),
    appVersion: z.string().nullable().optional(),
  }),
  sourceUser: z.looseObject({
    email: z.string(),
  }),
  apiaries: z.array(apiaryExportSchema).default([]),
  userConfig: z.looseObject({
    equipmentItems: z.array(equipmentItemExportSchema).default([]),
    equipmentMultiplier: equipmentMultiplierExportSchema.nullable().optional(),
    frameSizes: z.array(frameSizeExportSchema).default([]),
    feedTypes: z.array(userFeedTypeExportSchema).default([]),
  }),
});

export type ExportEnvelope = z.infer<typeof exportEnvelopeSchema>;
export type ApiaryExport = z.infer<typeof apiaryExportSchema>;
export type HiveExport = z.infer<typeof hiveExportSchema>;
export type InspectionExport = z.infer<typeof inspectionExportSchema>;
export type ActionExport = z.infer<typeof actionExportSchema>;
export type PhotoExport = z.infer<typeof photoExportSchema>;
export type DocumentExport = z.infer<typeof documentExportSchema>;
export type InspectionAudioExport = z.infer<typeof inspectionAudioExportSchema>;
export type QuickCheckExport = z.infer<typeof quickCheckExportSchema>;
export type HarvestExport = z.infer<typeof harvestExportSchema>;
export type BatchInspectionExport = z.infer<typeof batchInspectionExportSchema>;
export type ApiaryMemberExport = z.infer<typeof apiaryMemberExportSchema>;
export type EquipmentItemExport = z.infer<typeof equipmentItemExportSchema>;
export type FrameSizeExport = z.infer<typeof frameSizeExportSchema>;
