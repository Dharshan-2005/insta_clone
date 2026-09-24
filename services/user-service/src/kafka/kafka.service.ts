import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { KAFKA_TOPICS, KafkaEventPatterns, UserFollowedEvent, UserUnfollowedEvent, UserRegisteredEvent } from '@instagram/shared-types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isConnected = false;

  constructor(private prisma: PrismaService) {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',');
    this.kafka = new Kafka({
      clientId: 'user-service',
      brokers,
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'user-service-group' });
  }

  async onModuleInit() {
    this.initKafka();
  }

  async onModuleDestroy() {
    this.isConnected = false;
    try {
      await this.producer.disconnect();
    } catch (err) {
      this.logger.error(`Error disconnecting Kafka producer: ${(err as Error).message}`);
    }
    try {
      await this.consumer.disconnect();
    } catch (err) {
      this.logger.error(`Error disconnecting Kafka consumer: ${(err as Error).message}`);
    }
  }

  private async initKafka(attempt = 1) {
    try {
      await this.producer.connect();
      this.logger.log('Kafka Producer connected');

      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: KAFKA_TOPICS.USER_EVENTS,
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;
          try {
            const payload = JSON.parse(message.value.toString());
            await this.handleKafkaMessage(payload);
          } catch (err) {
            this.logger.error(`Error processing Kafka message: ${(err as Error).message}`);
          }
        },
      });
      this.isConnected = true;
      this.logger.log('Kafka Consumer started');
    } catch (err) {
      this.isConnected = false;
      const delay = Math.min(1000 * Math.pow(2, Math.min(attempt, 5)), 15000);
      this.logger.warn(`Kafka initialization deferred: ${(err as Error).message}. Retrying in ${delay / 1000}s (attempt ${attempt})...`);
      setTimeout(() => {
        this.initKafka(attempt + 1);
      }, delay);
    }
  }

  private async handleKafkaMessage(payload: { pattern: string; data: any }) {
    if (payload.pattern === KafkaEventPatterns.USER_REGISTERED) {
      const data: UserRegisteredEvent = payload.data;
      this.logger.log(`Handling USER_REGISTERED for ${data.email}`);
      const username = data.username || data.email.split('@')[0];
      await this.prisma.profile.upsert({
        where: { userId: data.userId },
        update: {
          email: data.email,
          name: data.name,
          username,
          avatar: data.avatar,
        },
        create: {
          userId: data.userId,
          email: data.email,
          name: data.name,
          username,
          avatar: data.avatar,
        },
      });
    }
  }

  async publishUserFollowed(data: UserFollowedEvent) {
    if (!this.isConnected) return;
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.USER_EVENTS,
        messages: [
          {
            key: data.followingId,
            value: JSON.stringify({
              pattern: KafkaEventPatterns.USER_FOLLOWED,
              data,
            }),
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Failed to publish USER_FOLLOWED: ${(err as Error).message}`);
    }
  }

  async publishUserUnfollowed(data: UserUnfollowedEvent) {
    if (!this.isConnected) return;
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.USER_EVENTS,
        messages: [
          {
            key: data.followingId,
            value: JSON.stringify({
              pattern: KafkaEventPatterns.USER_UNFOLLOWED,
              data,
            }),
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Failed to publish USER_UNFOLLOWED: ${(err as Error).message}`);
    }
  }
}
