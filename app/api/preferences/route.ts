import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, MOCK_USER_ID } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;

  try {
    let pref = await prisma.preference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await prisma.preference.create({
        data: {
          userId,
          workStart: '09:00',
          workEnd: '18:00',
          daysOff: 'Saturday,Sunday',
          bufferMinutes: 15,
          maxFocusBlockMin: 120,
          chronotype: 'flexible',
          peakStart: '09:00',
          peakEnd: '12:00',
        },
      });
    }

    return NextResponse.json({
      ...pref,
      daysOffArray: pref.daysOff ? pref.daysOff.split(',').filter(Boolean) : [],
    });
  } catch (error) {
    console.error('Failed to fetch preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;

  try {
    const body = await request.json();
    const { workStart, workEnd, daysOff, bufferMinutes, maxFocusBlockMin, chronotype, peakStart, peakEnd } = body;

    const daysOffString = Array.isArray(daysOff) ? daysOff.join(',') : daysOff || 'Saturday,Sunday';

    const pref = await prisma.preference.upsert({
      where: { userId },
      update: {
        workStart: workStart || '09:00',
        workEnd: workEnd || '18:00',
        daysOff: daysOffString,
        bufferMinutes: Number(bufferMinutes || 15),
        maxFocusBlockMin: Number(maxFocusBlockMin || 120),
        chronotype: chronotype || 'flexible',
        peakStart: peakStart || '09:00',
        peakEnd: peakEnd || '12:00',
      },
      create: {
        userId,
        workStart: workStart || '09:00',
        workEnd: workEnd || '18:00',
        daysOff: daysOffString,
        bufferMinutes: Number(bufferMinutes || 15),
        maxFocusBlockMin: Number(maxFocusBlockMin || 120),
        chronotype: chronotype || 'flexible',
        peakStart: peakStart || '09:00',
        peakEnd: peakEnd || '12:00',
      },
    });

    return NextResponse.json({
      ...pref,
      daysOffArray: pref.daysOff ? pref.daysOff.split(',').filter(Boolean) : [],
    });
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
