import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, MOCK_USER_ID } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchGoogleCalendarEvents } from '@/lib/google/calendarClient';
import { runAISchedulingPipeline } from '@/lib/langchain/schedulingChain';
import { startOfWeek, addDays, parseISO } from 'date-fns';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;

  try {
    const body = await request.json().catch(() => ({}));
    const targetWeekISO = body.weekOf || startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

    const weekStart = parseISO(targetWeekISO);
    const weekEnd = addDays(weekStart, 7);

    // 1. Fetch pending tasks
    const tasks = await prisma.task.findMany({
      where: { userId, status: 'pending' },
    });

    if (tasks.length === 0) {
      return NextResponse.json({
        error: 'No pending tasks found to schedule. Please add tasks first!',
      }, { status: 400 });
    }

    // 2. Fetch preferences
    let pref = await prisma.preference.findUnique({ where: { userId } });
    if (!pref) {
      pref = await prisma.preference.create({
        data: {
          userId,
          workStart: '09:00',
          workEnd: '18:00',
          daysOff: 'Saturday,Sunday',
          bufferMinutes: 15,
          maxFocusBlockMin: 120,
        },
      });
    }

    const preferencesDTO = {
      workStart: pref.workStart,
      workEnd: pref.workEnd,
      daysOff: pref.daysOff.split(',').filter(Boolean),
      bufferMinutes: pref.bufferMinutes,
      maxFocusBlockMin: pref.maxFocusBlockMin,
    };

    // 3. Fetch existing calendar events
    let existingEvents = await fetchGoogleCalendarEvents(userId, weekStart.toISOString(), weekEnd.toISOString());

    // If no Google Calendar events found, include standard demo events for realistic context
    if (existingEvents.length === 0) {
      const mon10 = new Date(weekStart);
      mon10.setHours(10, 0, 0, 0);
      const mon11 = new Date(weekStart);
      mon11.setHours(11, 0, 0, 0);

      const wed14 = new Date(weekStart);
      wed14.setDate(wed14.getDate() + 2);
      wed14.setHours(14, 0, 0, 0);
      const wed15 = new Date(weekStart);
      wed15.setDate(wed15.getDate() + 2);
      wed15.setHours(15, 30, 0, 0);

      existingEvents = [
        {
          id: 'demo-1',
          summary: '👥 Weekly Team Sync',
          start: mon10.toISOString(),
          end: mon11.toISOString(),
        },
        {
          id: 'demo-2',
          summary: '📞 Client Architecture Review',
          start: wed14.toISOString(),
          end: wed15.toISOString(),
        },
      ];
    }

    // 4. Map DB tasks to constraint types
    const taskConstraints = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      durationMin: t.durationMin,
      deadline: t.deadline ? t.deadline.toISOString() : undefined,
      priority: t.priority,
      category: t.category,
      constraints: t.constraints || undefined,
    }));

    // 5. Run LangChain scheduling engine
    const aiResult = await runAISchedulingPipeline(
      taskConstraints,
      preferencesDTO,
      existingEvents,
      weekStart.toISOString(),
      weekEnd.toISOString()
    );

    // 6. Save or update Schedule record in DB
    const blocksJsonString = JSON.stringify(aiResult.schedule);

    const savedSchedule = await prisma.schedule.create({
      data: {
        userId,
        weekOf: weekStart,
        blocksJson: blocksJsonString,
      },
    });

    return NextResponse.json({
      scheduleId: savedSchedule.id,
      weekOf: savedSchedule.weekOf,
      blocks: aiResult.schedule,
      unscheduledTasks: aiResult.unscheduledTasks || [],
      summaryNotes: aiResult.summaryNotes,
    });
  } catch (error: any) {
    console.error('Failed to generate AI schedule:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate schedule' }, { status: 500 });
  }
}
