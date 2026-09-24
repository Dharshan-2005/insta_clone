import { PrismaClient } from '../.prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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
  'Fresh perspectives from up high 🏔️',
  'Living in full color 🎨',
  'Making every second count ⏱️',
  'Nature never goes out of style 🌲',
  'Grateful for today and excited for tomorrow 🌟',
];

const COMMENTS_POOL = [
  'Stunning shot! Love the colors 😍',
  'Where was this taken? Looks incredible!',
  'Absolutely breathtaking view 🔥',
  'Goals!! 🙌',
  'Love this so much ✨',
  'Such great vibes here 💫',
  'Pure perfection 👏',
  'Can I come next time? 😂',
  'Always inspiring content! 💯',
  'This deserves more likes honestly!',
  'The lighting in this is magical 🌅',
  'Incredible photography skills 📷',
];

async function main() {
  console.log('Seeding post-service with the 5-account / 15-post demo dataset...');

  const usersPath = path.resolve(__dirname, '../../../infrastructure/seed-data/users.json');
  const uploadsRoot = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../../uploads');
  const demoPostsDir = path.join(uploadsRoot, 'posts', 'demo');

  if (!fs.existsSync(usersPath)) {
    throw new Error('Missing infrastructure/seed-data/users.json. Run the auth seed first.');
  }
  const userMap: { [email: string]: string } = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

  const emails = [
    'alex.morgan@instagram.com',
    'sarah.chen@instagram.com',
    'marcus.vance@instagram.com',
    'elena.rostova@instagram.com',
    'david.kim@instagram.com',
  ];
  const missing = emails.filter((email) => !userMap[email]);
  if (missing.length) {
    throw new Error(`Missing demo users in users.json: ${missing.join(', ')}`);
  }

  if (!fs.existsSync(demoPostsDir)) {
    throw new Error(`Missing demo media directory: ${demoPostsDir}. Run \\"node scripts/prepare-demo-media.js\\" first.`);
  }

  // Keep IDs deterministic so feed/notification seed data remains stable across resets.
  const demoPostIds = Array.from({ length: 15 }, (_, i) =>
    `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  );

  const createdPosts: { id: string; userId: string }[] = [];
  await prisma.$transaction([
    prisma.bookmark.deleteMany({}),
    prisma.comment.deleteMany({}),
    prisma.like.deleteMany({}),
    prisma.postMedia.deleteMany({}),
    prisma.post.deleteMany({}),
  ]);

  for (let index = 1; index <= 15; index += 1) {
    const accountIndex = Math.floor((index - 1) / 3);
    const email = emails[accountIndex];
    const userId = userMap[email];
    const filename = `demo-post-${String(index).padStart(2, '0')}.webp`;
    const mediaPath = path.posix.join('posts', 'demo', filename);
    const fullPath = path.join(demoPostsDir, filename);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing demo post image: ${fullPath}`);
    }

    const post = await prisma.post.create({
      data: {
        id: demoPostIds[index - 1],
        userId,
        caption: CAPTIONS[(index - 1) % CAPTIONS.length],
        mediaPath,
        mediaType: 'image',
        likesCount: 0,
        createdAt: new Date(Date.now() - index * 4 * 60 * 60 * 1000),
      },
    });
    await prisma.postMedia.create({
      data: {
        postId: post.id,
        type: 'image',
        path: mediaPath,
        thumbnailPath: mediaPath,
        mimeType: 'image/webp',
        position: 0,
      },
    });
    createdPosts.push({ id: post.id, userId: post.userId });
  }

  let totalLikes = 0;
  for (let index = 0; index < createdPosts.length; index += 1) {
    const post = createdPosts[index];
    const likerIds = emails
      .map((email) => userMap[email])
      .filter((id) => id && id !== post.userId)
      .slice(0, 2);

    for (const likerId of likerIds) {
      await prisma.like.create({ data: { postId: post.id, userId: likerId } });
      totalLikes += 1;
    }
    await prisma.post.update({ where: { id: post.id }, data: { likesCount: likerIds.length } });
  }

  let totalComments = 0;
  for (let index = 0; index < createdPosts.length; index += 1) {
    const commenterId = userMap[emails[(index + 1) % emails.length]];
    await prisma.comment.create({
      data: {
        postId: createdPosts[index].id,
        userId: commenterId,
        text: COMMENTS_POOL[index % COMMENTS_POOL.length],
      },
    });
    totalComments += 1;
  }

  let totalBookmarks = 0;
  for (let index = 0; index < emails.length; index += 1) {
    const userId = userMap[emails[index]];
    const targetPost = createdPosts[(index + 2) % createdPosts.length];
    if (!targetPost) continue;
    await prisma.bookmark.create({ data: { postId: targetPost.id, userId } });
    totalBookmarks += 1;
  }

  const outDir = path.resolve(__dirname, '../../../infrastructure/seed-data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'posts.json'), JSON.stringify(createdPosts, null, 2));

  console.log(`Seeded 5 demo accounts x 3 posts = ${createdPosts.length} posts, ${totalLikes} likes, ${totalComments} comments, ${totalBookmarks} bookmarks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
