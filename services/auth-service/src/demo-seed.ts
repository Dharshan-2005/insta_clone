import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma.service';

const DEMO_PASSWORD = 'demo1234';

const DEMO_USERS = [
  { id: '00000000-0000-4000-8000-000000000001', email: 'alex.morgan@example.com' },
  { id: '00000000-0000-4000-8000-000000000002', email: 'sarah.chen@example.com' },
  { id: '00000000-0000-4000-8000-000000000003', email: 'marcus.vance@example.com' },
  { id: '00000000-0000-4000-8000-000000000004', email: 'elena.rostova@example.com' },
  { id: '00000000-0000-4000-8000-000000000005', email: 'david.kim@example.com' },
];

export async function seedDemoData(prisma: PrismaService) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.user.createMany({
    data: DEMO_USERS.map((user) => ({ ...user, passwordHash })),
    skipDuplicates: true,
  });
}
