import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, MOCK_USER_ID } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchGoogleCalendarEvents } from '@/lib/google/calendarClient';
import { runAISchedulingPipeline } from '@/lib/langchain/schedulingChain';
import { parseISO, addDays, startOfWeek } from 'date-fns';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;

  try {
    const body = await request.json();
    const { currentBlocks, conflictingBlockIds, weekOf } = body;

    if (!conflictingBlockIds || !Array.isArray(conflictingBlockIds) || conflictingBlockIds.length === 0) {
      return NextResponse.json({ blocks: currentBlocks, summaryNotes: 'No conflicts to replan.' });
    }

    const weekStart = weekOf ? parseISO(weekOf) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    // 1. Separate fixed (non-conflicting) blocks vs conflicting blocks
    const conflictingSet = new Set(conflictingBlockIds);
    const fixedBlocks = currentBlocks.filter((b: any) => !conflictingSet.has(b.id));
    const conflictingBlocks = currentBlocks.filter((b: any) => conflictingSet.has(b.id));

    // Extract task IDs from conflicting blocks
    const affectedTaskIds = Array.from(new Set(conflictingBlocks.map((b: any) => b.taskId).filter(Boolean)));

    // 2. Fetch affected tasks from DB
    const affectedTasks = await prisma.task.findMany({
      where: {
        userId,
        id: { in: affectedTaskIds as string[] },
      },
    });

    // Build task constraints
    const taskConstraints = affectedTasks.map((t) => ({
      id: t.id,
      title: t.title,
      durationMin: t.durationMin,
      deadline: t.deadline ? t.deadline.toISOString() : undefined,
      priority: t.priority,
      category: t.category,
      constraints: t.constraints || undefined,
    }));

    // If no DB tasks found, fallback to block metadata
    if (taskConstraints.length === 0) {
      conflictingBlocks.forEach((b: any) => {
        taskConstraints.push({
          id: b.taskId || b.id,
          title: b.title.replace(/\s*\(Part \d+\/\d+\)/, ''),
          durationMin: 60,
          deadline: undefined,
          priority: 2,
          category: b.category || 'Work',
          constraints: undefined,
        });
      });
    }

    // 3. Fetch latest user preferences
    let pref = await prisma.preference.findUnique({ where: { userId } });
    const preferencesDTO = {
      workStart: pref?.workStart || '09:00',
      workEnd: pref?.workEnd || '18:00',
      daysOff: (pref?.daysOff || 'Saturday,Sunday').split(',').filter(Boolean),
      bufferMinutes: pref?.bufferMinutes || 15,
      maxFocusBlockMin: pref?.maxFocusBlockMin || 120,
      chronotype: pref?.chronotype || 'flexible',
      peakStart: pref?.peakStart || '09:00',
      peakEnd: pref?.peakEnd || '12:00',
    };

    // 4. Fetch latest Google Calendar events
    let calendarEvents = await fetchGoogleCalendarEvents(userId, weekStart.toISOString(), weekEnd.toISOString());

    // 5. TREAT FIXED NON-CONFLICTING BLOCKS AS BUSY EVENTS SO THEY DO NOT MOVE!
    const fixedBlocksAsEvents = fixedBlocks.map((b: any) => ({
      id: `fixed-${b.id}`,
      summary: `🔒 Fixed AI Block: ${b.title}`,
      start: b.start,
      end: b.end,
    }));

    const combinedBusyEvents = [...calendarEvents, ...fixedBlocksAsEvents];

    // 6. Run AI incremental pipeline for only affected tasks
    const aiResult = await runAISchedulingPipeline(
      taskConstraints,
      preferencesDTO,
      combinedBusyEvents,
      weekStart.toISOString(),
      weekEnd.toISOString()
    );

    // 7. Merge fixed blocks + newly replanned blocks
    const finalBlocks = [...fixedBlocks, ...aiResult.schedule];

    return NextResponse.json({
      blocks: finalBlocks,
      replannedBlocksCount: aiResult.schedule.length,
      summaryNotes: `⚡ Incremental Re-planner successfully resolved ${conflictingBlockIds.length} conflict(s) by rescheduling ${aiResult.schedule.length} block(s) into non-overlapping slots without altering fixed events.`,
    });
  } catch (error: any) {
    console.error('Failed to replan conflicting schedule:', error);
    return NextResponse.json({ error: error.message || 'Failed to replan schedule' }, { status: 500 });
  }
}
