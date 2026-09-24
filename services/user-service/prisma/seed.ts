import { PrismaClient } from '../.prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SEED_PROFILES = [
  { username: 'alex_morgan', email: 'alex.morgan@instagram.com', name: 'Alex Morgan', bio: 'Software Architect & Open Source Enthusiast 🚀', subtitle: 'Software Architect', avatar: '/media/profiles/demo/demo-01-alex.webp' },
  { username: 'sarah_chen', email: 'sarah.chen@instagram.com', name: 'Sarah Chen', bio: 'UI/UX Designer | Crafting digital experiences ✨', subtitle: 'Product Designer', avatar: '/media/profiles/demo/demo-02-sarah.webp' },
  { username: 'marcus_vance', email: 'marcus_vance@instagram.com', name: 'Marcus Vance', bio: 'Travel & Landscape Photographer 📸', subtitle: 'Photographer', avatar: '/media/profiles/demo/demo-03-marcus.webp' },
  { username: 'elena_rostova', email: 'elena.rostova@instagram.com', name: 'Elena Rostova', bio: 'Tech Founder & AI Researcher 🤖', subtitle: 'Founder', avatar: '/media/profiles/demo/demo-04-elena.webp' },
  { username: 'david_kim', email: 'david.kim@instagram.com', name: 'David Kim', bio: 'Visual Artist & Digital Creator 🎨', subtitle: 'Digital Artist', avatar: '/media/profiles/demo/demo-05-david.webp' },
];

async function main() {
  console.log('Seeding user-service...');
  const usersPath = path.resolve(__dirname, '../../../infrastructure/seed-data/users.json');

  let userMap: { [email: string]: string } = {};
  if (fs.existsSync(usersPath)) {
    userMap = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  }

  const profileMap: { [username: string]: string } = {};

  for (const p of SEED_PROFILES) {
    const userId = userMap[p.email] || `user-${p.username}`;
    profileMap[p.username] = userId;

    await prisma.profile.upsert({
      where: { userId },
      update: {
        email: p.email,
        username: p.username,
        name: p.name,
        bio: p.bio,
        subtitle: p.subtitle,
        avatar: p.avatar,
      },
      create: {
        userId,
        email: p.email,
        username: p.username,
        name: p.name,
        bio: p.bio,
        subtitle: p.subtitle,
        avatar: p.avatar,
      },
    });
  }

  // Deterministic Social Graph:
  // Alex follows Sarah & Marcus
  // Sarah follows Alex & Elena
  // Marcus follows Alex & David
  // Elena follows Sarah
  // David follows Marcus
  const followPairs = [
    [profileMap['alex_morgan'], profileMap['sarah_chen']],
    [profileMap['alex_morgan'], profileMap['marcus_vance']],
    [profileMap['sarah_chen'], profileMap['alex_morgan']],
    [profileMap['sarah_chen'], profileMap['elena_rostova']],
    [profileMap['marcus_vance'], profileMap['alex_morgan']],
    [profileMap['marcus_vance'], profileMap['david_kim']],
    [profileMap['elena_rostova'], profileMap['sarah_chen']],
    [profileMap['david_kim'], profileMap['marcus_vance']],
  ].filter(([f, t]) => Boolean(f && t));

  console.log('Creating deterministic follow relationships...');
  let followCount = 0;
  for (const [followerId, followingId] of followPairs) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      update: {},
      create: { followerId, followingId },
    });
    followCount++;
  }

  console.log(`Successfully seeded ${Object.keys(profileMap).length} profiles and ${followCount} deterministic follows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
