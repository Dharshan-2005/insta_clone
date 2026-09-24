import { PrismaService } from './prisma.service';

const ALEX = '00000000-0000-4000-8000-000000000001';
const SARAH = '00000000-0000-4000-8000-000000000002';
const MARCUS = '00000000-0000-4000-8000-000000000003';
const ELENA = '00000000-0000-4000-8000-000000000004';
const DAVID = '00000000-0000-4000-8000-000000000005';

const post = (index: number) => `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
const id = (index: number) => `30000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
const HOUR = 60 * 60 * 1000;

export async function seedDemoData(prisma: PrismaService) {
  const now = Date.now();
  const notifications = [
    { userId: ALEX, actorId: SARAH, type: 'like', postId: post(1) },
    { userId: ALEX, actorId: MARCUS, type: 'comment', postId: post(2), text: 'Where was this taken? Looks incredible!' },
    { userId: ALEX, actorId: SARAH, type: 'follow' },
    { userId: SARAH, actorId: ALEX, type: 'like', postId: post(4) },
    { userId: SARAH, actorId: ELENA, type: 'follow' },
    { userId: MARCUS, actorId: DAVID, type: 'like', postId: post(7) },
    { userId: ELENA, actorId: SARAH, type: 'comment', postId: post(10), text: 'Love this so much ✨' },
    { userId: DAVID, actorId: MARCUS, type: 'follow' },
  ];

  await prisma.notification.createMany({
    data: notifications.map((notification, index) => ({
      ...notification,
      id: id(index + 1),
      read: index % 3 === 2,
      createdAt: new Date(now - (index + 1) * HOUR),
    })),
    skipDuplicates: true,
  });

  const key = [ALEX, SARAH].sort().join(':');
  if (await prisma.conversation.findUnique({ where: { key } })) return;

  await prisma.conversation.create({
    data: {
      key,
      updatedAt: new Date(now - HOUR),
      participants: { create: [{ userId: ALEX }, { userId: SARAH, lastReadAt: new Date(now - 2 * HOUR) }] },
      messages: {
        create: [
          { senderId: SARAH, text: 'Hey Alex! Loved your latest post 😍', createdAt: new Date(now - 3 * HOUR) },
          { senderId: ALEX, text: 'Thanks Sarah! It was a great trip.', createdAt: new Date(now - 2 * HOUR) },
          { senderId: ALEX, text: 'We should plan a photo walk soon 📸', createdAt: new Date(now - HOUR) },
        ],
      },
    },
  });
}
