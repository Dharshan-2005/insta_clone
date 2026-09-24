import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private userServiceUrl: string;

  constructor(private prisma: PrismaService) {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:4002';
  }

  async getNotifications(userId: string, cursor?: string, limit = 20) {
    const take = Math.min(Number(limit) || 20, 50);

    const queryOptions: any = {
      where: { userId },
      take: take + 1,
      orderBy: { createdAt: 'desc' },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const notifications = await this.prisma.notification.findMany(queryOptions);
    const hasMore = notifications.length > take;
    const items = hasMore ? notifications.slice(0, take) : notifications;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Enriched with actor profiles
    const actorIds = [...new Set(items.map((n) => n.actorId).filter(Boolean))];
    const actorMap = new Map<string, any>();

    await Promise.all(
      actorIds.map(async (aid) => {
        try {
          const res = await axios.get(`${this.userServiceUrl}/users/by-id/${aid}`);
          if (res.data?.data) {
            actorMap.set(aid, res.data.data);
          }
        } catch {
          actorMap.set(aid, { id: aid, username: 'user', name: 'User' });
        }
      }),
    );

    const enriched = items.map((n) => ({
      ...n,
      actor: actorMap.get(n.actorId) || null,
    }));

    return {
      data: enriched,
      nextCursor,
      hasMore,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}
