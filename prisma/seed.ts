import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      id: 'demo-user-123',
      email: 'demo@example.com',
      name: 'Demo User',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      preferences: {
        create: {
          workStart: '09:00',
          workEnd: '18:00',
          daysOff: 'Saturday,Sunday',
          bufferMinutes: 15,
          maxFocusBlockMin: 120,
        },
      },
    },
  });

  // Seed sample tasks
  const now = new Date();
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + 4);

  const sampleTasks = [
    {
      userId: user.id,
      title: '🚀 Complete Q3 Product Roadmap & Strategy',
      durationMin: 120,
      priority: 1,
      category: 'Work',
      deadline: nextFriday,
      constraints: 'Mornings preferred',
      status: 'pending',
    },
    {
      userId: user.id,
      title: '📊 Review Financial Budget Spreadsheet',
      durationMin: 60,
      priority: 2,
      category: 'Work',
      constraints: 'No Fridays',
      status: 'pending',
    },
    {
      userId: user.id,
      title: '🧘 45-min Guided Mindfulness & Yoga',
      durationMin: 45,
      priority: 3,
      category: 'Health',
      status: 'pending',
    },
    {
      userId: user.id,
      title: '📚 Read 2 Chapters of System Design Book',
      durationMin: 90,
      priority: 3,
      category: 'Study',
      status: 'pending',
    },
  ];

  for (const t of sampleTasks) {
    await prisma.task.create({ data: t });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
