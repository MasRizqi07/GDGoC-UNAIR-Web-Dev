import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const RegisterDtoSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginDtoSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string(),
});

export const TodoSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1, 'Task cannot be empty').max(200, 'Task is too long'),
  position: z.number().int().min(0),
  userId: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateTodoDtoSchema = z.object({
  text: z.string().min(1, 'Task cannot be empty').max(200, 'Task is too long'),
  position: z.number().int().min(0).optional(),
});

export const UpdateTodoDtoSchema = z.object({
  text: z.string().min(1, 'Task cannot be empty').max(200, 'Task is too long').optional(),
  position: z.number().int().min(0).optional(),
});

export const PreferenceSchema = z.object({
  theme: z.string(),
});

export const ReorderTodosDtoSchema = z.object({
  todoIds: z.array(z.string().uuid()),
});

export const UpdatePreferenceDtoSchema = z.object({
  theme: z.string(),
});

export const ProgressSchema = z.object({
  tutorialId: z.string(),
  completed: z.boolean(),
  completedAt: z.coerce.date().nullable(),
});

export const UpdateProgressDtoSchema = z.object({
  completed: z.boolean(),
});

export type User = z.infer<typeof UserSchema>;
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
export type LoginDto = z.infer<typeof LoginDtoSchema>;

export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodoDto = z.infer<typeof CreateTodoDtoSchema>;
export type UpdateTodoDto = z.infer<typeof UpdateTodoDtoSchema>;
export type ReorderTodosDto = z.infer<typeof ReorderTodosDtoSchema>;

export type Preference = z.infer<typeof PreferenceSchema>;
export type UpdatePreferenceDto = z.infer<typeof UpdatePreferenceDtoSchema>;

export type Progress = z.infer<typeof ProgressSchema>;
export type UpdateProgressDto = z.infer<typeof UpdateProgressDtoSchema>;
