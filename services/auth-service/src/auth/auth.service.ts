import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private kafkaService: KafkaService,
  ) {}

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email, jti: crypto.randomUUID() };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        provider: 'local',
      },
    });

    const tokens = this.generateTokens(user.id, user.email);

    // Store refresh token (clear old if any)
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    // Publish event
    await this.kafkaService.publishUserRegistered({
      userId: user.id,
      email: user.email,
      name: dto.name || dto.fullName,
      username: dto.username,
      createdAt: user.createdAt.toISOString(),
    });

    return {
      user: { id: user.id, email: user.email },
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const identifier = (dto.email || '').trim();
    let user = await this.prisma.user.findUnique({
      where: { email: identifier.toLowerCase() },
    });

    if (!user) {
      // Input might be a username: try resolving via user-service
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:4002';
        const res = await fetch(`${userServiceUrl}/users/${encodeURIComponent(identifier)}`);
        if (res.ok) {
          const profileRes = await res.json();
          const profile = profileRes?.data;
          if (profile?.email) {
            user = await this.prisma.user.findUnique({
              where: { email: profile.email.toLowerCase() },
            });
          }
          if (!user && profile?.userId) {
            user = await this.prisma.user.findUnique({
              where: { id: profile.userId },
            });
          }
        }
      } catch (err) {
        // Fallback silently if user-service unreachable
      }
    }

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user.id, user.email);

    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    return {
      user: { id: user.id, email: user.email },
      tokens,
    };
  }

  async googleAuth(dto: GoogleAuthDto) {
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    let isNew = false;
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          provider: 'google',
          providerId: dto.googleId,
        },
      });
      isNew = true;
    }

    const tokens = this.generateTokens(user.id, user.email);

    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    if (isNew) {
      await this.kafkaService.publishUserRegistered({
        userId: user.id,
        email: user.email,
        name: dto.name,
        avatar: dto.avatar,
        createdAt: user.createdAt.toISOString(),
      });
    }

    return {
      user: { id: user.id, email: user.email },
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    try {
      this.jwtService.verify(refreshToken);
    } catch {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Invalid refresh token signature');
    }

    const tokens = this.generateTokens(storedToken.user.id, storedToken.user.email);

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    return {
      user: { id: storedToken.user.id, email: storedToken.user.email },
      tokens,
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, provider: true, createdAt: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
