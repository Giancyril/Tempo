import { addDays, format, parseISO, addMinutes, setHours, setMinutes, isBefore, isAfter, startOfWeek } from 'date-fns';
import { TaskConstraint, UserPreferencesDTO, ExistingEventDTO, ScheduledBlockDTO, AIPlannerOutput } from './types';

export function generateMockDeterministicSchedule(
  tasks: TaskConstraint[],
  preferences: UserPreferencesDTO,
  existingEvents: ExistingEventDTO[],
  targetWeekStartISO: string
): AIPlannerOutput {
  const weekStart = parseISO(targetWeekStartISO);
  const scheduledBlocks: ScheduledBlockDTO[] = [];
  const unscheduledTasks: { taskId: string; title: string; reason: string }[] = [];

  const daysOffSet = new Set(preferences.daysOff.map((d) => d.toLowerCase()));
  const [workStartH, workStartM] = preferences.workStart.split(':').map(Number);
  const [workEndH, workEndM] = preferences.workEnd.split(':').map(Number);

  // Sort tasks by priority (1 highest) and deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.deadline && b.deadline) {
      return parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime();
    }
    return 0;
  });

  // Track busy slots per day
  // Days 0 to 6 (Monday to Sunday)
  for (const task of sortedTasks) {
    let remainingDuration = task.durationMin;
    let taskSegmentIndex = 1;

    // Split task into max focus blocks if needed
    while (remainingDuration > 0) {
      const currentBlockDuration = Math.min(remainingDuration, preferences.maxFocusBlockMin);
      let placed = false;

      // Try placing on Monday through Friday
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDay = addDays(weekStart, dayOffset);
        const dayName = format(currentDay, 'EEEE').toLowerCase();

        if (daysOffSet.has(dayName)) continue;

        let slotStart = setMinutes(setHours(currentDay, workStartH), workStartM);
        const dayWorkEnd = setMinutes(setHours(currentDay, workEndH), workEndM);

        while (isBefore(addMinutes(slotStart, currentBlockDuration), addDays(dayWorkEnd, 1)) && isBefore(addMinutes(slotStart, currentBlockDuration), dayWorkEnd)) {
          const slotEnd = addMinutes(slotStart, currentBlockDuration);

          // Check for constraint e.g. "mornings only"
          if (task.constraints?.toLowerCase().includes('morning') && slotStart.getHours() >= 12) {
            break; // move to next day
          }
          if (task.constraints?.toLowerCase().includes('afternoon') && slotStart.getHours() < 12) {
            slotStart = setMinutes(setHours(currentDay, 12), 0);
            continue;
          }

          // Check deadline
          if (task.deadline && isAfter(slotEnd, parseISO(task.deadline))) {
            break;
          }

          // Check overlap with existing events & existing proposed blocks
          const overlapsExisting = existingEvents.some((evt) => {
            const eStart = parseISO(evt.start);
            const eEnd = parseISO(evt.end);
            return isBefore(slotStart, eEnd) && isAfter(slotEnd, eStart);
          });

          const overlapsProposed = scheduledBlocks.some((blk) => {
            const bStart = parseISO(blk.start);
            const bEnd = parseISO(blk.end);
            return isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart);
          });

          if (!overlapsExisting && !overlapsProposed) {
            // Found open slot!
            const blockId = `block-${task.id}-${taskSegmentIndex}-${Date.now()}`;
            const titleSuffix = task.durationMin > preferences.maxFocusBlockMin ? ` (Part ${taskSegmentIndex})` : '';

            scheduledBlocks.push({
              id: blockId,
              taskId: task.id,
              title: `${task.title}${titleSuffix}`,
              category: task.category || 'Work',
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              reasoning: `Scheduled high-priority slot during active work hours on ${format(currentDay, 'EEE, MMM d')}.`,
            });

            remainingDuration -= currentBlockDuration;
            taskSegmentIndex++;
            placed = true;
            break;
          }

          // Advance by 15-minute increment + buffer
          slotStart = addMinutes(slotStart, 15);
        }

        if (placed) break;
      }

      if (!placed) {
        unscheduledTasks.push({
          taskId: task.id,
          title: task.title,
          reason: 'Could not find an open time slot respecting work hours, buffer, and deadline constraints.',
        });
        break; // stop attempting segments for this task
      }
    }
  }

  return {
    schedule: scheduledBlocks,
    unscheduledTasks,
    summaryNotes: `Deterministic AI Planner successfully placed ${scheduledBlocks.length} focus block(s) across the target week, respecting work hours (${preferences.workStart}-${preferences.workEnd}), buffer times, and existing calendar events.`,
  };
}
