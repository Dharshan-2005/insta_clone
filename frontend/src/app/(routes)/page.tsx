import Link from 'next/link';
import Feed from '@/components/Feed';
import FollowButton from '@/components/FollowButton';
import StoryTray from '@/components/StoryTray';
import UserRow from '@/components/UserRow';
import { serverApi } from '@/lib/server-api';
import type { Page, Post, UserSummary } from '@/lib/types';

export default async function HomePage() {
  const [feed, suggestions] = await Promise.all([
    serverApi<Page<Post>>('/posts/feed'),
    serverApi<UserSummary[]>('/users/suggestions'),
  ]);

  const suggestionList = suggestions.length > 0 && (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-neutral-400">Suggested for you</h2>
      {suggestions.map((user) => (
        <UserRow key={user.id} user={user} action={<FollowButton userId={user.id} initialFollowing={false} compact />} />
      ))}
    </section>
  );

  return (
    <div className="mx-auto flex max-w-5xl justify-center gap-16 px-4">
      <div className="w-full max-w-[470px]">
        <StoryTray />
        {feed.data.length > 0 ? (
          <Feed initial={feed} />
        ) : (
          <div className="flex flex-col gap-6 py-10">
            <div className="text-center">
              <h1 className="text-xl font-semibold">Welcome to Instagram</h1>
              <p className="mt-1 text-sm text-neutral-400">
                Follow people to see their photos here, or{' '}
                <Link href="/explore" className="text-sky-400 hover:text-sky-300">
                  explore
                </Link>{' '}
                what others are sharing.
              </p>
            </div>
            <div className="xl:hidden">{suggestionList}</div>
          </div>
        )}
      </div>
      <aside className="hidden w-80 shrink-0 py-8 xl:block">{suggestionList}</aside>
    </div>
  );
}
