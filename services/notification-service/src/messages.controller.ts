import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { OpenConversationDto, SendMessageDto } from './dto';
import { MessagesService } from './messages.service';
import { UserId } from './user-id.decorator';

@Controller('messages/conversations')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  conversations(@UserId() userId: string) {
    return this.messages.conversations(userId);
  }

  @Post()
  open(@UserId() userId: string, @Body() dto: OpenConversationDto) {
    return this.messages.open(userId, dto.userId);
  }

  @Get(':id/messages')
  list(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.messages.messages(id, userId);
  }

  @Post(':id/messages')
  send(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() { text }: SendMessageDto) {
    return this.messages.send(id, userId, text);
  }

  @Post(':id/read')
  @HttpCode(204)
  markRead(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.messages.markRead(id, userId);
  }
}
