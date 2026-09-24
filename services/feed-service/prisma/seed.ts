import { PrismaClient } from '../.prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding feed-service...');
  const usersPath = path.resolve(__dirname, '../../../infrastructure/seed-data/users.json');
  const postsPath = path.resolve(__dirname, '../../../infrastructure/seed-data/posts.json');

  if (!fs.existsSync(usersPath) || !fs.existsSync(postsPath)) {
    console.warn('Missing users.json or posts.json! Run auth, user, and post seeds first.');
    return;
  }

  const userMap: { [email: string]: string } = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  const posts: { id: string; userId: string }[] = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
  const userIds = Object.values(userMap);

  console.log(`Pre-populating feeds for ${userIds.length} users with ${posts.length} posts...`);

  let count = 0;
  for (const userId of userIds) {
    // Pick posts by other users + some self posts
    const relevantPosts = posts.filter((p) => p.userId !== userId).slice(0, 15);
    const selfPosts = posts.filter((p) => p.userId === userId);
    const allForUser = [...selfPosts, ...relevantPosts];

    for (const post of allForUser) {
      await prisma.feedItem.upsert({
        where: { userId_postId: { userId, postId: post.id } },
        update: {},
        create: {
          userId,
          postId: post.id,
          authorId: post.userId,
        },
      });
      count++;
    }
  }

  console.log(`Successfully seeded ${count} feed items in feed_db.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
