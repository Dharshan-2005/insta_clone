'use client';

import React, { useState } from 'react';
import { followProfile, unfollowProfile } from '@/actions';
import { Follower } from '@/types';
import { UserMinus, UserPlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FollowButton({
  profileIdToFollow,
  ourFollow = null,
}: {
  profileIdToFollow: string;
  ourFollow: Follower | null;
}) {
  const router = useRouter();
  const [isFollowed, setIsFollowed] = useState<boolean>(Boolean(ourFollow));
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const previousState = isFollowed;
    const newState = !previousState;
    setIsFollowed(newState);
    setLoading(true);

    try {
      if (previousState) {
        await unfollowProfile(profileIdToFollow);
      } else {
        await followProfile(profileIdToFollow);
      }
      router.refresh();
    } catch (err) {
      // Rollback on error
      setIsFollowed(previousState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleToggle} className="flex-1 w-full flex">
      <button
        type="submit"
        disabled={loading}
        className={`flex-1 py-2 px-6 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 select-none ${
          isFollowed
            ? 'bg-[#262626] hover:bg-[#333333] text-white border border-neutral-700'
            : 'bg-sky-500 hover:bg-sky-400 text-white shadow-md active:scale-[0.98]'
        }`}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isFollowed ? (
          <>
            <UserMinus className="size-4" />
            <span>Following</span>
          </>
        ) : (
          <>
            <UserPlus className="size-4" />
            <span>Follow</span>
          </>
        )}
      </button>
    </form>
  );
}