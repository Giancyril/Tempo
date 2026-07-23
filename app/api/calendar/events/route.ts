import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, MOCK_USER_ID } from '@/lib/auth';
import { fetchGoogleCalendarEvents } from '@/lib/google/calendarClient';
import { parseISO, addHours, setHours, setMinutes, format, startOfWeek } from 'date-fns';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  const now = new Date();
  const weekStart = startParam ? parseISO(startParam) : startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endParam ? parseISO(endParam) : addHours(weekStart, 24 * 7);

  try {
    const googleEvents = await fetchGoogleCalendarEvents(userId, weekStart.toISOString(), weekEnd.toISOString());

    if (googleEvents.length > 0) {
      return NextResponse.json({ events: googleEvents, source: 'google' });
    }

    // Return sample mock existing calendar events if Google Calendar is not connected
    const monday = setMinutes(setHours(weekStart, 10), 0);
    const wednesday = setMinutes(setHours(addHours(weekStart, 24 * 2), 14), 0);
    const friday = setMinutes(setHours(addHours(weekStart, 24 * 4), 11), 30);

    const sampleExistingEvents = [
      {
        id: 'evt-team-sync',
        summary: '👥 Weekly Team Sync',
        start: monday.toISOString(),
        end: addHours(monday, 1).toISOString(),
        source: 'sample',
      },
      {
        id: 'evt-client-call',
        summary: '📞 Client Architecture Review',
        start: wednesday.toISOString(),
        end: addHours(wednesday, 1.5).toISOString(),
        source: 'sample',
      },
      {
        id: 'evt-1on1',
        summary: '☕ 1-on-1 Catch-up',
        start: friday.toISOString(),
        end: addHours(friday, 1).toISOString(),
        source: 'sample',
      },
    ];

    return NextResponse.json({ events: sampleExistingEvents, source: 'demo' });
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}
