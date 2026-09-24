import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private isConnected = false;

  onModuleInit() {
    let redisHost = process.env.REDIS_HOST || 'redis';
    let redisPort = Number(process.env.REDIS_PORT) || 6379;

    if (process.env.REDIS_URL) {
      try {
        const parsed = new URL(process.env.REDIS_URL);
        if (parsed.hostname) redisHost = parsed.hostname;
        if (parsed.port) redisPort = Number(parsed.port);
      } catch (e) {}
    }

    this.client = new Redis({
      host: redisHost,
      port: redisPort,
      retryStrategy: (times) => {
        if (times > 5) return null;
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });

    this.client
      .connect()
      .then(() => {
        this.isConnected = true;
        this.logger.log(`Connected to Redis at ${redisHost}:${redisPort}`);
      })
      .catch((err) => {
        this.logger.warn(`Redis connection deferred: ${err.message}`);
      });
  }

  async onModuleDestroy() {
    if (this.isConnected && this.client) {
      await this.client.quit();
    }
  }

  async addToUserFeed(userId: string, postId: string, timestamp: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      const key = `user:feed:${userId}`;
      await this.client.zadd(key, timestamp, postId);
      // Keep only recent 200 posts in redis cache
      await this.client.zremrangebyrank(key, 0, -201);
    } catch (err) {
      this.logger.error(`Redis zadd error: ${(err as Error).message}`);
    }
  }

  async removeFromUserFeed(userId: string, postId: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const key = `user:feed:${userId}`;
      await this.client.zrem(key, postId);
    } catch (err) {
      this.logger.error(`Redis zrem error: ${(err as Error).message}`);
    }
  }

  async getUserFeedPostIds(userId: string, offset = 0, limit = 20): Promise<string[]> {
    if (!this.isConnected) return [];
    try {
      const key = `user:feed:${userId}`;
      return await this.client.zrevrange(key, offset, offset + limit - 1);
    } catch (err) {
      this.logger.error(`Redis zrevrange error: ${(err as Error).message}`);
      return [];
    }
  }

  async setUserFeedCache(userId: string, postIds: { id: string; timestamp: number }[]): Promise<void> {
    if (!this.isConnected || postIds.length === 0) return;
    try {
      const key = `user:feed:${userId}`;
      const pipeline = this.client.pipeline();
      pipeline.del(key);
      for (const item of postIds) {
        pipeline.zadd(key, item.timestamp, item.id);
      }
      await pipeline.exec();
    } catch (err) {
      this.logger.error(`Redis pipeline error: ${(err as Error).message}`);
    }
  }
}
