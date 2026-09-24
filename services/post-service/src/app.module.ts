import { Controller, Get, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaService } from './prisma.service';
import { UsersClient } from './users.client';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [PostsController, HealthController],
  providers: [PostsService, PrismaService, EventsService, UsersClient],
})
export class AppModule {}
