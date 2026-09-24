import { Controller, Get, Patch, Param, Query, Headers, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Headers('x-user-id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const result = await this.notificationsService.getNotifications(userId, cursor, limit);
    return { success: true, ...result };
  }

  @Get('unread-count')
  async getUnreadCount(@Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const result = await this.notificationsService.getUnreadCount(userId);
    return { success: true, ...result };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const result = await this.notificationsService.markAsRead(id, userId);
    return { success: true, ...result };
  }

  @Patch('read-all')
  async markAllAsRead(@Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const result = await this.notificationsService.markAllAsRead(userId);
    return { success: true, ...result };
  }
}
