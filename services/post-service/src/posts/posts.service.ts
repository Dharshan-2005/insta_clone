import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { MediaService } from '../media/media.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private kafkaService: KafkaService,
    private mediaService: MediaService,
  ) {}

  async createPost(
    userId: string,
    files: Express.Multer.File | Express.Multer.File[],
    caption?: string,
    options?: {
      location?: string;
      commentsEnabled?: boolean;
      likesEnabled?: boolean;
    },
  ) {
    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const processedFiles: any[] = [];
    try {
      for (let i = 0; i < fileList.length; i++) {
        const processed = await this.mediaService.processAndSaveMedia(fileList[i]);
        processedFiles.push({
          ...processed,
          position: i,
        });
      }

      const primaryMedia = processedFiles[0];

      const post = await this.prisma.$transaction(async (tx) => {
        const newPost = await tx.post.create({
          data: {
            userId,
            caption,
            location: options?.location,
            commentsEnabled: options?.commentsEnabled !== false,
            likesEnabled: options?.likesEnabled !== false,
            mediaPath: primaryMedia.path,
            mediaType: primaryMedia.mimeType.startsWith('video') ? 'video' : 'image',
          },
        });

        await tx.postMedia.createMany({
          data: processedFiles.map((pf) => ({
            postId: newPost.id,
            type: pf.mimeType.startsWith('video') ? 'video' : 'image',
            path: pf.path,
            thumbnailPath: pf.thumbnailPath,
            mimeType: pf.mimeType,
            width: pf.width,
            height: pf.height,
            size: pf.size,
            position: pf.position,
          })),
        });

        return tx.post.findUnique({
          where: { id: newPost.id },
          include: {
            media: { orderBy: { position: 'asc' } },
          },
        });
      });

      await this.kafkaService.publishPostCreated({
        postId: post!.id,
        userId: post!.userId,
        caption: post!.caption,
        mediaPath: post!.mediaPath,
        mediaType: post!.mediaType,
        createdAt: post!.createdAt.toISOString(),
      });

      return post;
    } catch (err) {
      throw err;
    }
  }

  async getPostById(postId: string, currentUserId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        media: { orderBy: { position: 'asc' } },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [isLiked, isBookmarked] = await Promise.all([
      currentUserId
        ? this.prisma.like.findUnique({
            where: { postId_userId: { postId, userId: currentUserId } },
          }).then((l) => !!l)
        : Promise.resolve(false),
      currentUserId
        ? this.prisma.bookmark.findUnique({
            where: { postId_userId: { postId, userId: currentUserId } },
          }).then((b) => !!b)
        : Promise.resolve(false),
    ]);

    const mediaList = post.media && post.media.length > 0 ? post.media : [{
      id: `${post.id}-0`,
      postId: post.id,
      type: post.mediaType,
      path: post.mediaPath,
      thumbnailPath: post.mediaPath,
      position: 0,
    }];

    return {
      ...post,
      media: mediaList,
      commentsCount: post.comments.length,
      isLiked,
      isBookmarked,
    };
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { media: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Cannot delete another users post');

    await this.prisma.post.delete({ where: { id: postId } });

    await this.kafkaService.publishPostDeleted({
      postId,
      userId,
    });

    return { success: true };
  }

  async browse(cursor?: string, limit = 12, currentUserId?: string) {
    const take = Math.min(Number(limit) || 12, 50);
    const queryOptions: any = {
      take: take + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        media: { orderBy: { position: 'asc' } },
        _count: { select: { comments: true } },
      },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const posts = await this.prisma.post.findMany(queryOptions);
    const hasMore = posts.length > take;
    const items = hasMore ? posts.slice(0, take) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    let userLikes = new Set<string>();
    let userBookmarks = new Set<string>();

    if (currentUserId && items.length > 0) {
      const postIds = items.map((p) => p.id);
      const [likes, bookmarks] = await Promise.all([
        this.prisma.like.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.bookmark.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);
      userLikes = new Set(likes.map((l) => l.postId));
      userBookmarks = new Set(bookmarks.map((b) => b.postId));
    }

    const data = items.map((p: any) => ({
      id: p.id,
      userId: p.userId,
      caption: p.caption,
      location: p.location,
      commentsEnabled: p.commentsEnabled ?? true,
      likesEnabled: p.likesEnabled ?? true,
      mediaPath: p.mediaPath,
      mediaType: p.mediaType,
      media: p.media && p.media.length > 0 ? p.media : [{
        id: `${p.id}-0`,
        postId: p.id,
        type: p.mediaType,
        path: p.mediaPath,
        thumbnailPath: p.mediaPath,
        position: 0,
      }],
      likesCount: p.likesCount,
      commentsCount: (p as any)._count?.comments ?? 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      isLiked: userLikes.has(p.id),
      isBookmarked: userBookmarks.has(p.id),
    }));

    return { data, nextCursor, hasMore };
  }

  async getPostsByUser(userId: string, cursor?: string, limit = 12, currentUserId?: string) {
    const take = Math.min(Number(limit) || 12, 50);
    const queryOptions: any = {
      where: { userId },
      take: take + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        media: { orderBy: { position: 'asc' } },
        _count: { select: { comments: true } },
      },
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const posts = await this.prisma.post.findMany(queryOptions);
    const hasMore = posts.length > take;
    const items = hasMore ? posts.slice(0, take) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    let userLikes = new Set<string>();
    let userBookmarks = new Set<string>();

    if (currentUserId && items.length > 0) {
      const postIds = items.map((p) => p.id);
      const [likes, bookmarks] = await Promise.all([
        this.prisma.like.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.bookmark.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);
      userLikes = new Set(likes.map((l) => l.postId));
      userBookmarks = new Set(bookmarks.map((b) => b.postId));
    }

    const data = items.map((p: any) => ({
      id: p.id,
      userId: p.userId,
      caption: p.caption,
      location: p.location,
      commentsEnabled: p.commentsEnabled ?? true,
      likesEnabled: p.likesEnabled ?? true,
      mediaPath: p.mediaPath,
      mediaType: p.mediaType,
      media: p.media && p.media.length > 0 ? p.media : [{
        id: `${p.id}-0`,
        postId: p.id,
        type: p.mediaType,
        path: p.mediaPath,
        thumbnailPath: p.mediaPath,
        position: 0,
      }],
      likesCount: p.likesCount,
      commentsCount: (p as any)._count?.comments ?? 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      isLiked: userLikes.has(p.id),
      isBookmarked: userBookmarks.has(p.id),
    }));

    return { data, nextCursor, hasMore };
  }

  async likePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.like.create({ data: { postId, userId } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);

      await this.kafkaService.publishPostLiked({
        postId,
        postAuthorId: post.userId,
        actorId: userId,
        createdAt: new Date().toISOString(),
      });
    }

    return { success: true, isLiked: true };
  }

  async unlikePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.like.delete({
          where: { postId_userId: { postId, userId } },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: post.likesCount > 0 ? 1 : 0 } },
        }),
      ]);

      await this.kafkaService.publishPostUnliked({
        postId,
        actorId: userId,
      });
    }

    return { success: true, isLiked: false };
  }

  async bookmarkPost(postId: string, userId: string) {
    await this.prisma.bookmark.upsert({
      where: { postId_userId: { postId, userId } },
      update: {},
      create: { postId, userId },
    });
    return { success: true, isBookmarked: true };
  }

  async unbookmarkPost(postId: string, userId: string) {
    try {
      await this.prisma.bookmark.delete({
        where: { postId_userId: { postId, userId } },
      });
    } catch {
      // ignore
    }
    return { success: true, isBookmarked: false };
  }

  async getBookmarkedPosts(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            media: { orderBy: { position: 'asc' } },
            _count: { select: { comments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const postIds = bookmarks.map((b) => b.post.id);
    const userLikes = await this.prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });
    const likedSet = new Set(userLikes.map((l) => l.postId));

    const data = bookmarks.map((b: any) => {
      const p = b.post;
      return {
        id: p.id,
        userId: p.userId,
        caption: p.caption,
        location: p.location,
        commentsEnabled: p.commentsEnabled ?? true,
        likesEnabled: p.likesEnabled ?? true,
        mediaPath: p.mediaPath,
        mediaType: p.mediaType,
        media: p.media && p.media.length > 0 ? p.media : [{
          id: `${p.id}-0`,
          postId: p.id,
          type: p.mediaType,
          path: p.mediaPath,
          thumbnailPath: p.mediaPath,
          position: 0,
        }],
        likesCount: p.likesCount,
        commentsCount: p._count.comments,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        isLiked: likedSet.has(p.id),
        isBookmarked: true,
      };
    });

    return { data, hasMore: false };
  }

  async addComment(postId: string, userId: string, text: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.comment.create({
      data: { postId, userId, text },
    });

    await this.kafkaService.publishCommentCreated({
      commentId: comment.id,
      postId,
      postAuthorId: post.userId,
      actorId: userId,
      text,
      createdAt: comment.createdAt.toISOString(),
    });

    return comment;
  }

  async getComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async searchPosts(query: string) {
    if (!query || query.trim() === '') return [];
    return this.prisma.post.findMany({
      where: {
        caption: { contains: query, mode: 'insensitive' },
      },
      include: {
        media: { orderBy: { position: 'asc' } },
        _count: { select: { comments: true } },
      },
      take: 20,
    });
  }

  async getPostsByIds(ids: string[], currentUserId?: string) {
    if (!ids || ids.length === 0) return [];
    const posts = await this.prisma.post.findMany({
      where: { id: { in: ids } },
      include: {
        media: { orderBy: { position: 'asc' } },
        _count: { select: { comments: true } },
      },
    });

    let userLikes = new Set<string>();
    let userBookmarks = new Set<string>();

    if (currentUserId && posts.length > 0) {
      const [likes, bookmarks] = await Promise.all([
        this.prisma.like.findMany({
          where: { userId: currentUserId, postId: { in: ids } },
          select: { postId: true },
        }),
        this.prisma.bookmark.findMany({
          where: { userId: currentUserId, postId: { in: ids } },
          select: { postId: true },
        }),
      ]);
      userLikes = new Set(likes.map((l) => l.postId));
      userBookmarks = new Set(bookmarks.map((b) => b.postId));
    }

    return posts.map((p: any) => ({
      id: p.id,
      userId: p.userId,
      caption: p.caption,
      location: p.location,
      commentsEnabled: p.commentsEnabled ?? true,
      likesEnabled: p.likesEnabled ?? true,
      mediaPath: p.mediaPath,
      mediaType: p.mediaType,
      media: p.media && p.media.length > 0 ? p.media : [{
        id: `${p.id}-0`,
        postId: p.id,
        type: p.mediaType,
        path: p.mediaPath,
        thumbnailPath: p.mediaPath,
        position: 0,
      }],
      likesCount: p.likesCount,
      commentsCount: p._count.comments,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      isLiked: userLikes.has(p.id),
      isBookmarked: userBookmarks.has(p.id),
    }));
  }
}
