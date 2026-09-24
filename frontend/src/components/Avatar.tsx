import { mediaUrl } from '@/lib/format';
import type { UserSummary } from '@/lib/types';

export default function Avatar({ user, size = 32 }: { user: Pick<UserSummary, 'username' | 'avatar'>; size?: number }) {
  const style = { width: size, height: size };
  if (user.avatar) {
    return (
      <img
        src={mediaUrl(user.avatar)}
        alt={user.username}
        style={style}
        className="shrink-0 rounded-full bg-neutral-800 object-cover"
      />
    );
  }
  return (
    <div
      aria-label={user.username}
      style={{ ...style, fontSize: size * 0.42 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 font-semibold uppercase text-white"
    >
      {user.username[0]}
    </div>
  );
}
