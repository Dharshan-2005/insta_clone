import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import axios from 'axios';

@Injectable()
export class MessagesService {
  private userServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:4002';
  }

  async getOrCreateConversation(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot start conversation with yourself');
    }

    // Find existing conversation with both participants
    const userConvs = await this.prisma.conversationParticipant.findMany({
      where: { userId: currentUserId },
      select: { conversationId: true },
    });
    const convIds = userConvs.map((c) => c.conversationId);

    if (convIds.length > 0) {
      const existingParticipant = await this.prisma.conversationParticipant.findFirst({
        where: {
          conversationId: { in: convIds },
          userId: targetUserId,
        },
      });

      if (existingParticipant) {
        return this.getConversationById(existingParticipant.conversationId, currentUserId);
      }
    }

    // Create new conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: currentUserId },
            { userId: targetUserId },
          ],
        },
      },
    });

    return this.getConversationById(conversation.id, currentUserId);
  }

  async listConversations(currentUserId: string) {
    const participantRecords = await this.prisma.conversationParticipant.findMany({
      where: { userId: currentUserId },
      include: {
        conversation: {
          include: {
            participants: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    // Hydrate participant profile data from user-service
    const otherUserIds = new Set<string>();
    for (const pr of participantRecords) {
      for (const p of pr.conversation.participants) {
        if (p.userId !== currentUserId) {
          otherUserIds.add(p.userId);
        }
      }
    }

    const userProfileMap = new Map<string, any>();
    await Promise.all(
      Array.from(otherUserIds).map(async (uid) => {
        try {
          const res = await axios.get(`${this.userServiceUrl}/users/by-id/${uid}`);
          if (res.data?.data) {
            userProfileMap.set(uid, res.data.data);
          }
        } catch {
          userProfileMap.set(uid, {
            id: uid,
            username: `user_${uid.slice(0, 6)}`,
            name: `User ${uid.slice(0, 6)}`,
            avatar: null,
          });
        }
      }),
    );

    const conversations = await Promise.all(
      participantRecords.map(async (pr) => {
        const conv = pr.conversation;
        const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
        const otherUserId = otherParticipant?.userId || currentUserId;
        const otherProfile = userProfileMap.get(otherUserId) || {
          id: otherUserId,
          username: `user_${otherUserId.slice(0, 6)}`,
          name: `User ${otherUserId.slice(0, 6)}`,
          avatar: null,
        };

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: currentUserId },
            read: false,
          },
        });

        const lastMsg = conv.messages[0] || null;

        return {
          id: conv.id,
          updatedAt: conv.updatedAt,
          participant: otherProfile,
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                text: lastMsg.text,
                senderId: lastMsg.senderId,
                type: lastMsg.type,
                createdAt: lastMsg.createdAt,
              }
            : null,
          unreadCount,
        };
      }),
    );

    return conversations;
  }

  async getConversationById(conversationId: string, currentUserId: string) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: currentUserId },
      },
    });

    if (!isParticipant) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
    });

    const otherParticipant = participants.find((p) => p.userId !== currentUserId);
    const otherUserId = otherParticipant?.userId || currentUserId;

    let targetProfile = null;
    try {
      const res = await axios.get(`${this.userServiceUrl}/users/by-id/${otherUserId}`);
      targetProfile = res.data?.data;
    } catch {
      targetProfile = {
        id: otherUserId,
        username: `user_${otherUserId.slice(0, 6)}`,
        name: `User ${otherUserId.slice(0, 6)}`,
        avatar: null,
      };
    }

    return {
      id: conversationId,
      participant: targetProfile,
    };
  }

  async getMessages(conversationId: string, currentUserId: string, limit = 50) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: currentUserId },
      },
    });

    if (!isParticipant) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages;
  }

  async sendMessage(
    senderId: string,
    conversationId: string,
    text?: string,
    type = 'text',
    mediaPath?: string,
    postId?: string,
  ) {
    const isParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
    });

    if (!isParticipant) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        text,
        type,
        mediaPath,
        postId,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Real-time broadcast via Socket.IO room
    try {
      this.notificationsGateway.sendMessageToConversation(conversationId, message);
    } catch (err) {
      // Non-blocking if websocket gateway error
    }

    return message;
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  }
}
