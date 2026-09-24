export const KAFKA_TOPICS = {
  POST_EVENTS: 'post-events',
  USER_EVENTS: 'user-events',
  NOTIFICATION_EVENTS: 'notification-events',
} as const;

export enum KafkaEventPatterns {
  POST_CREATED = 'POST_CREATED',
  POST_LIKED = 'POST_LIKED',
  POST_UNLIKED = 'POST_UNLIKED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  POST_DELETED = 'POST_DELETED',
  USER_REGISTERED = 'USER_REGISTERED',
  USER_FOLLOWED = 'USER_FOLLOWED',
  USER_UNFOLLOWED = 'USER_UNFOLLOWED',
}

export interface PostCreatedEvent {
  postId: string;
  userId: string;
  caption?: string | null;
  mediaPath: string;
  mediaType: string;
  createdAt: string;
}

export interface PostLikedEvent {
  postId: string;
  postAuthorId: string;
  actorId: string;
  createdAt: string;
}

export interface PostUnlikedEvent {
  postId: string;
  actorId: string;
}

export interface CommentCreatedEvent {
  commentId: string;
  postId: string;
  postAuthorId: string;
  actorId: string;
  text: string;
  createdAt: string;
}

export interface PostDeletedEvent {
  postId: string;
  userId: string;
}

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  createdAt: string;
}

export interface UserFollowedEvent {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface UserUnfollowedEvent {
  followerId: string;
  followingId: string;
}
