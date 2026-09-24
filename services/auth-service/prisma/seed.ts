import { PrismaClient } from '../.prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export const SEED_USERS = [
  { email: 'alex.morgan@instagram.com', password: 'demo1234' },
  { email: 'sarah.chen@instagram.com', password: 'demo1234' },
  { email: 'marcus.vance@instagram.com', password: 'demo1234' },
  { email: 'elena.rostova@instagram.com', password: 'demo1234' },
  { email: 'david.kim@instagram.com', password: 'demo1234' },
];

async function main() {
  console.log('Seeding auth-service...');
  const userMap: { [email: string]: string } = {};

  const passwordHash = await bcrypt.hash('demo1234', 10);

  for (const u of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash },
      create: {
        email: u.email,
        passwordHash,
        provider: 'local',
      },
    });
    userMap[u.email] = user.id;
  }

  const outDir = path.resolve(__dirname, '../../../infrastructure/seed-data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outDir, 'users.json'),
    JSON.stringify(userMap, null, 2),
  );

  console.log(`Successfully seeded ${Object.keys(userMap).length} users in auth_db.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
