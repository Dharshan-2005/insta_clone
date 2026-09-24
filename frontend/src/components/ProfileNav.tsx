'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3X3, Bookmark, Repeat, SquareUser } from 'lucide-react';

interface ProfileNavProps {
  isOurProfile?: boolean;
  username: string;
}

export default function ProfileNav({
  isOurProfile = false,
  username,
}: ProfileNavProps) {
  const pathname = usePathname();
  const isSavedActive = pathname.includes('/bookmarked') || pathname.includes('/saved');
  const isRepostsActive = pathname.includes('/reposts');
  const isTaggedActive = pathname.includes('/tagged');
  const isPostsActive = !isSavedActive && !isRepostsActive && !isTaggedActive;

  const basePath = isOurProfile ? '/profile' : `/${username}`;

  return (
    <div className="w-full max-w-4xl mx-auto border-t border-[#262626]">
      <div className="flex justify-center items-center gap-16 sm:gap-24 md:gap-32">
        {/* Tab 1: Grid (Posts) */}
        <Link
          href={basePath}
          title="Posts"
          className={`py-3.5 transition-colors ${
            isPostsActive
              ? 'text-white border-t-2 border-white -mt-[1px]'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Grid3X3 className="size-5 stroke-[1.8]" />
        </Link>

        {/* Tab 2: Bookmark (Saved) */}
        <Link
          href={isOurProfile ? '/profile/bookmarked' : `${basePath}#saved`}
          title="Saved"
          className={`py-3.5 transition-colors ${
            isSavedActive
              ? 'text-white border-t-2 border-white -mt-[1px]'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Bookmark className="size-5 stroke-[1.8]" />
        </Link>

        {/* Tab 3: Repost (Shares) */}
        <Link
          href={`${basePath}#reposts`}
          title="Reposts"
          className={`py-3.5 transition-colors ${
            isRepostsActive
              ? 'text-white border-t-2 border-white -mt-[1px]'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Repeat className="size-5 stroke-[1.8]" />
        </Link>

        {/* Tab 4: Tagged */}
        <Link
          href={`${basePath}#tagged`}
          title="Tagged"
          className={`py-3.5 transition-colors ${
            isTaggedActive
              ? 'text-white border-t-2 border-white -mt-[1px]'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <SquareUser className="size-5 stroke-[1.8]" />
        </Link>
      </div>
    </div>
  );
}