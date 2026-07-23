import { parseISO, isBefore, isAfter, format, getDay, addMinutes, differenceInMinutes } from 'date-fns';
import { ScheduledBlockDTO, ExistingEventDTO, UserPreferencesDTO, TaskConstraint } from './types';

export interface ScheduleViolation {
  blockId: string;
  taskId: string;
  type: 'OVERLAP_EXISTING' | 'OVERLAP_PROPOSED' | 'OUTSIDE_WORK_HOURS' | 'DAY_OFF' | 'DEADLINE_BREACH' | 'CONSTRAINT_BREACH';
  message: string;
}

export function validateSchedule(
  proposedBlocks: ScheduledBlockDTO[],
  existingEvents: ExistingEventDTO[],
  preferences: UserPreferencesDTO,
  tasks: TaskConstraint[]
): { isValid: boolean; violations: ScheduleViolation[] } {
  const violations: ScheduleViolation[] = [];
  const daysOffSet = new Set(preferences.daysOff.map((d) => d.toLowerCase()));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Parse work hours (e.g. "09:00" -> 9, 0)
  const [workStartH, workStartM] = preferences.workStart.split(':').map(Number);
  const [workEndH, workEndM] = preferences.workEnd.split(':').map(Number);

  // 1. Check each proposed block against existing events & preferences
  for (let i = 0; i < proposedBlocks.length; i++) {
    const block = proposedBlocks[i];
    const start = parseISO(block.start);
    const end = parseISO(block.end);
    const dayName = format(start, 'EEEE').toLowerCase();

    // Check Day Off
    if (daysOffSet.has(dayName)) {
      violations.push({
        blockId: block.id,
        taskId: block.taskId,
        type: 'DAY_OFF',
        message: `Block '${block.title}' scheduled on day off: ${format(start, 'EEEE')}`,
      });
    }

    // Check Work Hours
    const startMinutesInDay = start.getHours() * 60 + start.getMinutes();
    const endMinutesInDay = end.getHours() * 60 + end.getMinutes();
    const allowedStartMin = workStartH * 60 + workStartM;
    const allowedEndMin = workEndH * 60 + workEndM;

    if (startMinutesInDay < allowedStartMin || endMinutesInDay > allowedEndMin) {
      violations.push({
        blockId: block.id,
        taskId: block.taskId,
        type: 'OUTSIDE_WORK_HOURS',
        message: `Block '${block.title}' (${format(start, 'HH:mm')}-${format(end, 'HH:mm')}) is outside work hours (${preferences.workStart}-${preferences.workEnd})`,
      });
    }

    // Check Deadline
    const taskDef = taskMap.get(block.taskId);
    if (taskDef?.deadline) {
      const deadlineDate = parseISO(taskDef.deadline);
      if (isAfter(end, deadlineDate)) {
        violations.push({
          blockId: block.id,
          taskId: block.taskId,
          type: 'DEADLINE_BREACH',
          message: `Block '${block.title}' ends after task deadline (${format(deadlineDate, 'yyyy-MM-dd HH:mm')})`,
        });
      }
    }

    // Check Overlap with Existing Calendar Events
    for (const ext of existingEvents) {
      const extStart = parseISO(ext.start);
      const extEnd = parseISO(ext.end);

      if (isBefore(start, extEnd) && isAfter(end, extStart)) {
        violations.push({
          blockId: block.id,
          taskId: block.taskId,
          type: 'OVERLAP_EXISTING',
          message: `Block '${block.title}' overlaps with existing event '${ext.summary}'`,
        });
      }
    }

    // Check Overlap with other proposed blocks
    for (let j = i + 1; j < proposedBlocks.length; j++) {
      const other = proposedBlocks[j];
      const otherStart = parseISO(other.start);
      const otherEnd = parseISO(other.end);

      if (isBefore(start, otherEnd) && isAfter(end, otherStart)) {
        violations.push({
          blockId: block.id,
          taskId: block.taskId,
          type: 'OVERLAP_PROPOSED',
          message: `Block '${block.title}' overlaps with proposed block '${other.title}'`,
        });
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}
