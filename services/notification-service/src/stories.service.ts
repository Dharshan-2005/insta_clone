import { Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { deleteStoryImage, saveStoryImage } from './media';
import { PrismaService } from './prisma.service';
import { UsersClient } from './users.client';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class StoriesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StoriesService.name);
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersClient,
  ) {}

  onModuleInit() {
    this.cleanupTimer = setInterval(() => {
      this.removeExpired().catch((err) => this.logger.error(`Story cleanup failed: ${(err as Error).message}`));
    }, CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }

  async create(userId: string, file: Express.Multer.File, caption?: string | null) {
    const mediaPath = await saveStoryImage(file, userId);
    return this.prisma.story.create({
      data: { userId, mediaPath, caption, expiresAt: new Date(Date.now() + STORY_TTL_MS) },
    });
  }

  async feed(viewerId: string) {
    const authorIds = [viewerId, ...(await this.users.followingIds(viewerId))];
    const stories = await this.prisma.story.findMany({
      where: { userId: { in: authorIds }, expiresAt: { gt: new Date() } },
      include: {
        views: { where: { viewerId }, select: { viewerId: true } },
        _count: { select: { views: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const users = await this.users.summaries(stories.map((story) => story.userId));

    const toDto = ({ views, _count, ...story }: (typeof stories)[number]) => ({
      ...story,
      viewed: story.userId === viewerId || views.length > 0,
      viewsCount: story.userId === viewerId ? _count.views : null,
    });
    const groups = new Map<string, ReturnType<typeof toDto>[]>();
    for (const story of stories) {
      groups.set(story.userId, [...(groups.get(story.userId) ?? []), toDto(story)]);
    }

    return [...groups.entries()]
      .filter(([userId]) => users.has(userId))
      .map(([userId, items]) => ({
        user: users.get(userId)!,
        stories: items,
        hasUnseen: items.some((story) => !story.viewed),
      }))
      .sort((a, b) => {
        if (a.user.id === viewerId) return -1;
        if (b.user.id === viewerId) return 1;
        return Number(b.hasUnseen) - Number(a.hasUnseen);
      });
  }

  async view(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId }, select: { userId: true } });
    if (!story) throw new NotFoundException('Story not found');
    if (story.userId === viewerId) return;
    await this.prisma.storyView.createMany({ data: { storyId, viewerId }, skipDuplicates: true });
  }

  private async removeExpired() {
    const expired = await this.prisma.story.findMany({
      where: { expiresAt: { lte: new Date() } },
      select: { id: true, mediaPath: true },
    });
    if (expired.length === 0) return;
    await this.prisma.story.deleteMany({ where: { id: { in: expired.map((story) => story.id) } } });
    await Promise.all(expired.map((story) => deleteStoryImage(story.mediaPath)));
  }
}
