'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Plus, MessageSquare } from 'lucide-react';
import FollowButton from '@/components/FollowButton';
import { Follower, Profile } from '@/types';
import { getMediaUrl } from '@/lib/api/client';

interface ProfilePageInfoProps {
  profile: Profile;
  isOurProfile: boolean;
  ourFollow: Follower | null;
  postsCount?: number;
}

export default function ProfilePageInfo({
  profile,
  isOurProfile,
  ourFollow,
  postsCount = 0,
}: ProfilePageInfoProps) {
  // All fields are dynamic from the database
  const username = profile.username || 'user';
  const fullName = profile.name || '';
  const bio = profile.bio || '';
  const followers = (profile as any).followersCount ?? 0;
  const following = (profile as any).followingCount ?? 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-6 pb-4 select-none">
      {/* Top Header Row: Avatar on Left, Details on Right */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 md:gap-14">
        {/* Left Column: Avatar with Note Bubble */}
        <div className="relative flex-shrink-0 flex flex-col items-center">
          {/* Note Bubble (Instagram Notes feature matching Screenshot 1) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-[#262626] hover:bg-[#333333] border border-neutral-700/80 rounded-2xl px-3 py-1 shadow-lg flex items-center gap-1.5 cursor-pointer transition-all duration-200">
            <span className="text-[11px] font-medium text-neutral-300">Note...</span>
            <div className="flex flex-col text-[8px] text-neutral-400 leading-none">
              <span>▲</span>
              <span>▼</span>
            </div>
          </div>

          {/* Circular Avatar */}
          <div className="size-32 sm:size-36 md:size-40 rounded-full p-1 border border-neutral-800 flex items-center justify-center bg-black">
            <div className="size-full rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center text-3xl font-bold text-neutral-300">
              {profile.avatar ? (
                <img
                  src={getMediaUrl(profile.avatar)}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-neutral-700 via-neutral-600 to-neutral-800 flex items-center justify-center text-white text-3xl font-bold">
                  {fullName ? fullName[0]?.toUpperCase() : username[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Username, Settings, Full Name, Stats, Bio */}
        <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left gap-3 w-full">
          {/* Line 1: Username & Settings Icon */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              {username}
            </h1>
            {isOurProfile ? (
              <Link
                href="/settings"
                className="p-1 text-white hover:text-neutral-400 transition-colors"
                title="Settings"
              >
                <Settings className="size-5 stroke-[1.8]" />
              </Link>
            ) : null}
          </div>

          {/* Line 2: Full Name (if set in DB) */}
          {fullName ? (
            <div className="text-sm md:text-base font-normal text-white">
              {fullName}
            </div>
          ) : null}

          {/* Line 3: Dynamic Stats Row */}
          <div className="flex items-center gap-7 text-sm md:text-base text-neutral-300">
            <span>
              <strong className="font-semibold text-white">{postsCount}</strong> posts
            </span>
            <span className="cursor-pointer hover:opacity-80 transition-opacity">
              <strong className="font-semibold text-white">{followers}</strong> followers
            </span>
            <span className="cursor-pointer hover:opacity-80 transition-opacity">
              <strong className="font-semibold text-white">{following}</strong> following
            </span>
          </div>

          {/* Line 4: Bio (if set in DB) */}
          {bio ? (
            <div className="text-sm text-neutral-200 whitespace-pre-line leading-relaxed max-w-md pt-1">
              {bio}
            </div>
          ) : null}
        </div>
      </div>

      {/* Action Buttons Row: Edit profile & View archive (Matching Screenshot 1) */}
      <div className="mt-6 flex items-center gap-2.5 w-full">
        {isOurProfile ? (
          <>
            <Link
              href="/settings"
              className="flex-1 text-center py-2 bg-[#262626] hover:bg-[#333333] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Edit profile
            </Link>
            <button
              type="button"
              className="flex-1 text-center py-2 bg-[#262626] hover:bg-[#333333] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              View archive
            </button>
          </>
        ) : (
          <FollowButton
            ourFollow={ourFollow}
            profileIdToFollow={profile.id}
          />
        )}
      </div>

      {/* Story Highlights Row: (+) New */}
      <div className="pt-8 pb-4">
        <div className="flex flex-col items-center gap-2 w-max cursor-pointer group">
          <div className="size-18 md:size-20 rounded-full border border-neutral-800 p-1 flex items-center justify-center group-hover:border-neutral-600 transition-colors">
            <div className="size-full rounded-full bg-[#121212] flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
              <Plus className="size-7 stroke-[1.5]" />
            </div>
          </div>
          <span className="text-xs font-medium text-neutral-300 group-hover:text-white transition-colors">
            New
          </span>
        </div>
      </div>
    </div>
  );
}