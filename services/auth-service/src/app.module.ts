import { Controller, Get, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
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
  controllers: [AuthController, HealthController],
  providers: [AuthService, PrismaService, UsersClient],
})
export class AppModule {}
