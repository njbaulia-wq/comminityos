import { z } from 'zod';

export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const CreateTaskSchema = z.object({
  organizationId: z
    .string({ required_error: 'Organization ID wajib diisi' })
    .uuid('Organization ID tidak valid'),
  activityId: z.string().uuid('Activity ID tidak valid').optional().nullable(),
  assigneeId: z.string().uuid('Assignee Member ID tidak valid').optional().nullable(),
  title: z
    .string({ required_error: 'Judul tugas wajib diisi' })
    .min(2, 'Judul tugas minimal 2 karakter')
    .max(150, 'Judul tugas maksimal 150 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().nullable(),
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
  taskId: z
    .string({ required_error: 'Task ID wajib diisi' })
    .uuid('Task ID tidak valid'),
  title: z
    .string({ required_error: 'Judul checklist wajib diisi' })
    .min(1, 'Judul checklist minimal 1 karakter')
    .max(200, 'Judul checklist maksimal 200 karakter'),
  isDone: z.boolean().default(false),
});

export type CreateChecklistItemInput = z.input<typeof CreateChecklistItemSchema>;
export type CreateChecklistItemOutput = z.output<typeof CreateChecklistItemSchema>;

export const UpdateChecklistItemSchema = z.object({
  title: z.string().min(1, 'Judul checklist minimal 1 karakter').max(200).optional(),
  isDone: z.boolean().optional(),
});

export type UpdateChecklistItemInput = z.input<typeof UpdateChecklistItemSchema>;
export type UpdateChecklistItemOutput = z.output<typeof UpdateChecklistItemSchema>;
