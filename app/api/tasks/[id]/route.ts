import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, MOCK_USER_ID } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;
  const taskId = params.id;

  try {
    const body = await request.json();
    const { title, durationMin, deadline, priority, category, constraints, status } = body;

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title ? { title } : {}),
        ...(durationMin ? { durationMin: Number(durationMin) } : {}),
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : existingTask.deadline,
        ...(priority !== undefined ? { priority: Number(priority) } : {}),
        ...(category ? { category } : {}),
        constraints: constraints !== undefined ? constraints : existingTask.constraints,
        ...(status ? { status } : {}),
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || MOCK_USER_ID;
  const taskId = params.id;

  try {
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
