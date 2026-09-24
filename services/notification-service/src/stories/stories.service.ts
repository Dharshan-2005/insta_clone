import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class StoriesService {
  private userServiceUrl: string;
  private baseUploadDir: string;

  constructor(private prisma: PrismaService) {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:4002';
    this.baseUploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), '../../uploads');
  }

  async createStory(userId: string, file: any, caption?: string) {
    if (!file) throw new BadRequestException('Image file is required');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours expiration

    const relativeSubdir = path.join('stories', userId);
    const targetDir = path.join(this.baseUploadDir, relativeSubdir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(file.originalname || file.name || '.jpg') || '.jpg';
    const filename = `${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(targetDir, filename);

    if (file.buffer) {
      await fs.promises.writeFile(fullPath, file.buffer);
    }

    const mediaPath = path.posix.join('stories', userId, filename);

    const story = await this.prisma.story.create({
      data: {
        userId,
        mediaPath,
        mediaType: 'image',
        caption,
        expiresAt,
      },
    });

    return story;
  }

  async getFeedStories(currentUserId: string) {
    const now = new Date();

    // Get following user IDs from user-service
    let followingIds: string[] = [];
    try {
      const res = await axios.get(`${this.userServiceUrl}/users/${currentUserId}/following`);
      const list: any[] = res.data?.data || [];
      followingIds = list.map((item) => item.userId || item.id);
    } catch {}

    const targetUserIds = [...new Set([currentUserId, ...followingIds])];

    const stories = await this.prisma.story.findMany({
      where: {
        userId: { in: targetUserIds },
        expiresAt: { gt: now },
      },
      include: {
        views: { select: { viewerId: true } },
        likes: { select: { userId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Hydrate user profiles
    const userMap = new Map<string, any>();
    await Promise.all(
      targetUserIds.map(async (uid) => {
        try {
          const res = await axios.get(`${this.userServiceUrl}/users/by-id/${uid}`);
          if (res.data?.data) userMap.set(uid, res.data.data);
        } catch {
          userMap.set(uid, {
            id: uid,
            username: `user_${uid.slice(0, 6)}`,
            name: `User ${uid.slice(0, 6)}`,
            avatar: null,
          });
        }
      }),
    );

    // Group active stories by user
    const groupedMap = new Map<string, any[]>();
    for (const story of stories) {
      if (!groupedMap.has(story.userId)) {
        groupedMap.set(story.userId, []);
      }

      const isViewed = story.views.some((v) => v.viewerId === currentUserId);
      const isLiked = story.likes.some((l) => l.userId === currentUserId);

      groupedMap.get(story.userId)!.push({
        id: story.id,
        userId: story.userId,
        mediaPath: story.mediaPath,
        mediaType: story.mediaType,
        caption: story.caption,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        viewsCount: story.views.length,
        likesCount: story.likes.length,
        isViewed,
        isLiked,
      });
    }

    const result = Array.from(groupedMap.entries()).map(([userId, userStories]) => {
      const profile = userMap.get(userId) || {
        id: userId,
        username: `user_${userId.slice(0, 6)}`,
        name: `User ${userId.slice(0, 6)}`,
        avatar: null,
      };
      const allViewed = userStories.every((s) => s.isViewed);

      return {
        user: profile,
        hasUnseen: !allViewed,
        stories: userStories,
      };
    });

    return result;
  }

  async recordView(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');

    await this.prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId, viewerId } },
      update: {},
      create: { storyId, viewerId },
    });

    return { success: true };
  }

  async likeStory(storyId: string, userId: string) {
    await this.prisma.storyLike.upsert({
      where: { storyId_userId: { storyId, userId } },
      update: {},
      create: { storyId, userId },
    });
    return { success: true, isLiked: true };
  }

  async deleteStory(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');
    if (story.userId !== userId) throw new ForbiddenException('Cannot delete another users story');

    await this.prisma.story.delete({ where: { id: storyId } });
    return { success: true };
  }

  async cleanupExpiredStories() {
    const now = new Date();
    const deleted = await this.prisma.story.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    return deleted.count;
  }
}
