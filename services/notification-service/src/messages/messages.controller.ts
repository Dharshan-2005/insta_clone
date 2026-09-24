import { Controller, Get, Post, Patch, Param, Body, Headers, BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('conversations')
  async listConversations(@Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const conversations = await this.messagesService.listConversations(userId);
    return { success: true, data: conversations };
  }

  @Post('conversations')
  async createConversation(
    @Headers('x-user-id') userId: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    if (!targetUserId) throw new BadRequestException('targetUserId is required');
    const conversation = await this.messagesService.getOrCreateConversation(userId, targetUserId);
    return { success: true, data: conversation };
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const messages = await this.messagesService.getMessages(conversationId, userId);
    return { success: true, data: messages };
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
    @Body('text') text?: string,
    @Body('type') type?: string,
    @Body('mediaPath') mediaPath?: string,
    @Body('postId') postId?: string,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const message = await this.messagesService.sendMessage(
      userId,
      conversationId,
      text,
      type,
      mediaPath,
      postId,
    );
    return { success: true, data: message };
  }

  @Patch('conversations/:id/read')
  async markAsRead(
    @Param('id') conversationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const res = await this.messagesService.markAsRead(conversationId, userId);
    return { success: true, data: res };
  }
}
