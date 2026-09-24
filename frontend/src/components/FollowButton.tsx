'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

type Props = {
  userId: string;
  initialFollowing: boolean;
  compact?: boolean;
};

export default function FollowButton({ userId, initialFollowing, compact = false }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    const next = !following;
    setPending(true);
    setFollowing(next);
    try {
      if (next) await api.post(`/users/${userId}/follow`);
      else await api.delete(`/users/${userId}/follow`);
      router.refresh();
    } catch {
      setFollowing(!next);
    } finally {
      setPending(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`text-xs font-semibold ${following ? 'text-neutral-300' : 'text-sky-400 hover:text-sky-300'}`}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-lg px-5 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
        following ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-sky-500 hover:bg-sky-600'
      }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
