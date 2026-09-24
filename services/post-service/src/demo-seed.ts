import { PrismaService } from './prisma.service';

const USERS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
];

const CAPTIONS = [
  'Golden hour never disappoints ✨',
  'Just another day in paradise 🌅',
  'The best things in life are free 🌿',
  'Creating memories that last forever 📸',
  'Life is better when you are laughing 😄',
  'Exploring new places, finding new perspectives 🗺️',
  'Sunday vibes ☀️',
  'Work hard, travel harder ✈️',
  'Good food, good mood 🍕',
  'Adventure awaits around every corner 🏞️',
  'Coffee first, adulting second ☕',
  'Chasing sunsets and new horizons 🌇',
  'Weekend getaway with the best crew 🌊',
  'Urban architecture and shadow play 🏙️',
  'Finding peace in the simple moments 🍃',
];

const COMMENTS = [
  'Stunning shot! Love the colors 😍',
  'Where was this taken? Looks incredible!',
  'Absolutely breathtaking view 🔥',
  'Goals!! 🙌',
  'Love this so much ✨',
];

const HOUR = 60 * 60 * 1000;
const demoId = (prefix: number, index: number) =>
  `${prefix}0000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;

export async function seedDemoData(prisma: PrismaService) {
  const now = Date.now();
  const posts = CAPTIONS.map((caption, index) => ({
    id: demoId(1, index),
    userId: USERS[Math.floor(index / 3)],
    caption,
    mediaPath: `posts/demo/demo-post-${String(index + 1).padStart(2, '0')}.webp`,
    mediaType: 'image',
    createdAt: new Date(now - (index + 1) * 4 * HOUR),
  }));

  await prisma.post.createMany({ data: posts, skipDuplicates: true });

  await prisma.like.createMany({
    data: posts.flatMap((post) =>
      USERS.filter((userId) => userId !== post.userId)
        .slice(0, 2)
        .map((userId) => ({ postId: post.id, userId })),
    ),
    skipDuplicates: true,
  });

  await prisma.comment.createMany({
    data: posts.map((post, index) => ({
      id: demoId(2, index),
      postId: post.id,
      userId: USERS[(Math.floor(index / 3) + 1) % USERS.length],
      text: COMMENTS[index % COMMENTS.length],
      createdAt: new Date(post.createdAt.getTime() + HOUR),
    })),
    skipDuplicates: true,
  });

  await prisma.bookmark.createMany({
    data: USERS.map((userId, index) => ({ userId, postId: posts[(index * 3 + 4) % posts.length].id })),
    skipDuplicates: true,
  });
}
