import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoriesService } from './stories.service';

@Controller('stories')
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async createStory(
    @Headers('x-user-id') userId: string,
    @UploadedFile() file: any,
    @Body('caption') caption?: string,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    if (!file) throw new BadRequestException('Image file is required');
    const story = await this.storiesService.createStory(userId, file, caption);
    return { success: true, data: story };
  }

  @Get('feed')
  async getFeedStories(@Headers('x-user-id') userId: string) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const stories = await this.storiesService.getFeedStories(userId);
    return { success: true, data: stories };
  }

  @Post(':id/view')
  async recordView(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const res = await this.storiesService.recordView(id, userId);
    return { success: true, data: res };
  }

  @Post(':id/like')
  async likeStory(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const res = await this.storiesService.likeStory(id, userId);
    return { success: true, data: res };
  }

  @Delete(':id')
  async deleteStory(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    const res = await this.storiesService.deleteStory(id, userId);
    return { success: true, data: res };
  }
}
