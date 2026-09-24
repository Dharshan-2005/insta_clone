import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Comment, Prisma } from '../.prisma/client';
import { EventsService } from './events.service';
import { deleteMedia, saveMedia } from './media';
import { CreatePostDto, PageQuery } from './posts.dto';
import { PrismaService } from './prisma.service';
import { Author, UsersClient } from './users.client';

const postInclude = (viewerId: string) =>
  Prisma.validator<Prisma.PostInclude>()({
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId: viewerId }, select: { userId: true } },
    bookmarks: { where: { userId: viewerId }, select: { userId: true } },
  });

type PostRecord = Prisma.PostGetPayload<{ include: ReturnType<typeof postInclude> }>;

const unknownAuthor = (id: string): Author => ({ id, username: 'unknown', name: null, avatar: null });

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersClient,
    private readonly events: EventsService,
  ) {}

  async create(userId: string, file: Express.Multer.File, dto: CreatePostDto) {
    const media = await saveMedia(file);
    const post = await this.prisma.post.create({
      data: { userId, caption: dto.caption, location: dto.location, ...media },
      include: postInclude(userId),
    });
    const [created] = await this.present([post]);
    return created;
  }

  async feed(viewerId: string, query: PageQuery) {
    const authorIds = [viewerId, ...(await this.users.followingIds(viewerId))];
    return this.page({ userId: { in: authorIds } }, viewerId, query);
  }

  explore(viewerId: string, query: PageQuery) {
    return this.page({ userId: { not: viewerId } }, viewerId, query);
  }

  bookmarked(viewerId: string, query: PageQuery) {
    return this.page({ bookmarks: { some: { userId: viewerId } } }, viewerId, query);
  }

  async byAuthor(authorId: string, viewerId: string, query: PageQuery) {
    const [page, total] = await Promise.all([
      this.page({ userId: authorId }, viewerId, query),
      this.prisma.post.count({ where: { userId: authorId } }),
    ]);
    return { ...page, total };
  }

  async findOne(id: string, viewerId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { ...postInclude(viewerId), comments: { orderBy: { createdAt: 'asc' } } },
    });
    if (!post) throw new NotFoundException('Post not found');

    const { comments, ...rest } = post;
    const authors = await this.users.summaries([post.userId, ...comments.map((comment) => comment.userId)]);
    return {
      ...this.toDto(rest, authors),
      comments: comments.map((comment) => this.commentDto(comment, authors)),
    };
  }

  async remove(id: string, userId: string) {
    const post = await this.findOr404(id);
    if (post.userId !== userId) throw new ForbiddenException('You can only delete your own posts');
    await this.prisma.post.delete({ where: { id } });
    await deleteMedia(post.mediaPath);
  }

  async like(id: string, userId: string) {
    const post = await this.findOr404(id);
    const { count } = await this.prisma.like.createMany({ data: { postId: id, userId }, skipDuplicates: true });
    if (count > 0 && post.userId !== userId) {
      await this.events.publish({ type: 'post.liked', actorId: userId, targetUserId: post.userId, postId: id });
    }
  }

  async unlike(id: string, userId: string) {
    await this.prisma.like.deleteMany({ where: { postId: id, userId } });
  }

  async bookmark(id: string, userId: string) {
    await this.findOr404(id);
    await this.prisma.bookmark.createMany({ data: { postId: id, userId }, skipDuplicates: true });
  }

  async unbookmark(id: string, userId: string) {
    await this.prisma.bookmark.deleteMany({ where: { postId: id, userId } });
  }

  async comment(id: string, userId: string, text: string) {
    const post = await this.findOr404(id);
    const comment = await this.prisma.comment.create({ data: { postId: id, userId, text } });
    if (post.userId !== userId) {
      await this.events.publish({ type: 'post.commented', actorId: userId, targetUserId: post.userId, postId: id, text });
    }
    return this.commentDto(comment, await this.users.summaries([userId]));
  }

  private async findOr404(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  private async page(where: Prisma.PostWhereInput, viewerId: string, { cursor, limit }: PageQuery) {
    const posts = await this.prisma.post.findMany({
      where,
      include: postInclude(viewerId),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const items = posts.slice(0, limit);
    return {
      data: await this.present(items),
      nextCursor: posts.length > limit ? items[items.length - 1].id : null,
    };
  }

  private async present(posts: PostRecord[]) {
    const authors = await this.users.summaries(posts.map((post) => post.userId));
    return posts.map((post) => this.toDto(post, authors));
  }

  private toDto({ _count, likes, bookmarks, ...post }: PostRecord, authors: Map<string, Author>) {
    return {
      ...post,
      likesCount: _count.likes,
      commentsCount: _count.comments,
      isLiked: likes.length > 0,
      isBookmarked: bookmarks.length > 0,
      author: authors.get(post.userId) ?? unknownAuthor(post.userId),
    };
  }

  private commentDto({ postId: _postId, userId, ...comment }: Comment, authors: Map<string, Author>) {
    return { ...comment, author: authors.get(userId) ?? unknownAuthor(userId) };
  }
}
