import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, MOCK_USER_ID } from '@/lib/auth';
import { fetchGoogleCalendarEvents } from '@/lib/google/calendarClient';
import { parseISO, isBefore, isAfter, startOfWeek, addDays } from 'date-fns';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;

  try {
    const body = await request.json();
    const { blocks, weekOf } = body;

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return NextResponse.json({ hasConflicts: false, conflicts: [] });
    }

    const weekStart = weekOf ? parseISO(weekOf) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    // Fetch latest calendar events
    let latestEvents = await fetchGoogleCalendarEvents(userId, weekStart.toISOString(), weekEnd.toISOString());

    // If no Google Calendar events found, use standard demo events
    if (latestEvents.length === 0) {
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

      latestEvents = [
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

    const conflicts: {
      blockId: string;
      blockTitle: string;
      conflictingEventTitle: string;
      eventStart: string;
      eventEnd: string;
    }[] = [];

    for (const block of blocks) {
      const bStart = parseISO(block.start);
      const bEnd = parseISO(block.end);

      for (const event of latestEvents) {
        const eStart = parseISO(event.start);
        const eEnd = parseISO(event.end);

        if (isBefore(bStart, eEnd) && isAfter(bEnd, eStart)) {
          conflicts.push({
            blockId: block.id,
            blockTitle: block.title,
            conflictingEventTitle: event.summary,
            eventStart: event.start,
            eventEnd: event.end,
          });
          break; // move to next block once conflict detected
        }
      }
    }

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts,
    });
  } catch (error: any) {
    console.error('Failed to check schedule conflicts:', error);
    return NextResponse.json({ error: 'Failed to check conflicts' }, { status: 500 });
  }
}
