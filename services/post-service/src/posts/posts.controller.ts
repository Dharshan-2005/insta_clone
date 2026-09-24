import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreateCommentDto } from './dto/comment.dto';
import { MediaService } from '../media/media.service';

@Controller('posts')
export class PostsController {
  constructor(
    private postsService: PostsService,
    private mediaService: MediaService,
  ) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor({ limits: { fileSize: 50 * 1024 * 1024, files: 10 } }))
  async createPost(
    @Headers('x-user-id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('caption') caption?: string,
    @Body('location') location?: string,
    @Body('commentsEnabled') commentsEnabled?: string | boolean,
    @Body('likesEnabled') likesEnabled?: string | boolean,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    if (!files || files.length === 0) throw new BadRequestException('At least one file is required');

    const post = await this.postsService.createPost(userId, files, caption, {
      location,
      commentsEnabled: commentsEnabled !== 'false' && commentsEnabled !== false,
      likesEnabled: likesEnabled !== 'false' && likesEnabled !== false,
    });
    return { success: true, data: post };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Headers('x-user-id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!userId) throw new BadRequestException('User ID header missing');
    if (!file) throw new BadRequestException('File is required');

    const url = await this.mediaService.processAndSaveAvatar(file, userId);
    return { success: true, data: { url } };
  }

  @Get()
  async getPosts(
    @Query('author') author?: string,
    @Query('userId') userId?: string,
    @Query('username') username?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const target = userId || author || username;
    if (target) {
      const result = await this.postsService.getPostsByUser(target, cursor, limit, currentUserId);
      return { success: true, posts: result.data, data: result.data, ...result };
    }
    const result = await this.postsService.browse(cursor, limit, currentUserId);
    return { success: true, posts: result.data, data: result.data, ...result };
  }

  @Get('browse')
  async browse(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const result = await this.postsService.browse(cursor, limit, currentUserId);
    return { success: true, ...result };
  }

  @Get('search')
  async search(@Query('q') query: string) {
    const results = await this.postsService.searchPosts(query);
    return { success: true, data: results };
  }

  @Get('bookmarked')
  async getBookmarked(@Headers('x-user-id') currentUserId: string) {
    if (!currentUserId) throw new BadRequestException('User ID header missing');
    const result = await this.postsService.getBookmarkedPosts(currentUserId);
    return { success: true, ...result };
  }

  @Get('batch')
  async getBatch(
    @Query('ids') ids: string,
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const idList = ids ? ids.split(',') : [];
    const posts = await this.postsService.getPostsByIds(idList, currentUserId);
    return { success: true, data: posts };
  }

  @Get('user/:userId')
  async getPostsByUser(
    @Param('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const result = await this.postsService.getPostsByUser(userId, cursor, limit, currentUserId);
    return { success: true, ...result };
  }

  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const post = await this.postsService.getPostById(id, currentUserId);
    return { success: true, data: post };
  }

  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @Headers('x-user-id') currentUserId: string,
  ) {
    if (!currentUserId) throw new BadRequestException('User ID header missing');
    const res = await this.postsService.deletePost(id, currentUserId);
    return { success: true, data: res };
  }

  @Post(':id/like')
  async like(
    @Param('id') id: string,
    @Headers('x-user-id') currentUserId: string,
  ) {
    if (!currentUserId) throw new BadRequestException('User ID header missing');
    const res = await this.postsService.likePost(id, currentUserId);
    return { success: true, data: res };
  }

  @Delete(':id/like')
  async unlike(
    @Param('id') id: string,
    @Headers('x-user-id') currentUserId: string,
  ) {
    if (!currentUserId) throw new BadRequestException('User ID header missing');
    const res = await this.postsService.unlikePost(id, currentUserId);
    return { success: true, data: res };
  }

  @Post(':id/bookmark')
  async bookmark(
    @Param('id') id: string,
    @Headers('x-user-id') currentUserId: string,
  ) {
    if (!currentUserId) throw new BadRequestException('User ID header missing');
    const res = await this.postsService.bookmarkPost(id, currentUserId);
    return { success: true, data: res };
  }

  @Delete(':id/bookmark')
  async unbookmark(
    @Param('id') id: string,
    @Headers('x-user-id') currentUserId: string,
  ) {
    if (!currentUserId) throw new BadRequestException('User ID header missing');
    const res = await this.postsService.unbookmarkPost(id, currentUserId);
    return { success: true, data: res };
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Headers('x-user-id') currentUserId: string,
    @Body() dto: CreateCommentDto,
  ) {
    if (!currentUserId) throw new BadRequestException('User ID header missing');
    const comment = await this.postsService.addComment(id, currentUserId, dto.text);
    return { success: true, data: comment };
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    const comments = await this.postsService.getComments(id);
    return { success: true, data: comments };
  }
}
