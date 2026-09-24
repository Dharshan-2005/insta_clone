import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { UserId } from './user-id.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@UserId() userId: string) {
    return this.notifications.list(userId);
  }

  @Get('unread-count')
  unreadCount(@UserId() userId: string) {
    return this.notifications.unreadCount(userId);
  }

  @Post('read')
  @HttpCode(204)
  markAllRead(@UserId() userId: string) {
    return this.notifications.markAllRead(userId);
  }
}
