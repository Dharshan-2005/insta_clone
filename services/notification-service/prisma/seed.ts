import { PrismaClient } from '../.prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding notification-service...');
  const usersPath = path.resolve(__dirname, '../../../infrastructure/seed-data/users.json');
  const postsPath = path.resolve(__dirname, '../../../infrastructure/seed-data/posts.json');

  if (!fs.existsSync(usersPath)) {
    console.warn('Missing users.json! Run auth-service seed first.');
    return;
  }

  const userMap: { [email: string]: string } = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  const userIds = Object.values(userMap);
  let posts: { id: string; userId: string }[] = [];
  if (fs.existsSync(postsPath)) {
    posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
  }

  console.log(`Generating notifications for ${userIds.length} users...`);

  let count = 0;
  for (const userId of userIds) {
    // 5-8 notifications per user = ~120 total notifications
    const notifCount = 5 + Math.floor(Math.random() * 4);
    const otherUsers = userIds.filter((id) => id !== userId);

    for (let i = 0; i < notifCount; i++) {
      const actorId = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      const typeChoice = Math.random();
      let type: string;
      let message: string;
      let postId: string | null = null;

      if (typeChoice < 0.45 && posts.length > 0) {
        type = 'LIKE';
        const userPosts = posts.filter((p) => p.userId === userId);
        postId = userPosts.length > 0 ? userPosts[0].id : posts[0].id;
        message = 'liked your photo.';
      } else if (typeChoice < 0.75 && posts.length > 0) {
        type = 'COMMENT';
        const userPosts = posts.filter((p) => p.userId === userId);
        postId = userPosts.length > 0 ? userPosts[0].id : posts[0].id;
        message = 'commented: "Awesome shot! ✨"';
      } else {
        type = 'FOLLOW';
        message = 'started following you.';
      }

      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 3600 * 1000);

      await prisma.notification.create({
        data: {
          userId,
          actorId,
          type,
          postId,
          message,
          read: i > 2, // newest are unread
          createdAt,
        },
      });
      count++;
    }
  }

  console.log(`Successfully seeded ${count} notifications in notification_db.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
