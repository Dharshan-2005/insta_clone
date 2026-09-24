import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Profile } from '../.prisma/client';
import { EventsService } from './events.service';
import { saveAvatar } from './media';
import { PrismaService } from './prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './users.dto';

const SUMMARY = { id: true, username: true, name: true, avatar: true } satisfies Prisma.ProfileSelect;

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async create(dto: CreateProfileDto) {
    try {
      return await this.prisma.profile.create({ data: dto });
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException('This username is already taken');
      throw err;
    }
  }

  async remove(id: string) {
    await this.prisma.$transaction([
      this.prisma.follow.deleteMany({ where: { OR: [{ followerId: id }, { followingId: id }] } }),
      this.prisma.profile.deleteMany({ where: { id } }),
    ]);
  }

  async findIdByUsername(username: string) {
    const profile = await this.prisma.profile.findUnique({ where: { username }, select: { id: true } });
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  summaries(ids: string[]) {
    return this.prisma.profile.findMany({ where: { id: { in: ids } }, select: SUMMARY });
  }

  async followingIds(userId: string) {
    const follows = await this.prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    return follows.map((follow) => follow.followingId);
  }

  async me(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) throw new UnauthorizedException();
    return this.withStats(profile, userId);
  }

  async getByUsername(username: string, viewerId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { username: username.toLowerCase() } });
    if (!profile) throw new NotFoundException('User not found');
    return this.withStats(profile, viewerId);
  }

  async update(userId: string, dto: UpdateProfileDto) {
    try {
      await this.prisma.profile.update({ where: { id: userId }, data: dto });
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException('This username is already taken');
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') throw new UnauthorizedException();
      throw err;
    }
    return this.me(userId);
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const avatar = await saveAvatar(file, userId);
    await this.prisma.profile.update({ where: { id: userId }, data: { avatar } });
    return this.me(userId);
  }

  search(query: string) {
    if (!query) return [];
    return this.prisma.profile.findMany({
      where: {
        OR: [
          { username: { contains: query.toLowerCase() } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: SUMMARY,
      orderBy: { username: 'asc' },
      take: 20,
    });
  }

  async suggestions(userId: string) {
    const excluded = [userId, ...(await this.followingIds(userId))];
    return this.prisma.profile.findMany({
      where: { id: { notIn: excluded } },
      select: SUMMARY,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException("You can't follow yourself");
    if (!(await this.prisma.profile.findUnique({ where: { id: followingId }, select: { id: true } }))) {
      throw new NotFoundException('User not found');
    }
    const { count } = await this.prisma.follow.createMany({
      data: { followerId, followingId },
      skipDuplicates: true,
    });
    if (count > 0) await this.events.publish({ type: 'user.followed', actorId: followerId, targetUserId: followingId });
  }

  async unfollow(followerId: string, followingId: string) {
    await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  private async withStats(profile: Profile, viewerId: string) {
    const [followersCount, followingCount, follow] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: profile.id } }),
      this.prisma.follow.count({ where: { followerId: profile.id } }),
      this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: profile.id } },
      }),
    ]);
    return { ...profile, followersCount, followingCount, isFollowing: Boolean(follow) };
  }
}
