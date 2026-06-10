import { z } from 'zod';

// Base schema for creating todos
export const createTodoSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullish(),
  dueDate: z.string().datetime().nullish(),
  hiveId: z.string().uuid().nullish(),
  completed: z.boolean().optional(),
});

// Schema for updating todos
export const updateTodoSchema = createTodoSchema.partial();

// Schema for todo response
export const todoResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullish(),
  dueDate: z.string().datetime().nullish(),
  completed: z.boolean(),
  hiveId: z.string().uuid().nullish(),
  hiveName: z.string().nullish(),
  createdAt: z.string().datetime(),
});

export type CreateTodo = z.infer<typeof createTodoSchema>;
export type UpdateTodo = z.infer<typeof updateTodoSchema>;
export type TodoResponse = z.infer<typeof todoResponseSchema>;
