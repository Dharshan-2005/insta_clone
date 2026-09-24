import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);
  private userServiceUrl: string;
  private postServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002';
    this.postServiceUrl = process.env.POST_SERVICE_URL || 'http://localhost:4003';
  }

  async getUserFeed(userId: string, cursor?: string, limit = 12) {
    const take = Math.min(Number(limit) || 12, 50);

    const queryOptions: any = {
      where: { userId },
      take: take + 1,
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    let feedItems = await this.prisma.feedItem.findMany(queryOptions);

    let postIds = feedItems.map((f) => f.postId);

    if (postIds.length === 0) {
      return { data: [], nextCursor: null, hasMore: false };
    }

    const hasMore = feedItems.length > take;
    const items = hasMore ? feedItems.slice(0, take) : feedItems;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    postIds = items.map((f) => f.postId);

    // Hydrate post details from post-service
    let posts: any[] = [];
    try {
      const res = await axios.get(`${this.postServiceUrl}/posts/batch?ids=${postIds.join(',')}`, {
        headers: { 'x-user-id': userId },
      });
      posts = res.data?.data || [];
    } catch (err) {
      this.logger.error(`Failed to hydrate posts: ${(err as Error).message}`);
    }

    // Preserve original feed item sort order
    const postMap = new Map(posts.map((p) => [p.id, p]));
    const orderedPosts = postIds.map((id) => postMap.get(id)).filter(Boolean);

    // Hydrate author profiles
    const enriched = await this.hydrateAuthors(orderedPosts);

    return {
      data: enriched,
      nextCursor,
      hasMore,
    };
  }

  async getExplore(cursor?: string, limit = 18, currentUserId?: string) {
    try {
      const res = await axios.get(
        `${this.postServiceUrl}/posts/browse?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`,
        { headers: currentUserId ? { 'x-user-id': currentUserId } : {} },
      );
      const posts = res.data?.data || [];
      const enriched = await this.hydrateAuthors(posts);
      return {
        data: enriched,
        nextCursor: res.data?.nextCursor || null,
        hasMore: res.data?.hasMore || false,
      };
    } catch (err) {
      this.logger.error(`Failed to get explore feed: ${(err as Error).message}`);
      return { data: [], nextCursor: null, hasMore: false };
    }
  }

  async refreshUserFeed(userId: string) {
    try {
      const res = await axios.get(`${this.userServiceUrl}/users/${userId}/following`);
      const following: any[] = res.data?.data || [];
      const followingIds = following.map((f) => f.userId);
      followingIds.push(userId); // include self

      // Clear existing feed items
      await this.prisma.feedItem.deleteMany({ where: { userId } });

      for (const authorId of followingIds) {
        const postRes = await axios.get(`${this.postServiceUrl}/posts/user/${authorId}?limit=15`);
        const posts: any[] = postRes.data?.data || [];

        for (const p of posts) {
          await this.prisma.feedItem.upsert({
            where: { userId_postId: { userId, postId: p.id } },
            update: {},
            create: {
              userId,
              postId: p.id,
              authorId,
              createdAt: new Date(p.createdAt),
            },
          });
        }
      }

      return { success: true, message: 'Feed refreshed successfully' };
    } catch (err) {
      this.logger.error(`Error refreshing feed: ${(err as Error).message}`);
      return { success: false, message: (err as Error).message };
    }
  }

  private async hydrateAuthors(posts: any[]) {
    if (posts.length === 0) return [];
    const userIds = [...new Set(posts.map((p) => p.userId))];

    const authorMap = new Map<string, any>();
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const res = await axios.get(`${this.userServiceUrl}/users/by-id/${uid}`);
          if (res.data?.data) {
            authorMap.set(uid, res.data.data);
          }
        } catch {
          // fallback author
          const shortId = uid ? uid.slice(0, 6) : 'creator';
          authorMap.set(uid, { id: uid, username: `creator_${shortId}`, name: `Creator ${shortId}` });
        }
      }),
    );

    return posts.map((p) => ({
      ...p,
      author: authorMap.get(p.userId) || null,
    }));
  }
}
