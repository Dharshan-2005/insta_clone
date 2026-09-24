import type { Metadata } from 'next';
import PostGrid from '@/components/PostGrid';
import UserSearch from '@/components/UserSearch';
import { serverApi } from '@/lib/server-api';
import type { Page, Post } from '@/lib/types';

export const metadata: Metadata = { title: 'Explore' };

export default async function ExplorePage() {
  const posts = await serverApi<Page<Post>>('/posts/explore?limit=24');

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <UserSearch placeholder="Search people" />
      <PostGrid path="/posts/explore?limit=24" initial={posts} emptyTitle="Nothing to explore yet" />
    </div>
  );
}
