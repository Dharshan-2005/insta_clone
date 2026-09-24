import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import axios from 'axios';
import {
  KAFKA_TOPICS,
  KafkaEventPatterns,
  PostLikedEvent,
  CommentCreatedEvent,
  UserFollowedEvent,
} from '@instagram/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private userServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private wsGateway: NotificationsGateway,
  ) {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',');
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002';

    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers,
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });
    this.consumer = this.kafka.consumer({ groupId: 'notification-service-group' });
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
        eachMessage: async ({ message }) => {
          if (!message.value) return;
          try {
            const payload = JSON.parse(message.value.toString());
            await this.handleMessage(payload);
          } catch (err) {
            this.logger.error(`Error processing Kafka notification message: ${(err as Error).message}`);
          }
        },
      });
      this.logger.log('Kafka Consumer for notifications running');
    } catch (err) {
      this.isConnected = false;
      const delay = Math.min(1000 * Math.pow(2, Math.min(attempt, 5)), 15000);
      this.logger.warn(`Kafka notification initialization deferred: ${(err as Error).message}. Retrying in ${delay / 1000}s (attempt ${attempt})...`);
      setTimeout(() => {
        this.connectConsumer(attempt + 1);
      }, delay);
    }
  }

  private async handleMessage(payload: { pattern: string; data: any }) {
    switch (payload.pattern) {
      case KafkaEventPatterns.POST_LIKED:
        await this.handlePostLiked(payload.data);
        break;
      case KafkaEventPatterns.COMMENT_CREATED:
        await this.handleCommentCreated(payload.data);
        break;
      case KafkaEventPatterns.USER_FOLLOWED:
        await this.handleUserFollowed(payload.data);
        break;
    }
  }

  private async getActorName(actorId: string): Promise<string> {
    try {
      const res = await axios.get(`${this.userServiceUrl}/users/by-id/${actorId}`);
      return res.data?.data?.name || res.data?.data?.username || 'Someone';
    } catch {
      return 'Someone';
    }
  }

  private async handlePostLiked(data: PostLikedEvent) {
    if (data.actorId === data.postAuthorId) return; // don't notify self-likes

    const actorName = await this.getActorName(data.actorId);
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.postAuthorId,
        actorId: data.actorId,
        postId: data.postId,
        type: 'LIKE',
        message: `${actorName} liked your photo.`,
      },
    });

    this.wsGateway.sendNotificationToUser(data.postAuthorId, notification);
    const unreadCount = await this.prisma.notification.count({
      where: { userId: data.postAuthorId, read: false },
    });
    this.wsGateway.sendUnreadCountToUser(data.postAuthorId, unreadCount);
  }

  private async handleCommentCreated(data: CommentCreatedEvent) {
    if (data.actorId === data.postAuthorId) return;

    const actorName = await this.getActorName(data.actorId);
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.postAuthorId,
        actorId: data.actorId,
        postId: data.postId,
        type: 'COMMENT',
        message: `${actorName} commented: "${data.text.slice(0, 30)}${data.text.length > 30 ? '...' : ''}"`,
      },
    });

    this.wsGateway.sendNotificationToUser(data.postAuthorId, notification);
    const unreadCount = await this.prisma.notification.count({
      where: { userId: data.postAuthorId, read: false },
    });
    this.wsGateway.sendUnreadCountToUser(data.postAuthorId, unreadCount);
  }

  private async handleUserFollowed(data: UserFollowedEvent) {
    const actorName = await this.getActorName(data.followerId);
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.followingId,
        actorId: data.followerId,
        type: 'FOLLOW',
        message: `${actorName} started following you.`,
      },
    });

    this.wsGateway.sendNotificationToUser(data.followingId, notification);
    const unreadCount = await this.prisma.notification.count({
      where: { userId: data.followingId, read: false },
    });
    this.wsGateway.sendUnreadCountToUser(data.followingId, unreadCount);
  }
}
