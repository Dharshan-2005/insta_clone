import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import axios from 'axios';
import {
  KAFKA_TOPICS,
  KafkaEventPatterns,
  PostCreatedEvent,
  PostDeletedEvent,
  UserFollowedEvent,
  UserUnfollowedEvent,
} from '@instagram/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private userServiceUrl: string;
  private postServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',');
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002';
    this.postServiceUrl = process.env.POST_SERVICE_URL || 'http://localhost:4003';

    this.kafka = new Kafka({
      clientId: 'feed-service',
      brokers,
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });
    this.consumer = this.kafka.consumer({ groupId: 'feed-service-group' });
  }

  async onModuleInit() {
    this.connectConsumer();
  }

  async onModuleDestroy() {
    this.isConnected = false;
    try {
      await this.consumer.disconnect();
    } catch (err) {
      this.logger.error(`Error disconnecting Kafka consumer: ${(err as Error).message}`);
    }
  }

  private async connectConsumer(attempt = 1) {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log('Kafka Consumer connected successfully');

      await this.consumer.subscribe({
        topics: [KAFKA_TOPICS.POST_EVENTS, KAFKA_TOPICS.USER_EVENTS],
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;
          try {
            const payload = JSON.parse(message.value.toString());
            await this.handleMessage(payload);
          } catch (err) {
            this.logger.error(`Error processing Kafka feed message: ${(err as Error).message}`);
          }
        },
      });
      this.logger.log('Kafka Consumer for feed-service running');
    } catch (err) {
      this.isConnected = false;
      const delay = Math.min(1000 * Math.pow(2, Math.min(attempt, 5)), 15000);
      this.logger.warn(`Kafka feed initialization deferred: ${(err as Error).message}. Retrying in ${delay / 1000}s (attempt ${attempt})...`);
      setTimeout(() => {
        this.connectConsumer(attempt + 1);
      }, delay);
    }
  }

  private async handleMessage(payload: { pattern: string; data: any }) {
    switch (payload.pattern) {
      case KafkaEventPatterns.POST_CREATED:
        await this.handlePostCreated(payload.data);
        break;
      case KafkaEventPatterns.USER_FOLLOWED:
        await this.handleUserFollowed(payload.data);
        break;
      case KafkaEventPatterns.USER_UNFOLLOWED:
        await this.handleUserUnfollowed(payload.data);
        break;
      case KafkaEventPatterns.POST_DELETED:
        await this.handlePostDeleted(payload.data);
        break;
    }
  }

  private async handlePostCreated(data: PostCreatedEvent) {
    this.logger.log(`Fan-out for post ${data.postId} by ${data.userId}`);
    const timestamp = new Date(data.createdAt).getTime();

    // 1. Author sees their own post in feed
    await this.prisma.feedItem.upsert({
      where: { userId_postId: { userId: data.userId, postId: data.postId } },
      update: {},
      create: {
        userId: data.userId,
        postId: data.postId,
        authorId: data.userId,
        createdAt: new Date(data.createdAt),
      },
    });
    await this.redis.addToUserFeed(data.userId, data.postId, timestamp);

    // 2. Fetch author's followers from user-service
    try {
      const res = await axios.get(`${this.userServiceUrl}/users/${data.userId}/followers`);
      const followers: any[] = res.data?.data || [];

      for (const f of followers) {
        const followerId = f.userId;
        await this.prisma.feedItem.upsert({
          where: { userId_postId: { userId: followerId, postId: data.postId } },
          update: {},
          create: {
            userId: followerId,
            postId: data.postId,
            authorId: data.userId,
            createdAt: new Date(data.createdAt),
          },
        });
        await this.redis.addToUserFeed(followerId, data.postId, timestamp);
      }
    } catch (err) {
      this.logger.error(`Failed to fetch followers for fan-out: ${(err as Error).message}`);
    }
  }

  private async handleUserFollowed(data: UserFollowedEvent) {
    this.logger.log(`Backfilling feed for ${data.followerId} following ${data.followingId}`);
    try {
      // Fetch author's recent posts from post-service
      const res = await axios.get(`${this.postServiceUrl}/posts/user/${data.followingId}?limit=20`);
      const posts: any[] = res.data?.data || [];

      for (const p of posts) {
        const timestamp = new Date(p.createdAt).getTime();
        await this.prisma.feedItem.upsert({
          where: { userId_postId: { userId: data.followerId, postId: p.id } },
          update: {},
          create: {
            userId: data.followerId,
            postId: p.id,
            authorId: data.followingId,
            createdAt: new Date(p.createdAt),
          },
        });
        await this.redis.addToUserFeed(data.followerId, p.id, timestamp);
      }
    } catch (err) {
      this.logger.error(`Failed to backfill feed on follow: ${(err as Error).message}`);
    }
  }

  private async handleUserUnfollowed(data: UserUnfollowedEvent) {
    this.logger.log(`Removing posts from feed for ${data.followerId} unfollowing ${data.followingId}`);
    try {
      const removed = await this.prisma.feedItem.findMany({
        where: { userId: data.followerId, authorId: data.followingId },
        select: { postId: true },
      });

      await this.prisma.feedItem.deleteMany({
        where: { userId: data.followerId, authorId: data.followingId },
      });

      for (const item of removed) {
        await this.redis.removeFromUserFeed(data.followerId, item.postId);
      }
    } catch (err) {
      this.logger.error(`Failed to clean feed on unfollow: ${(err as Error).message}`);
    }
  }

  private async handlePostDeleted(data: PostDeletedEvent) {
    try {
      await this.prisma.feedItem.deleteMany({
        where: { postId: data.postId },
      });
    } catch (err) {
      this.logger.error(`Failed to delete feed items for post ${data.postId}: ${(err as Error).message}`);
    }
  }
}
