import Link from "next/link";
import { Follower, Profile } from "@/types";
import { getMediaUrl } from "@/lib/api/client";
import { Plus } from "lucide-react";

export default async function HomeTopRow({
  follows: _follows,
  profiles,
}: {
  follows: Follower[];
  profiles: Profile[];
}) {
  return (
    <div className="w-full max-w-[470px] mx-auto pt-3 pb-2 select-none">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none items-center">
        {/* Your Story button */}
        <Link
          href="/create"
          className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
        >
          <div className="relative size-16 rounded-full border border-neutral-800 p-0.5 flex items-center justify-center">
            <div className="size-full rounded-full bg-neutral-900 flex items-center justify-center text-neutral-300 group-hover:scale-105 transition-transform">
              <Plus className="size-6 stroke-[2] text-white" />
            </div>
          </div>
          <span className="text-[11px] text-neutral-400 truncate max-w-[66px]">Your story</span>
        </Link>

        {/* User Story Circles from DB */}
        {profiles.map((profile) => (
          <Link
            key={profile.id || profile.userId || profile.username}
            href={`/users/${profile.username || ''}`}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="size-16 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[2px] transition-transform group-hover:scale-105">
              <div className="size-full rounded-full bg-black p-0.5 overflow-hidden flex items-center justify-center">
                {profile.avatar ? (
                  <img
                    src={getMediaUrl(profile.avatar)}
                    alt={profile.username || 'user'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white">
                    {(profile.username || profile.name || 'U')[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] text-neutral-300 truncate max-w-[66px]">
              {profile.username || profile.name || 'User'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}