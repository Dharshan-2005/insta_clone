import { Profile } from "@/types";
import { getMediaUrl } from "@/lib/api/client";
import Link from "next/link";

function formatRelativeTime(dateString: Date | string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w`;
  } catch {
    return '1d';
  }
}

export default function Comment({
  text,
  createdAt,
  authorProfile,
}: {
  text: string;
  createdAt: Date | string;
  authorProfile?: Profile;
}) {
  const username = authorProfile?.username || 'user';
  const name = authorProfile?.name || username;
  const avatar = authorProfile?.avatar;

  return (
    <div className="flex items-start gap-3 py-1 select-none">
      <Link
        href={`/users/${username}`}
        className="size-8 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90"
      >
        {avatar ? (
          <img
            src={getMediaUrl(avatar)}
            alt={username}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-xs text-white">
            {username[0]?.toUpperCase()}
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-neutral-200 leading-relaxed">
          <Link
            href={`/users/${username}`}
            className="font-semibold text-white mr-1.5 hover:underline"
          >
            {username}
          </Link>
          <span className="break-words">{text}</span>
        </div>

        <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 font-medium">
          <span>{formatRelativeTime(createdAt)}</span>
          <button type="button" className="hover:text-neutral-300">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}