import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, MOCK_USER_ID } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;

  try {
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;

  try {
    const body = await request.json();
    const { title, durationMin, deadline, priority, category, constraints } = body;

    if (!title || !durationMin) {
      return NextResponse.json({ error: 'Title and duration are required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        durationMin: Number(durationMin),
        deadline: deadline ? new Date(deadline) : null,
        priority: priority ? Number(priority) : 3,
        category: category || 'Work',
        constraints: constraints || null,
        status: 'pending',
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
