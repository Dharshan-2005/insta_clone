import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3050',
    credentials: true,
  });

  const port = process.env.PORT || 4004;
  await app.listen(port, '0.0.0.0');
  console.log(`[feed-service] running on http://0.0.0.0:${port}`);
}

bootstrap();
