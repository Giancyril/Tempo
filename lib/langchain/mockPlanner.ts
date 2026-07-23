import { addDays, format, parseISO, addMinutes, setHours, setMinutes, isBefore, isAfter } from 'date-fns';
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

  // Chronotype peak energy window parsing
  const peakStartStr = preferences.peakStart || '09:00';
  const peakEndStr = preferences.peakEnd || '12:00';
  const [peakStartH, peakStartM] = peakStartStr.split(':').map(Number);
  const [peakEndH, peakEndM] = peakEndStr.split(':').map(Number);
  const isChronotypeActive = preferences.chronotype && preferences.chronotype !== 'flexible';

  // Sort tasks by priority (1 highest) and deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.deadline && b.deadline) {
      return parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime();
    }
    return 0;
  });

  let totalSplitTasksCount = 0;

  for (const task of sortedTasks) {
    let remainingDuration = task.durationMin;
    const maxBlock = preferences.maxFocusBlockMin || 120;
    const totalParts = Math.ceil(task.durationMin / maxBlock);
    let taskSegmentIndex = 1;

    if (totalParts > 1) {
      totalSplitTasksCount++;
    }

    // Day offset tracker to enforce multi-session task spreading across DIFFERENT days
    let startDayOffset = 0;

    while (remainingDuration > 0) {
      const currentBlockDuration = Math.min(remainingDuration, maxBlock);
      let placed = false;

      // High-priority tasks (P1/P2) try peak energy window first if chronotype enabled
      const tryPeakFirst = isChronotypeActive && task.priority <= 2;
      // Low-priority tasks (P4/P5) try non-peak (energy slump) window first
      const trySlumpFirst = isChronotypeActive && task.priority >= 4;

      const attemptPasses = (tryPeakFirst || trySlumpFirst) ? [1, 2] : [1];

      for (const pass of attemptPasses) {
        if (placed) break;

        for (let dayOffset = startDayOffset; dayOffset < 7; dayOffset++) {
          const currentDay = addDays(weekStart, dayOffset);
          const dayName = format(currentDay, 'EEEE').toLowerCase();

          if (daysOffSet.has(dayName)) continue;

          let slotStart = setMinutes(setHours(currentDay, workStartH), workStartM);
          const dayWorkEnd = setMinutes(setHours(currentDay, workEndH), workEndM);

          while (
            isBefore(addMinutes(slotStart, currentBlockDuration), addDays(dayWorkEnd, 1)) &&
            isBefore(addMinutes(slotStart, currentBlockDuration), dayWorkEnd)
          ) {
            const slotEnd = addMinutes(slotStart, currentBlockDuration);
            const slotHour = slotStart.getHours();

            // Energy Level Filtering:
            // Pass 1 for P1/P2: Must be within peak window
            if (pass === 1 && tryPeakFirst) {
              if (slotHour < peakStartH || slotHour >= peakEndH) {
                slotStart = addMinutes(slotStart, 15);
                continue;
              }
            }
            // Pass 1 for P4/P5: Must be OUTSIDE peak window (slump hours)
            if (pass === 1 && trySlumpFirst) {
              if (slotHour >= peakStartH && slotHour < peakEndH) {
                slotStart = addMinutes(slotStart, 15);
                continue;
              }
            }

            // Task constraints
            if (task.constraints?.toLowerCase().includes('morning') && slotHour >= 12) {
              break; // move to next day
            }
            if (task.constraints?.toLowerCase().includes('afternoon') && slotHour < 12) {
              slotStart = setMinutes(setHours(currentDay, 12), 0);
              continue;
            }

            // Check deadline
            if (task.deadline && isAfter(slotEnd, parseISO(task.deadline))) {
              break;
            }

            // Check overlaps with existing events & proposed blocks (including buffer)
            const buffer = preferences.bufferMinutes || 0;
            const bufferedStart = addMinutes(slotStart, -buffer);
            const bufferedEnd = addMinutes(slotEnd, buffer);

            const overlapsExisting = existingEvents.some((evt) => {
              const eStart = parseISO(evt.start);
              const eEnd = parseISO(evt.end);
              return isBefore(slotStart, eEnd) && isAfter(slotEnd, eStart);
            });

            const overlapsProposed = scheduledBlocks.some((blk) => {
              const bStart = parseISO(blk.start);
              const bEnd = parseISO(blk.end);
              return isBefore(bufferedStart, bEnd) && isAfter(bufferedEnd, bStart);
            });

            if (!overlapsExisting && !overlapsProposed) {
              // Open slot found!
              const blockId = `block-${task.id}-${taskSegmentIndex}-${Date.now()}`;
              const titleSuffix = totalParts > 1 ? ` (Part ${taskSegmentIndex}/${totalParts})` : '';

              // Build smart reasoning note
              let reasoning = `Scheduled during active work hours on ${format(currentDay, 'EEE, MMM d')}.`;
              if (tryPeakFirst && pass === 1) {
                reasoning = `⚡ Scheduled during peak energy window (${peakStartStr}–${peakEndStr}) for P${task.priority} high-focus work.`;
              } else if (trySlumpFirst && pass === 1) {
                reasoning = `☕ Scheduled during energy slump window outside ${peakStartStr}–${peakEndStr} for lightweight P${task.priority} task.`;
              }
              if (totalParts > 1) {
                reasoning += ` 🔗 Multi-session split (Part ${taskSegmentIndex} of ${totalParts}).`;
              }

              scheduledBlocks.push({
                id: blockId,
                taskId: task.id,
                title: `${task.title}${titleSuffix}`,
                category: task.category || 'Work',
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                reasoning,
                partIndex: taskSegmentIndex,
                totalParts,
              });

              remainingDuration -= currentBlockDuration;
              taskSegmentIndex++;
              placed = true;

              // Enforce Smart Multi-Session Task Splitting across DIFFERENT days
              // Advance startDayOffset for the next segment of this task to the next day
              startDayOffset = dayOffset + 1;
              break;
            }

            // Advance slot by 15 mins
            slotStart = addMinutes(slotStart, 15);
          }

          if (placed) break;
        }
      }

      if (!placed) {
        unscheduledTasks.push({
          taskId: task.id,
          title: task.title,
          reason: totalParts > 1
            ? `Placed ${taskSegmentIndex - 1} of ${totalParts} parts. Remaining ${remainingDuration}m could not fit in open slots.`
            : 'Could not find an open time slot respecting work hours, peak energy windows, and existing calendar events.',
        });
        break; // stop attempting further segments for this task
      }
    }
  }

  const chronotypeNote = isChronotypeActive
    ? ` • Chronotype energy profiling enabled (${preferences.chronotype}, peak: ${peakStartStr}–${peakEndStr}).`
    : '';

  const multiSessionNote = totalSplitTasksCount > 0
    ? ` • Smart Multi-Session Splitting chunked ${totalSplitTasksCount} multi-hour task(s) into multi-day focus blocks.`
    : '';

  return {
    schedule: scheduledBlocks,
    unscheduledTasks,
    summaryNotes: `Deterministic AI Planner generated ${scheduledBlocks.length} focus block(s).${chronotypeNote}${multiSessionNote}`,
  };
}
