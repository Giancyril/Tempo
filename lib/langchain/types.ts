import { z } from 'zod';

export const TaskConstraintSchema = z.object({
  id: z.string(),
  title: z.string(),
  durationMin: z.number(),
  deadline: z.string().optional(), // ISO date or string
  priority: z.number().min(1).max(5), // 1 = High, 5 = Low
  category: z.string().default('Work'),
  constraints: z.string().optional(), // e.g. "mornings only"
});

export const PreferenceSchema = z.object({
  workStart: z.string(), // "09:00"
  workEnd: z.string(),   // "18:00"
  daysOff: z.array(z.string()), // ["Saturday", "Sunday"]
  bufferMinutes: z.number(),
  maxFocusBlockMin: z.number(),
});

export const ExistingEventSchema = z.object({
  id: z.string().optional(),
  summary: z.string(),
  start: z.string(), // ISO String
  end: z.string(),   // ISO String
});

export const ScheduledBlockSchema = z.object({
  id: z.string().describe('Unique block identifier'),
  taskId: z.string().describe('Associated task ID'),
  title: z.string().describe('Block title or task segment title'),
  category: z.string().describe('Category of the task'),
  start: z.string().describe('ISO 8601 formatted start datetime (e.g. 2026-07-27T09:00:00.000Z)'),
  end: z.string().describe('ISO 8601 formatted end datetime (e.g. 2026-07-27T10:30:00.000Z)'),
  reasoning: z.string().optional().describe('Short reasoning why this slot was chosen'),
});

export const AIPlannerOutputSchema = z.object({
  schedule: z.array(ScheduledBlockSchema),
  unscheduledTasks: z.array(
    z.object({
      taskId: z.string(),
      title: z.string(),
      reason: z.string(),
    })
  ).optional(),
  summaryNotes: z.string().describe('Brief summary of how the schedule was constructed'),
});

export type TaskConstraint = z.infer<typeof TaskConstraintSchema>;
export type UserPreferencesDTO = z.infer<typeof PreferenceSchema>;
export type ExistingEventDTO = z.infer<typeof ExistingEventSchema>;
export type ScheduledBlockDTO = z.infer<typeof ScheduledBlockSchema>;
export type AIPlannerOutput = z.infer<typeof AIPlannerOutputSchema>;
