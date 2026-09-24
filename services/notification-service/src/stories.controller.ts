import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateStoryDto } from './dto';
import { StoriesService } from './stories.service';
import { UserId } from './user-id.decorator';

@Controller('stories')
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  create(@UserId() userId: string, @Body() dto: CreateStoryDto, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose an image for your story');
    return this.stories.create(userId, file, dto.caption);
  }

  @Get('feed')
  feed(@UserId() userId: string) {
    return this.stories.feed(userId);
  }

  @Post(':id/view')
  @HttpCode(204)
  view(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.stories.view(id, userId);
  }
}
