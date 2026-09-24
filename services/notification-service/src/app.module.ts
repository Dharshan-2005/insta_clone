import { Controller, Get, Module } from '@nestjs/common';
import { ActivityConsumer } from './activity.consumer';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaService } from './prisma.service';
import { RealtimeGateway } from './realtime.gateway';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { UsersClient } from './users.client';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [NotificationsController, MessagesController, StoriesController, HealthController],
  providers: [
    PrismaService,
    UsersClient,
    RealtimeGateway,
    NotificationsService,
    MessagesService,
    StoriesService,
    ActivityConsumer,
  ],
})
export class AppModule {}
