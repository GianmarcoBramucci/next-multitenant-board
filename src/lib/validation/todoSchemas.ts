// Zod schemas for todo validation

import { z } from 'zod';
import { TodoStatus } from '@prisma/client';

export const CreateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Todo title is required')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  status: z.nativeEnum(TodoStatus).optional(),
  assigneeId: z.string().uuid('Invalid assignee ID').optional(),
});

export const UpdateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Todo title is required')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .nullable()
    .optional(),
  status: z.nativeEnum(TodoStatus).optional(),
  assigneeId: z.string().uuid('Invalid assignee ID').nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
