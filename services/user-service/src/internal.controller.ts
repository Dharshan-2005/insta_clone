import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CreateProfileDto, IdsQuery } from './users.dto';
import { UsersService } from './users.service';

@Controller('internal/users')
export class InternalController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateProfileDto) {
    return this.users.create(dto);
  }

  @Get()
  summaries(@Query() { ids }: IdsQuery) {
    return this.users.summaries(ids);
  }

  @Get('by-username/:username')
  findIdByUsername(@Param('username') username: string) {
    return this.users.findIdByUsername(username.toLowerCase());
  }

  @Get(':id/following')
  followingIds(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.followingIds(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.remove(id);
  }
}
