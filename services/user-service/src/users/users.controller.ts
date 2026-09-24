import { Controller, Get, Put, Post, Delete, Body, Param, Query, Headers, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getOwnProfile(@Headers('x-user-id') currentUserId: string) {
    if (!currentUserId) {
      throw new BadRequestException('User ID header missing');
    }
    const profile = await this.usersService.getProfileByUserId(currentUserId, currentUserId);
    return { success: true, data: profile };
  }

  @Put('profile')
  async updateProfile(
    @Headers('x-user-id') currentUserId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    if (!currentUserId) {
      throw new BadRequestException('User ID header missing');
    }
    const updated = await this.usersService.updateProfile(currentUserId, dto);
    return { success: true, data: updated };
  }

  @Get('search')
  async search(@Query('q') q: string) {
    const results = await this.usersService.searchUsers(q);
    return { success: true, data: results };
  }

  @Get('by-email/:email')
  async getByEmail(
    @Param('email') email: string,
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const profile = await this.usersService.getProfileByEmail(email, currentUserId);
    return { success: true, data: profile };
  }

  @Get('by-id/:id')
  async getById(
    @Param('id') id: string,
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const profile = await this.usersService.getProfileByUserId(id, currentUserId);
    return { success: true, data: profile };
  }

  @Get(':id/followers')
  async getFollowers(@Param('id') id: string) {
    const followers = await this.usersService.getFollowers(id);
    return { success: true, data: followers };
  }

  @Get(':id/following')
  async getFollowing(@Param('id') id: string) {
    const following = await this.usersService.getFollowing(id);
    return { success: true, data: following };
  }

  @Post(':id/follow')
  async follow(
    @Param('id') targetId: string,
    @Headers('x-user-id') currentUserId: string,
  ) {
    if (!currentUserId) {
      throw new BadRequestException('User ID header missing');
    }
    const res = await this.usersService.followUser(currentUserId, targetId);
    return { success: true, data: res };
  }

  @Delete(':id/follow')
  async unfollow(
    @Param('id') targetId: string,
    @Headers('x-user-id') currentUserId: string,
  ) {
    if (!currentUserId) {
      throw new BadRequestException('User ID header missing');
    }
    const res = await this.usersService.unfollowUser(currentUserId, targetId);
    return { success: true, data: res };
  }

  @Get(':username')
  async getByUsername(
    @Param('username') username: string,
    @Headers('x-user-id') currentUserId?: string,
  ) {
    const profile = await this.usersService.getProfileByUsername(username, currentUserId);
    return { success: true, data: profile };
  }
}
