import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private kafkaService: KafkaService,
  ) {}

  async getProfileByUserId(userId: string, currentUserId?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const [followersCount, followingCount, isFollowing] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
      currentUserId && currentUserId !== userId
        ? this.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: userId,
              },
            },
          }).then((f) => !!f)
        : Promise.resolve(false),
    ]);

    return {
      ...profile,
      followersCount,
      followingCount,
      isFollowing,
    };
  }

  async getProfileByUsername(username: string, currentUserId?: string) {
    const clean = username.trim().toLowerCase();
    const withoutUnderscores = clean.replace(/_/g, '');
    const profile = await this.prisma.profile.findFirst({
      where: {
        OR: [
          { username: { equals: clean, mode: 'insensitive' } },
          { username: { equals: withoutUnderscores, mode: 'insensitive' } },
          { id: username },
          { userId: username },
        ],
      },
    });

    if (!profile) {
      throw new NotFoundException(`Profile @${username} not found`);
    }
    return this.getProfileByUserId(profile.userId, currentUserId);
  }

  async getProfileByEmail(email: string, currentUserId?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!profile) {
      throw new NotFoundException(`Profile for ${email} not found`);
    }
    return this.getProfileByUserId(profile.userId, currentUserId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const existing = await this.prisma.profile.findUnique({
        where: { username: dto.username },
      });
      if (existing && existing.userId !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    return this.prisma.profile.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        email: `${userId.slice(0, 8)}@user.local`,
        username: dto.username || `user_${userId.slice(0, 8)}`,
        name: dto.name || 'User',
        bio: dto.bio,
        subtitle: dto.subtitle,
        avatar: dto.avatar,
      },
    });
  }

  async followUser(followerId: string, followingId: string) {
    const targetProfile = await this.prisma.profile.findFirst({
      where: {
        OR: [
          { userId: followingId },
          { id: followingId },
          { username: { equals: followingId, mode: 'insensitive' } },
        ],
      },
    });
    if (!targetProfile) {
      throw new NotFoundException('User to follow not found');
    }

    const currentProfile = await this.prisma.profile.findFirst({
      where: {
        OR: [
          { userId: followerId },
          { id: followerId },
        ],
      },
    });
    const actualFollowerId = currentProfile?.userId || followerId;
    const actualFollowingId = targetProfile.userId;

    if (actualFollowerId === actualFollowingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const follow = await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: actualFollowerId,
          followingId: actualFollowingId,
        },
      },
      update: {},
      create: {
        followerId: actualFollowerId,
        followingId: actualFollowingId,
      },
    });

    await this.kafkaService.publishUserFollowed({
      followerId: actualFollowerId,
      followingId: actualFollowingId,
      createdAt: follow.createdAt.toISOString(),
    });

    return { success: true, isFollowing: true };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const targetProfile = await this.prisma.profile.findFirst({
      where: {
        OR: [
          { userId: followingId },
          { id: followingId },
          { username: { equals: followingId, mode: 'insensitive' } },
        ],
      },
    });
    const actualFollowingId = targetProfile?.userId || followingId;

    const currentProfile = await this.prisma.profile.findFirst({
      where: {
        OR: [
          { userId: followerId },
          { id: followerId },
        ],
      },
    });
    const actualFollowerId = currentProfile?.userId || followerId;

    try {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: actualFollowerId,
            followingId: actualFollowingId,
          },
        },
      });
    } catch {
      // already unfollowed
    }

    await this.kafkaService.publishUserUnfollowed({
      followerId: actualFollowerId,
      followingId: actualFollowingId,
    });

    return { success: true, isFollowing: false };
  }

  async getFollowers(userId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });

    const followerIds = follows.map((f) => f.followerId);
    return this.prisma.profile.findMany({
      where: { userId: { in: followerIds } },
    });
  }

  async getFollowing(userId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = follows.map((f) => f.followingId);
    return this.prisma.profile.findMany({
      where: { userId: { in: followingIds } },
    });
  }

  async searchUsers(query: string) {
    if (!query || query.trim() === '') return [];
    return this.prisma.profile.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }
}
