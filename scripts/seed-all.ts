import { execSync } from 'child_process';
import * as path from 'path';

// Database URLs for local seeding (Postgres exposed on localhost:5433 via docker-compose)
const SERVICE_DB_URLS: Record<string, string> = {
  'auth-service': 'postgresql://instagram:instagram_secret@localhost:5433/auth_db',
  'user-service': 'postgresql://instagram:instagram_secret@localhost:5433/user_db',
  'post-service': 'postgresql://instagram:instagram_secret@localhost:5433/post_db',
  'feed-service': 'postgresql://instagram:instagram_secret@localhost:5433/feed_db',
  'notification-service': 'postgresql://instagram:instagram_secret@localhost:5433/notification_db',
};

function runStep(title: string, cmd: string, cwd: string, extraEnv?: Record<string, string>) {
  console.log(`\n========================================`);
  console.log(`▶ Step: ${title}`);
  console.log(`========================================`);
  try {
    execSync(cmd, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: 'true', ...extraEnv },
    });
    console.log(`✔ Completed: ${title}`);
  } catch (err) {
    console.error(`✖ Failed step "${title}":`, (err as Error).message);
    throw err;
  }
}

function envForService(service: string): Record<string, string> {
  const url = SERVICE_DB_URLS[service];
  return url ? { DATABASE_URL: url } : {};
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  console.log('Starting master seed pipeline for Instagram Clone microservices...');

  // 1. Prepare the checked-in 20-image demo media set (5 profiles + 15 posts).
  runStep('Prepare Demo Media', 'node scripts/prepare-demo-media.js', rootDir);

  // 2. Create/sync all service database schemas before inserting demo data.
  const schemaServices = [
    ['auth-service', 'Auth DB Schema'],
    ['user-service', 'User DB Schema'],
    ['post-service', 'Post DB Schema'],
    ['feed-service', 'Feed DB Schema'],
    ['notification-service', 'Notification DB Schema'],
  ] as const;
  for (const [service, label] of schemaServices) {
    runStep(label, 'npx prisma db push --schema=prisma/schema.prisma --accept-data-loss', path.join(rootDir, 'services', service), envForService(service));
  }

  // 3. Auth Service
  runStep('Seed Auth Service', 'npx ts-node prisma/seed.ts', path.join(rootDir, 'services/auth-service'), envForService('auth-service'));

  // 4. User Service
  runStep('Seed User Service', 'npx ts-node prisma/seed.ts', path.join(rootDir, 'services/user-service'), envForService('user-service'));

  // 5. Post Service
  runStep('Seed Post Service', 'npx ts-node prisma/seed.ts', path.join(rootDir, 'services/post-service'), envForService('post-service'));

  // 6. Feed Service
  runStep('Seed Feed Service', 'npx ts-node prisma/seed.ts', path.join(rootDir, 'services/feed-service'), envForService('feed-service'));

  // 7. Notification Service
  runStep('Seed Notification Service', 'npx ts-node prisma/seed.ts', path.join(rootDir, 'services/notification-service'), envForService('notification-service'));

  console.log(`\n========================================`);
  console.log(`🎉 Master seed pipeline completed successfully!`);
  console.log(`All microservice databases and media storage are seeded with production demo data.`);
  console.log(`========================================`);
}

main().catch(() => {
  process.exit(1);
});
