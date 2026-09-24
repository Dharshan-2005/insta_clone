import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 1. Strip any client-supplied user headers to prevent spoofing
    delete req.headers['x-user-id'];
    delete req.headers['x-user-email'];

    let token: string | null = null;

    if (req.cookies && req.cookies['access_token']) {
      token = req.cookies['access_token'];
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
      if (match) token = decodeURIComponent(match[1]);
    }
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace(/^Bearer\s+/i, '');
    }

    if (token) {
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
        });
        if (payload && payload.sub) {
          req.headers['x-user-id'] = payload.sub;
          req.headers['x-user-email'] = payload.email || '';
        }
      } catch {
        // Invalid or expired token
      }
    }

    // 2. Define public routes
    const path = req.originalUrl || req.url || '';
    const cleanPath = path.replace(/^\/api/, '');
    const isPublic =
      cleanPath.startsWith('/health') ||
      cleanPath.startsWith('/auth') ||
      cleanPath.startsWith('/media') ||
      cleanPath.startsWith('/posts/media') ||
      cleanPath.startsWith('/uploads');

    // 3. Reject unauthenticated requests to protected endpoints
    if (!isPublic && !req.headers['x-user-id']) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: missing or invalid authentication token',
      });
    }

    next();
  }
}
