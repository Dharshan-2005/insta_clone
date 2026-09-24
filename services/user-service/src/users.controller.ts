import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserId } from './user-id.decorator';
import { SearchQuery, UpdateProfileDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@UserId() userId: string) {
    return this.users.me(userId);
  }

  @Patch('me')
  update(@UserId() userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.update(userId, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  updateAvatar(@UserId() userId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Choose an image to upload');
    return this.users.updateAvatar(userId, file);
  }

  @Get('search')
  search(@UserId() _userId: string, @Query() { q }: SearchQuery) {
    return this.users.search(q);
  }

  @Get('suggestions')
  suggestions(@UserId() userId: string) {
    return this.users.suggestions(userId);
  }

  @Get(':username')
  getByUsername(@UserId() viewerId: string, @Param('username') username: string) {
    return this.users.getByUsername(username, viewerId);
  }

  @Post(':id/follow')
  @HttpCode(204)
  follow(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.follow(userId, id);
  }

  @Delete(':id/follow')
  @HttpCode(204)
  unfollow(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.unfollow(userId, id);
  }
}
