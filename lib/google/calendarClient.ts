import { google } from 'googleapis';
import { prisma } from '@/lib/db';

export interface CalendarEventDTO {
  id?: string;
  summary: string;
  description?: string;
  start: string; // ISO String
  end: string;   // ISO String
  location?: string;
  colorId?: string;
}

export async function getGoogleCalendarClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken || undefined,
    refresh_token: user.googleRefreshToken || undefined,
  });

  // Handle automatic token refresh if refresh_token is present
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
          ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
        },
      });
    }
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function fetchGoogleCalendarEvents(
  userId: string,
  startDateISO: string,
  endDateISO: string
): Promise<CalendarEventDTO[]> {
  const calendar = await getGoogleCalendarClient(userId);
  if (!calendar) {
    return [];
  }

  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDateISO,
      timeMax: endDateISO,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = res.data.items || [];
    return items
      .filter((item) => item.start?.dateTime && item.end?.dateTime)
      .map((item) => ({
        id: item.id || undefined,
        summary: item.summary || 'Untitled Event',
        description: item.description || '',
        start: item.start!.dateTime!,
        end: item.end!.dateTime!,
        location: item.location || '',
      }));
  } catch (error) {
    console.error('Failed to fetch Google Calendar events:', error);
    return [];
  }
}

export async function syncScheduleBlocksToGoogleCalendar(
  userId: string,
  blocks: {
    id: string;
    title: string;
    category?: string;
    start: string;
    end: string;
    googleEventId?: string;
  }[]
): Promise<{ id: string; googleEventId: string }[]> {
  const calendar = await getGoogleCalendarClient(userId);
  if (!calendar) {
    throw new Error('Google Calendar is not connected for this user.');
  }

  const results: { id: string; googleEventId: string }[] = [];

  for (const block of blocks) {
    const eventResource = {
      summary: `[AI Plan] ${block.title}`,
      description: `Scheduled by AI Calendar Planner (${block.category || 'General'})`,
      start: { dateTime: block.start },
      end: { dateTime: block.end },
    };

    if (block.googleEventId) {
      try {
        const res = await calendar.events.update({
          calendarId: 'primary',
          eventId: block.googleEventId,
          requestBody: eventResource,
        });
        results.push({ id: block.id, googleEventId: res.data.id || block.googleEventId });
      } catch (err) {
        // If event was deleted externally, insert a new one
        const res = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventResource,
        });
        results.push({ id: block.id, googleEventId: res.data.id! });
      }
    } else {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventResource,
      });
      results.push({ id: block.id, googleEventId: res.data.id! });
    }
  }

  return results;
}
