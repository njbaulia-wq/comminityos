import { z } from 'zod';
import {
  safeTextSchema,
  optionalSafeTextSchema,
  uuidSchema,
  optionalUuidSchema,
} from './common.schema';

export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const CreateTaskSchema = z.object({
  organizationId: uuidSchema('Organization ID'),
  activityId: optionalUuidSchema('Activity ID'),
  assigneeId: optionalUuidSchema('Assignee Member ID'),
  title: safeTextSchema({ min: 2, max: 150, fieldName: 'Judul tugas' }),
  description: optionalSafeTextSchema(1000, 'Deskripsi'),
  status: TaskStatusEnum.default('todo'),
  priority: TaskPriorityEnum.default('medium'),
  dueDate: z.string().optional().nullable(),
});

export type CreateTaskInput = z.input<typeof CreateTaskSchema>;
export type CreateTaskOutput = z.output<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial();
export type UpdateTaskInput = z.input<typeof UpdateTaskSchema>;
export type UpdateTaskOutput = z.output<typeof UpdateTaskSchema>;

export const CreateChecklistItemSchema = z.object({
  taskId: uuidSchema('Task ID'),
  title: safeTextSchema({ min: 1, max: 200, fieldName: 'Judul checklist' }),
  isDone: z.boolean().default(false),
});

export type CreateChecklistItemInput = z.input<typeof CreateChecklistItemSchema>;
export type CreateChecklistItemOutput = z.output<typeof CreateChecklistItemSchema>;

export const UpdateChecklistItemSchema = z.object({
  title: safeTextSchema({ min: 1, max: 200, fieldName: 'Judul checklist', required: false }).optional(),
  isDone: z.boolean().optional(),
});

export type UpdateChecklistItemInput = z.input<typeof UpdateChecklistItemSchema>;
export type UpdateChecklistItemOutput = z.output<typeof UpdateChecklistItemSchema>;
