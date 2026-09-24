export interface User {
  id: string;
  email: string;
  provider: string;
  providerId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface Profile {
  id: string;
  userId: string;
  email: string;
  username?: string | null;
  name?: string | null;
  bio?: string | null;
  subtitle?: string | null;
  avatar?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date | string;
}

export interface Post {
  id: string;
  userId: string;
  caption?: string | null;
  mediaPath: string;
  mediaType: string;
  likesCount: number;
  commentsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  author?: Profile | null;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: Date | string;
  author?: Profile | null;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date | string;
}

export interface Bookmark {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date | string;
}

export interface FeedItem {
  id: string;
  userId: string;
  postId: string;
  authorId: string;
  score: number;
  createdAt: Date | string;
  post?: Post;
}

export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  postId?: string | null;
  message: string;
  read: boolean;
  createdAt: Date | string;
  actor?: Profile | null;
  post?: Post | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
