import { Controller, Get, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { InternalController } from './internal.controller';
import { PrismaService } from './prisma.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [UsersController, InternalController, HealthController],
  providers: [UsersService, PrismaService, EventsService],
})
export class AppModule {}
