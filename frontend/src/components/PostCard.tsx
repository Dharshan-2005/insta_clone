'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { Post } from '@/lib/types';
import Avatar from './Avatar';
import PostActions from './PostActions';
import PostMedia from './PostMedia';
import TimeAgo from './TimeAgo';
import { usePostActions } from './usePostActions';

export default function PostCard({ post }: { post: Post }) {
  const actions = usePostActions(post);
  const [heartKey, setHeartKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const profileHref = `/users/${post.author.username}`;

  const likeFromDoubleClick = () => {
    actions.like();
    setHeartKey((key) => key + 1);
  };

  return (
    <article className="border-b border-neutral-800 pb-5">
      <header className="flex items-center gap-3 py-3">
        <Link href={profileHref}>
          <Avatar user={post.author} size={32} />
        </Link>
        <div className="min-w-0 text-sm leading-tight">
          <div className="flex items-center gap-1">
            <Link href={profileHref} className="font-semibold hover:opacity-70">
              {post.author.username}
            </Link>
            <span className="text-neutral-500">•</span>
            <TimeAgo date={post.createdAt} className="text-neutral-500" />
          </div>
          {post.location && <p className="truncate text-xs text-neutral-400">{post.location}</p>}
        </div>
      </header>

      <div
        onDoubleClick={likeFromDoubleClick}
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-neutral-800 bg-neutral-950"
      >
        <PostMedia post={post} className="h-full w-full object-cover" />
        {heartKey > 0 && (
          <Heart
            key={heartKey}
            className="pointer-events-none absolute size-24 animate-heart-pop fill-white text-white drop-shadow-lg"
          />
        )}
      </div>

      <PostActions postId={post.id} actions={actions} />

      {post.caption && (
        <p className={`mt-1 whitespace-pre-line text-sm ${expanded ? '' : 'line-clamp-2'}`}>
          <Link href={profileHref} className="mr-1.5 font-semibold">
            {post.author.username}
          </Link>
          {post.caption}
        </p>
      )}
      {post.caption && !expanded && post.caption.length > 120 && (
        <button type="button" onClick={() => setExpanded(true)} className="text-sm text-neutral-500">
          more
        </button>
      )}
      {post.commentsCount > 0 && (
        <Link href={`/posts/${post.id}`} className="mt-1 block text-sm text-neutral-500 hover:text-neutral-400">
          View {post.commentsCount === 1 ? '1 comment' : `all ${post.commentsCount} comments`}
        </Link>
      )}
    </article>
  );
}
