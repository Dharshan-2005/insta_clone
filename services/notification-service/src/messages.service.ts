import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RealtimeGateway } from './realtime.gateway';
import { UsersClient } from './users.client';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersClient,
    private readonly realtime: RealtimeGateway,
  ) {}

  async conversations(userId: string) {
    const participations = await this.prisma.participant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: { select: { userId: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const otherIds = participations.map(
      ({ conversation }) => conversation.participants.find((p) => p.userId !== userId)?.userId ?? userId,
    );
    const [users, unreadCounts] = await Promise.all([
      this.users.summaries(otherIds),
      Promise.all(
        participations.map(({ conversationId, lastReadAt }) =>
          this.prisma.message.count({
            where: { conversationId, senderId: { not: userId }, createdAt: { gt: lastReadAt } },
          }),
        ),
      ),
    ]);

    return participations
      .map(({ conversation }, index) => ({
        id: conversation.id,
        participant: users.get(otherIds[index]),
        lastMessage: conversation.messages[0] ?? null,
        unreadCount: unreadCounts[index],
        updatedAt: conversation.updatedAt,
      }))
      .filter((conversation) => conversation.participant);
  }

  async open(userId: string, targetUserId: string) {
    if (userId === targetUserId) throw new BadRequestException("You can't message yourself");
    const users = await this.users.summaries([targetUserId]);
    if (!users.has(targetUserId)) throw new NotFoundException('User not found');

    const key = [userId, targetUserId].sort().join(':');
    const conversation = await this.prisma.conversation.upsert({
      where: { key },
      update: {},
      create: { key, participants: { create: [{ userId }, { userId: targetUserId }] } },
    });
    return { id: conversation.id };
  }

  async messages(conversationId: string, userId: string) {
    await this.participantIds(conversationId, userId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return messages.reverse();
  }

  async send(conversationId: string, userId: string, text: string) {
    const participantIds = await this.participantIds(conversationId, userId);
    const now = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId, senderId: userId, text, createdAt: now } }),
      this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: now } }),
      this.prisma.participant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: now },
      }),
    ]);
    this.realtime.emit(participantIds, 'message', message);
    return message;
  }

  async markRead(conversationId: string, userId: string) {
    const { count } = await this.prisma.participant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
    if (count === 0) throw new NotFoundException('Conversation not found');
  }

  private async participantIds(conversationId: string, userId: string) {
    const participants = await this.prisma.participant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const ids = participants.map((participant) => participant.userId);
    if (!ids.includes(userId)) throw new NotFoundException('Conversation not found');
    return ids;
  }
}
