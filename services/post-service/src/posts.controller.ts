import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCommentDto, CreatePostDto, PageQuery } from './posts.dto';
import { PostsService } from './posts.service';
import { UserId } from './user-id.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  create(@UserId() userId: string, @Body() dto: CreatePostDto, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose a photo or video to share');
    return this.posts.create(userId, file, dto);
  }

  @Get('feed')
  feed(@UserId() userId: string, @Query() query: PageQuery) {
    return this.posts.feed(userId, query);
  }

  @Get('explore')
  explore(@UserId() userId: string, @Query() query: PageQuery) {
    return this.posts.explore(userId, query);
  }

  @Get('bookmarked')
  bookmarked(@UserId() userId: string, @Query() query: PageQuery) {
    return this.posts.bookmarked(userId, query);
  }

  @Get('user/:authorId')
  byAuthor(@UserId() userId: string, @Param('authorId', ParseUUIDPipe) authorId: string, @Query() query: PageQuery) {
    return this.posts.byAuthor(authorId, userId, query);
  }

  @Get(':id')
  findOne(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.findOne(id, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.remove(id, userId);
  }

  @Post(':id/like')
  @HttpCode(204)
  like(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.like(id, userId);
  }

  @Delete(':id/like')
  @HttpCode(204)
  unlike(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.unlike(id, userId);
  }

  @Post(':id/bookmark')
  @HttpCode(204)
  bookmark(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.bookmark(id, userId);
  }

  @Delete(':id/bookmark')
  @HttpCode(204)
  unbookmark(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.posts.unbookmark(id, userId);
  }

  @Post(':id/comments')
  comment(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() { text }: CreateCommentDto) {
    return this.posts.comment(id, userId, text);
  }
}
