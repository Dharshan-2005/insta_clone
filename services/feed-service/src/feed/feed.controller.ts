import { Controller, Get, Post, Query, Headers, BadRequestException } from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  async getFeed(
    @Headers('x-user-id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID header missing');
    }
    const feed = await this.feedService.getUserFeed(userId, cursor, limit);
    return { success: true, ...feed };
  }

  @Get('explore')
  async getExplore(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const explore = await this.feedService.getExplore(cursor, limit, currentUserId);
    return { success: true, ...explore };
  }

  @Post('refresh')
  async refreshFeed(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID header missing');
    }
    const res = await this.feedService.refreshUserFeed(userId);
    return res;
  }
}
