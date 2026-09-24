export type UserSummary = {
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
};

export type Profile = UserSummary & {
  bio: string | null;
  subtitle: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
};

export type Post = {
  id: string;
  userId: string;
  caption: string | null;
  location: string | null;
  mediaPath: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  author: UserSummary;
};

export type Comment = {
  id: string;
  text: string;
  createdAt: string;
  author: UserSummary;
};

export type PostDetail = Post & { comments: Comment[] };

export type Page<T> = {
  data: T[];
  nextCursor: string | null;
  total?: number;
};

export type Notification = {
  id: string;
  type: 'like' | 'comment' | 'follow';
  postId: string | null;
  text: string | null;
  read: boolean;
  createdAt: string;
  actor: UserSummary;
};

export type Story = {
  id: string;
  userId: string;
  mediaPath: string;
  caption: string | null;
  createdAt: string;
  viewed: boolean;
  viewsCount: number | null;
};

export type StoryGroup = {
  user: UserSummary;
  stories: Story[];
  hasUnseen: boolean;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  participant: UserSummary;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
};
