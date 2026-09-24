import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { KAFKA_TOPICS, KafkaEventPatterns, UserRegisteredEvent } from '@instagram/shared-types';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:29092').split(',');
    this.kafka = new Kafka({
      clientId: 'auth-service',
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

  async publishUserRegistered(data: UserRegisteredEvent) {
    if (!this.isConnected) {
      this.logger.warn('Kafka producer not connected, skipping publishUserRegistered');
      return;
    }
    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.USER_EVENTS,
        messages: [
          {
            key: data.userId,
            value: JSON.stringify({
              pattern: KafkaEventPatterns.USER_REGISTERED,
              data,
            }),
          },
        ],
      });
      this.logger.log(`Published USER_REGISTERED event for ${data.userId}`);
    } catch (err) {
      this.logger.error(`Failed to publish USER_REGISTERED: ${(err as Error).message}`);
    }
  }
}
