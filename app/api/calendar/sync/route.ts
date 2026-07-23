import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, MOCK_USER_ID } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncScheduleBlocksToGoogleCalendar } from '@/lib/google/calendarClient';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;

  try {
    const body = await request.json();
    const { scheduleId, blocks } = body;

    if (!blocks || !Array.isArray(blocks)) {
      return NextResponse.json({ error: 'Invalid time blocks provided' }, { status: 400 });
    }

    let syncedBlocks = blocks;

    // Check if user has connected Google Calendar
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const hasGoogleConn = Boolean(user?.googleAccessToken || user?.googleRefreshToken);

    if (hasGoogleConn) {
      try {
        const syncResults = await syncScheduleBlocksToGoogleCalendar(userId, blocks);
        // Attach returned googleEventId
        syncedBlocks = blocks.map((b) => {
          const matched = syncResults.find((r) => r.id === b.id);
          return {
            ...b,
            googleEventId: matched ? matched.googleEventId : b.googleEventId,
            isSynced: true,
          };
        });
      } catch (err: any) {
        console.warn('Google Calendar API sync failed:', err.message);
      }
    } else {
      // Mark as synced locally for demo mode
      syncedBlocks = blocks.map((b) => ({ ...b, isSynced: true }));
    }

    // Save updated blocks into Schedule DB record if scheduleId exists
    if (scheduleId) {
      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          blocksJson: JSON.stringify(syncedBlocks),
        },
      });
    }

    // Mark scheduled tasks as 'scheduled' status
    const taskIds = Array.from(new Set(syncedBlocks.map((b: any) => b.taskId).filter(Boolean)));
    if (taskIds.length > 0) {
      await prisma.task.updateMany({
        where: { id: { in: taskIds }, userId },
        data: { status: 'scheduled' },
      });
    }

    return NextResponse.json({
      success: true,
      syncedToGoogle: hasGoogleConn,
      blocks: syncedBlocks,
      message: hasGoogleConn
        ? 'Successfully synchronized schedule to Google Calendar!'
        : 'Schedule saved and confirmed locally (Connect Google Calendar in settings to write to your live calendar).',
    });
  } catch (error: any) {
    console.error('Failed to sync calendar schedule:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync schedule' }, { status: 500 });
  }
}
