import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { ActivityEvent, NotificationsService } from './notifications.service';

const TOPIC = 'activity';

@Injectable()
export class ActivityConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ActivityConsumer.name);
  private readonly kafka = new Kafka({
    clientId: 'notification-service',
    brokers: (process.env.KAFKA_BROKERS ?? 'kafka:9092').split(','),
  });
  private readonly consumer = this.kafka.consumer({ groupId: 'notification-service' });

  constructor(private readonly notifications: NotificationsService) {}

  async onModuleInit() {
    const admin = this.kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: TOPIC }], waitForLeaders: true });
    await admin.disconnect();

    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          await this.notifications.handleActivity(JSON.parse(message.value.toString()) as ActivityEvent);
        } catch (err) {
          this.logger.error(`Failed to process activity event: ${(err as Error).message}`);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
