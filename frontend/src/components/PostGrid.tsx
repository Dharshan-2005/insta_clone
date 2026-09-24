'use client';

import { Camera, Heart, MessageCircle, Play } from 'lucide-react';
import Link from 'next/link';
import { compactCount, mediaUrl } from '@/lib/format';
import { useInfinite } from '@/lib/use-infinite';
import type { Page, Post } from '@/lib/types';
import Spinner from './Spinner';

type Props = {
  path: string;
  initial: Page<Post>;
  emptyTitle: string;
  emptyAction?: React.ReactNode;
};

export default function PostGrid({ path, initial, emptyTitle, emptyAction }: Props) {
  const { items, sentinel, hasMore } = useInfinite(path, initial);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border-2 border-neutral-200">
          <Camera className="size-8" strokeWidth={1.4} />
        </div>
        <p className="text-xl font-bold">{emptyTitle}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {items.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="group relative aspect-square overflow-hidden bg-neutral-900"
          >
            {post.mediaType === 'video' ? (
              <>
                <video src={mediaUrl(post.mediaPath)} className="h-full w-full object-cover" muted preload="metadata" />
                <Play className="absolute right-2 top-2 size-5 fill-white text-white drop-shadow" />
              </>
            ) : (
              <img
                src={mediaUrl(post.mediaPath)}
                alt={post.caption ?? ''}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 hidden items-center justify-center gap-6 bg-black/40 text-sm font-bold group-hover:flex">
              <span className="flex items-center gap-1.5">
                <Heart className="size-5 fill-white" /> {compactCount(post.likesCount)}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="size-5 fill-white" /> {compactCount(post.commentsCount)}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <div ref={sentinel}>
          <Spinner />
        </div>
      )}
    </>
  );
}
