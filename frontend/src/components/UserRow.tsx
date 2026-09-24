import Link from 'next/link';
import type { UserSummary } from '@/lib/types';
import Avatar from './Avatar';

export default function UserRow({ user, action }: { user: UserSummary; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Link href={`/users/${user.username}`}>
        <Avatar user={user} size={44} />
      </Link>
      <Link href={`/users/${user.username}`} className="min-w-0 flex-1 text-sm leading-tight">
        <p className="truncate font-semibold">{user.username}</p>
        {user.name && <p className="truncate text-neutral-400">{user.name}</p>}
      </Link>
      {action}
    </div>
  );
}
