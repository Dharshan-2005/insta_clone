import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService, TOKEN_TTL_SECONDS } from './auth.service';
import { UserId } from './user-id.decorator';

const COOKIE_NAME = 'access_token';
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.register(dto);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: TOKEN_TTL_SECONDS * 1000 });
    return user;
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: TOKEN_TTL_SECONDS * 1000 });
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, cookieOptions);
  }

  @Get('me')
  me(@UserId() userId: string) {
    return this.auth.getAccount(userId);
  }
}
