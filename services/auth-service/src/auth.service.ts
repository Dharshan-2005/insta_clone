import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Prisma, User } from '../.prisma/client';
import { LoginDto, RegisterDto } from './auth.dto';
import { PrismaService } from './prisma.service';
import { UsersClient } from './users.client';

export const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersClient,
  ) {}

  async register({ email, password, username, name }: RegisterDto) {
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account with this email already exists');
    }

    const id = randomUUID();
    await this.users.createProfile({ id, username, name });

    try {
      const user = await this.prisma.user.create({
        data: { id, email, passwordHash: await bcrypt.hash(password, 10) },
      });
      return this.createSession(user);
    } catch (err) {
      await this.users.deleteProfile(id);
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('An account with this email already exists');
      }
      throw err;
    }
  }

  async login({ login, password }: LoginDto) {
    const user = await this.findByLogin(login);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Incorrect username or password');
    }
    return this.createSession(user);
  }

  async getAccount(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!user) throw new NotFoundException('Account not found');
    return user;
  }

  private async findByLogin(login: string): Promise<User | null> {
    if (login.includes('@')) {
      return this.prisma.user.findUnique({ where: { email: login.toLowerCase() } });
    }
    const id = await this.users.findIdByUsername(login.toLowerCase());
    return id ? this.prisma.user.findUnique({ where: { id } }) : null;
  }

  private createSession(user: User) {
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: TOKEN_TTL_SECONDS });
    return { user: { id: user.id, email: user.email }, token };
  }
}
