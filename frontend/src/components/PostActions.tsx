'use client';

import { Bookmark, Heart, Link2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { plural } from '@/lib/format';
import type { usePostActions } from './usePostActions';

type Props = {
  postId: string;
  actions: ReturnType<typeof usePostActions>;
  onComment?: () => void;
};

export default function PostActions({ postId, actions, onComment }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/posts/${postId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this link', `${window.location.origin}/posts/${postId}`);
    }
  };

  const commentIcon = <MessageCircle className="size-6 -scale-x-100" strokeWidth={1.8} />;

  return (
    <div>
      <div className="flex items-center gap-4 py-2">
        <button type="button" onClick={actions.toggleLike} aria-label={actions.liked ? 'Unlike' : 'Like'}>
          <Heart
            className={`size-6 transition-transform active:scale-125 ${actions.liked ? 'fill-rose-500 text-rose-500' : ''}`}
            strokeWidth={1.8}
          />
        </button>
        {onComment ? (
          <button type="button" onClick={onComment} aria-label="Comment">
            {commentIcon}
          </button>
        ) : (
          <Link href={`/posts/${postId}`} aria-label="Comment">
            {commentIcon}
          </Link>
        )}
        <button type="button" onClick={copyLink} aria-label="Copy link" className="flex items-center gap-2">
          <Link2 className="size-6" strokeWidth={1.8} />
          {copied && <span className="text-xs text-neutral-400">Link copied</span>}
        </button>
        <button
          type="button"
          onClick={actions.toggleBookmark}
          aria-label={actions.bookmarked ? 'Remove from saved' : 'Save'}
          className="ml-auto"
        >
          <Bookmark className={`size-6 ${actions.bookmarked ? 'fill-white' : ''}`} strokeWidth={1.8} />
        </button>
      </div>
      <p className="text-sm font-semibold">{plural(actions.likesCount, 'like')}</p>
    </div>
  );
}
