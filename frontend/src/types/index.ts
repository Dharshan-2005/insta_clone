export interface Profile {
  id: string;
  userId?: string;
  email: string;
  avatar?: string | null;
  username?: string | null;
  name?: string | null;
  subtitle?: string | null;
  bio?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  author: string; // userId or email
  userId?: string;
  image: string; // mediaPath or full URL
  mediaPath?: string;
  mediaType?: string;
  description: string; // caption
  caption?: string | null;
  likesCount: number;
  commentsCount?: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
  isLiked?: boolean;
  isBookmarked?: boolean;
  authorProfile?: Profile | null;
}

export interface Comment {
  id: string;
  postId: string;
  author: string; // userId or email
  userId?: string;
  text: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  authorProfile?: Profile | null;
}

export interface Like {
  id: string;
  postId: string;
  author: string;
  userId?: string;
  createdAt: string | Date;
}

export interface Bookmark {
  id: string;
  postId: string;
  author: string;
  userId?: string;
  createdAt: string | Date;
}

export interface Follower {
  id: string;
  followingProfileEmail?: string;
  followingProfileId?: string;
  followedProfileId?: string;
  followerId?: string;
  followingId?: string;
  createdAt?: string | Date;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW';
  postId?: string | null;
  message: string;
  read: boolean;
  createdAt: string | Date;
  actor?: Profile | null;
  post?: Post | null;
}

export interface SessionUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}
