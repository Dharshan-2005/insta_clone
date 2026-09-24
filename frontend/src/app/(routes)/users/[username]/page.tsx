import { Bookmark, Grid3X3 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PostGrid from '@/components/PostGrid';
import ProfileHeader from '@/components/ProfileHeader';
import { getCurrentUser, serverApi } from '@/lib/server-api';
import type { Page, Post, Profile } from '@/lib/types';

type Props = {
  params: { username: string };
  searchParams: { tab?: string };
};

export function generateMetadata({ params }: Props): Metadata {
  return { title: `@${decodeURIComponent(params.username)}` };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const [me, profile] = await Promise.all([
    getCurrentUser(),
    serverApi<Profile>(`/users/${encodeURIComponent(params.username)}`),
  ]);
  const isMe = me.id === profile.id;
  const showSaved = isMe && searchParams.tab === 'saved';
  const postsPath = `/posts/user/${profile.id}?limit=24`;

  const [posts, saved] = await Promise.all([
    serverApi<Page<Post>>(postsPath),
    showSaved ? serverApi<Page<Post>>('/posts/bookmarked?limit=24') : null,
  ]);

  const baseHref = `/users/${profile.username}`;
  const tabClass = (active: boolean) =>
    `flex items-center gap-2 border-t py-3 text-xs font-semibold uppercase tracking-widest ${
      active ? 'border-white text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
    }`;

  return (
    <div className="mx-auto max-w-4xl">
      <ProfileHeader profile={profile} postsCount={posts.total ?? posts.data.length} isMe={isMe} />
      <nav className="flex justify-center gap-14 border-t border-neutral-800">
        <Link href={baseHref} className={tabClass(!showSaved)}>
          <Grid3X3 className="size-3.5" /> Posts
        </Link>
        {isMe && (
          <Link href={`${baseHref}?tab=saved`} className={tabClass(showSaved)}>
            <Bookmark className="size-3.5" /> Saved
          </Link>
        )}
      </nav>
      <div className="px-1 pb-8">
        {saved ? (
          <PostGrid key="saved" path="/posts/bookmarked?limit=24" initial={saved} emptyTitle="Nothing saved yet" />
        ) : (
          <PostGrid
            key="posts"
            path={postsPath}
            initial={posts}
            emptyTitle={isMe ? 'Share photos' : 'No posts yet'}
            emptyAction={
              isMe && (
                <Link href="/create" className="text-sm font-semibold text-sky-400 hover:text-sky-300">
                  Share your first photo
                </Link>
              )
            }
          />
        )}
      </div>
    </div>
  );
}
