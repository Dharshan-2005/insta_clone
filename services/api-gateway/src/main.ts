import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow any localhost or 127.0.0.1 port for local development
      const isLocalhost =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost) return callback(null, true);
      // Allow configured frontend URL in production
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost',
      ].filter(Boolean);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-user-id'],
  });

  const port = process.env.PORT || 3051;
  await app.listen(port, '0.0.0.0');
  console.log(`[api-gateway] running on http://0.0.0.0:${port}`);
}

bootstrap();
