import { z } from 'zod';

export const TodoSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1, 'Task cannot be empty').max(200, 'Task is too long'),
  userId: z.string().uuid(),
  createdAt: z.date(),
});

export const CreateTodoDtoSchema = z.object({
  text: z.string().min(1, 'Task cannot be empty').max(200, 'Task is too long'),
});

export const UpdateTodoDtoSchema = z.object({
  text: z.string().min(1, 'Task cannot be empty').max(200, 'Task is too long'),
});

export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodoDto = z.infer<typeof CreateTodoDtoSchema>;
export type UpdateTodoDto = z.infer<typeof UpdateTodoDtoSchema>;
