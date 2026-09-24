import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Partitioners } from 'kafkajs';

export type ActivityEvent =
  | { type: 'post.liked'; actorId: string; targetUserId: string; postId: string }
  | { type: 'post.commented'; actorId: string; targetUserId: string; postId: string; text: string };

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private readonly producer = new Kafka({
    clientId: 'post-service',
    brokers: (process.env.KAFKA_BROKERS ?? 'kafka:9092').split(','),
  }).producer({ createPartitioner: Partitioners.DefaultPartitioner });

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publish(event: ActivityEvent) {
    try {
      await this.producer.send({
        topic: 'activity',
        messages: [{ key: event.targetUserId, value: JSON.stringify(event) }],
      });
    } catch (err) {
      this.logger.error(`Failed to publish ${event.type}: ${(err as Error).message}`);
    }
  }
}
