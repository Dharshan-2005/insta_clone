import { Global, Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [NotificationsModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
