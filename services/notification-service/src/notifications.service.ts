import { Injectable } from '@nestjs/common';
import { Notification } from '../.prisma/client';
import { PrismaService } from './prisma.service';
import { RealtimeGateway } from './realtime.gateway';
import { UsersClient } from './users.client';

export type ActivityEvent = {
  type: 'post.liked' | 'post.commented' | 'user.followed';
  actorId: string;
  targetUserId: string;
  postId?: string;
  text?: string;
};

const NOTIFICATION_TYPES = {
  'post.liked': 'like',
  'post.commented': 'comment',
  'user.followed': 'follow',
} as const;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersClient,
    private readonly realtime: RealtimeGateway,
  ) {}

  async handleActivity(event: ActivityEvent) {
    const type = NOTIFICATION_TYPES[event.type];
    if (!type || event.actorId === event.targetUserId) return;

    const notification = await this.prisma.notification.create({
      data: {
        userId: event.targetUserId,
        actorId: event.actorId,
        type,
        postId: event.postId,
        text: event.text?.slice(0, 200),
      },
    });
    const [payload] = await this.present([notification]);
    this.realtime.emit([event.targetUserId], 'notification', payload);
  }

  async list(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return this.present(notifications);
  }

  async unreadCount(userId: string) {
    return { count: await this.prisma.notification.count({ where: { userId, read: false } }) };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  }

  private async present(notifications: Notification[]) {
    const actors = await this.users.summaries(notifications.map((notification) => notification.actorId));
    return notifications
      .filter((notification) => actors.has(notification.actorId))
      .map(({ actorId, userId: _userId, ...notification }) => ({ ...notification, actor: actors.get(actorId)! }));
  }
}
