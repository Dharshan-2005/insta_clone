'use client';

import { useInfinite } from '@/lib/use-infinite';
import type { Page, Post } from '@/lib/types';
import PostCard from './PostCard';
import Spinner from './Spinner';

export default function Feed({ initial }: { initial: Page<Post> }) {
  const { items, sentinel, hasMore } = useInfinite('/posts/feed', initial);

  return (
    <div className="flex flex-col gap-2">
      {items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {hasMore && (
        <div ref={sentinel}>
          <Spinner />
        </div>
      )}
    </div>
  );
}
