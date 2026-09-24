import Link from 'next/link';
import { compactCount } from '@/lib/format';
import type { Profile } from '@/lib/types';
import Avatar from './Avatar';
import FollowButton from './FollowButton';

type Props = {
  profile: Profile;
  postsCount: number;
  isMe: boolean;
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span>
      <strong className="font-semibold">{compactCount(value)}</strong> <span className="text-neutral-300">{label}</span>
    </span>
  );
}

export default function ProfileHeader({ profile, postsCount, isMe }: Props) {
  return (
    <header className="flex flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:gap-16 sm:px-8">
      <div className="flex justify-center sm:w-40">
        <Avatar user={profile} size={150} />
      </div>
      <div className="flex flex-1 flex-col items-center gap-4 sm:items-start">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <h1 className="text-xl">{profile.username}</h1>
          {isMe ? (
            <Link href="/settings" className="rounded-lg bg-neutral-800 px-4 py-1.5 text-sm font-semibold hover:bg-neutral-700">
              Edit profile
            </Link>
          ) : (
            <>
              <FollowButton userId={profile.id} initialFollowing={profile.isFollowing} />
              <Link
                href={`/messages?user=${profile.id}`}
                className="rounded-lg bg-neutral-800 px-4 py-1.5 text-sm font-semibold hover:bg-neutral-700"
              >
                Message
              </Link>
            </>
          )}
        </div>
        <div className="flex gap-8 text-sm sm:text-base">
          <Stat value={postsCount} label={postsCount === 1 ? 'post' : 'posts'} />
          <Stat value={profile.followersCount} label={profile.followersCount === 1 ? 'follower' : 'followers'} />
          <Stat value={profile.followingCount} label="following" />
        </div>
        <div className="text-center text-sm sm:text-left">
          {profile.name && <p className="font-semibold">{profile.name}</p>}
          {profile.subtitle && <p className="text-neutral-400">{profile.subtitle}</p>}
          {profile.bio && <p className="mt-1 whitespace-pre-line">{profile.bio}</p>}
        </div>
      </div>
    </header>
  );
}
