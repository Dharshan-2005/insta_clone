import { PrismaService } from './prisma.service';

const ALEX = '00000000-0000-4000-8000-000000000001';
const SARAH = '00000000-0000-4000-8000-000000000002';
const MARCUS = '00000000-0000-4000-8000-000000000003';
const ELENA = '00000000-0000-4000-8000-000000000004';
const DAVID = '00000000-0000-4000-8000-000000000005';

const PROFILES = [
  {
    id: ALEX,
    username: 'alex_morgan',
    name: 'Alex Morgan',
    subtitle: 'Software Architect',
    bio: 'Software architect and open source enthusiast 🚀',
    avatar: 'profiles/demo/demo-01-alex.webp',
  },
  {
    id: SARAH,
    username: 'sarah_chen',
    name: 'Sarah Chen',
    subtitle: 'Product Designer',
    bio: 'UI/UX designer crafting digital experiences ✨',
    avatar: 'profiles/demo/demo-02-sarah.webp',
  },
  {
    id: MARCUS,
    username: 'marcus_vance',
    name: 'Marcus Vance',
    subtitle: 'Photographer',
    bio: 'Travel and landscape photographer 📸',
    avatar: 'profiles/demo/demo-03-marcus.webp',
  },
  {
    id: ELENA,
    username: 'elena_rostova',
    name: 'Elena Rostova',
    subtitle: 'Founder',
    bio: 'Tech founder and AI researcher 🤖',
    avatar: 'profiles/demo/demo-04-elena.webp',
  },
  {
    id: DAVID,
    username: 'david_kim',
    name: 'David Kim',
    subtitle: 'Digital Artist',
    bio: 'Visual artist and digital creator 🎨',
    avatar: 'profiles/demo/demo-05-david.webp',
  },
];

const FOLLOWS = [
  [ALEX, SARAH],
  [ALEX, MARCUS],
  [SARAH, ALEX],
  [SARAH, ELENA],
  [MARCUS, ALEX],
  [MARCUS, DAVID],
  [ELENA, SARAH],
  [DAVID, MARCUS],
];

export async function seedDemoData(prisma: PrismaService) {
  await prisma.profile.createMany({ data: PROFILES, skipDuplicates: true });
  await prisma.follow.createMany({
    data: FOLLOWS.map(([followerId, followingId]) => ({ followerId, followingId })),
    skipDuplicates: true,
  });
}
