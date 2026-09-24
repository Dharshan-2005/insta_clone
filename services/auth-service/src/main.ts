import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { seedDemoData } from './demo-seed';
import { PrismaService } from './prisma.service';

async function bootstrap() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be set');

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  if (process.env.SEED_DEMO_DATA === 'true') await seedDemoData(app.get(PrismaService));

  await app.listen(Number(process.env.PORT ?? 4001));
}

bootstrap();
