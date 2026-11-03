import { z } from 'zod';
import { actionTypeSchema } from '../actions/types';
import { actionDetailsSchema } from '../actions/details.schema';
import { reminderObservationSchema } from '../inspections/observations.schema';

// Conversation roles — mirrors the Prisma AssistantRole enum
export const assistantRoleSchema = z.enum(['USER', 'ASSISTANT', 'SYSTEM']);
export type AssistantRole = z.infer<typeof assistantRoleSchema>;

/**
 * Structured suggestion shape (phase 6).
 * The assistant may emit a fenced ```json block describing proposed actions
 * (matching the existing Action types) or reminders (matching the
 * reminderObservations enum). The frontend parses these into "Create this
 * action?" buttons that call the existing action-creation endpoints.
 */
export const assistantActionSuggestionSchema = z.object({
  kind: z.literal('action'),
  type: actionTypeSchema,
  details: actionDetailsSchema,
  notes: z.string().optional(),
  // Short human-readable rationale for why the assistant proposes this action
  reason: z.string().optional(),
});
export type AssistantActionSuggestion = z.infer<
  typeof assistantActionSuggestionSchema
>;

export const assistantReminderSuggestionSchema = z.object({
  kind: z.literal('reminder'),
  reminder: reminderObservationSchema,
  reason: z.string().optional(),
});
export type AssistantReminderSuggestion = z.infer<
  typeof assistantReminderSuggestionSchema
>;

export const assistantSuggestionSchema = z.discriminatedUnion('kind', [
  assistantActionSuggestionSchema,
  assistantReminderSuggestionSchema,
]);
export type AssistantSuggestion = z.infer<typeof assistantSuggestionSchema>;

export const assistantSuggestionsSchema = z.array(assistantSuggestionSchema);
export type AssistantSuggestions = z.infer<typeof assistantSuggestionsSchema>;

// Create a new thread. apiaryId drives ownership/authz; hiveId scopes the
// thread to a single hive (omit/null for the apiary-level advisor).
export const createAssistantThreadSchema = z.object({
  apiaryId: z.uuid(),
  hiveId: z.uuid().optional(),
});
export type CreateAssistantThread = z.infer<typeof createAssistantThreadSchema>;

// Query for listing threads within a scope.
export const assistantThreadFilterSchema = z.object({
  apiaryId: z.uuid().optional(),
  hiveId: z.uuid().optional(),
});
export type AssistantThreadFilter = z.infer<typeof assistantThreadFilterSchema>;

// Send a user message to a thread.
export const sendAssistantMessageSchema = z.object({
  content: z.string().min(1),
});
export type SendAssistantMessage = z.infer<typeof sendAssistantMessageSchema>;

export const assistantMessageResponseSchema = z.object({
  id: z.uuid(),
  threadId: z.uuid(),
  role: assistantRoleSchema,
  content: z.string(),
  suggestions: assistantSuggestionsSchema.nullish(),
  createdAt: z.iso.datetime(),
});
export type AssistantMessageResponse = z.infer<
  typeof assistantMessageResponseSchema
>;

export const assistantThreadResponseSchema = z.object({
  id: z.uuid(),
  apiaryId: z.uuid(),
  hiveId: z.uuid().nullable(),
  title: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type AssistantThreadResponse = z.infer<
  typeof assistantThreadResponseSchema
>;

export const assistantThreadWithMessagesResponseSchema =
  assistantThreadResponseSchema.extend({
    messages: z.array(assistantMessageResponseSchema),
  });
export type AssistantThreadWithMessagesResponse = z.infer<
  typeof assistantThreadWithMessagesResponseSchema
>;
