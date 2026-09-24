import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import {
  KAFKA_TOPICS,
  KafkaEventPatterns,
  PostCreatedEvent,
  PostLikedEvent,
  PostUnlikedEvent,
  CommentCreatedEvent,
  PostDeletedEvent,
} from '@instagram/shared-types';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',');
    this.kafka = new Kafka({
      clientId: 'post-service',
      brokers,
      retry: {
        initialRetryTime: 1000,
        retries: 10,
      },
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    this.connectProducer();
  }

  async onModuleDestroy() {
    this.isConnected = false;
    try {
      await this.producer.disconnect();
    } catch (err) {
      this.logger.error(`Error disconnecting Kafka producer: ${(err as Error).message}`);
    }
  }

  private async connectProducer(attempt = 1) {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka Producer connected');
    } catch (err) {
      this.isConnected = false;
      const delay = Math.min(1000 * Math.pow(2, Math.min(attempt, 5)), 15000);
      this.logger.warn(`Kafka connection deferred: ${(err as Error).message}. Retrying in ${delay / 1000}s (attempt ${attempt})...`);
      setTimeout(() => {
        this.connectProducer(attempt + 1);
      }, delay);
    }
  }

  async publishPostCreated(data: PostCreatedEvent) {
    if (!this.isConnected) return;
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.POST_EVENTS,
        messages: [
          {
            key: data.postId,
            value: JSON.stringify({
              pattern: KafkaEventPatterns.POST_CREATED,
              data,
            }),
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Failed to publish POST_CREATED: ${(err as Error).message}`);
    }
  }

  async publishPostLiked(data: PostLikedEvent) {
    if (!this.isConnected) return;
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.POST_EVENTS,
        messages: [
          {
            key: data.postId,
            value: JSON.stringify({
              pattern: KafkaEventPatterns.POST_LIKED,
              data,
            }),
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Failed to publish POST_LIKED: ${(err as Error).message}`);
    }
  }

  async publishPostUnliked(data: PostUnlikedEvent) {
    if (!this.isConnected) return;
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.POST_EVENTS,
        messages: [
          {
            key: data.postId,
            value: JSON.stringify({
              pattern: KafkaEventPatterns.POST_UNLIKED,
              data,
            }),
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Failed to publish POST_UNLIKED: ${(err as Error).message}`);
    }
  }

  async publishCommentCreated(data: CommentCreatedEvent) {
    if (!this.isConnected) return;
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.POST_EVENTS,
        messages: [
          {
            key: data.postId,
            value: JSON.stringify({
              pattern: KafkaEventPatterns.COMMENT_CREATED,
              data,
            }),
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Failed to publish COMMENT_CREATED: ${(err as Error).message}`);
    }
  }

  async publishPostDeleted(data: PostDeletedEvent) {
    if (!this.isConnected) return;
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.POST_EVENTS,
        messages: [
          {
            key: data.postId,
            value: JSON.stringify({
              pattern: KafkaEventPatterns.POST_DELETED,
              data,
            }),
          },
        ],
      });
    } catch (err) {
      this.logger.error(`Failed to publish POST_DELETED: ${(err as Error).message}`);
    }
  }
}
