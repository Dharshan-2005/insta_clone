'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, X, Heart, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { getMediaUrl } from '@/lib/api/client';
import { apiFetch } from '@/lib/api';

interface StoryItem {
  id: string;
  userId: string;
  mediaPath: string;
  mediaType: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  viewsCount: number;
  likesCount: number;
  isViewed: boolean;
  isLiked: boolean;
}

interface UserStoriesGroup {
  user: {
    id: string;
    username: string;
    name: string;
    avatar?: string | null;
  };
  hasUnseen: boolean;
  stories: StoryItem[];
}

export default function StoryTray() {
  const [feedStories, setFeedStories] = useState<UserStoriesGroup[]>([]);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressTimerRef = useRef<any>(null);

  const fetchStories = async () => {
    try {
      const res = await apiFetch('/stories/feed');
      const list = Array.isArray(res) ? res : res?.data || [];
      setFeedStories(list);
    } catch (err) {
      console.warn('Failed to load stories feed:', err);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Story player progress timer
  useEffect(() => {
    if (activeGroupIndex === null) return;
    const currentGroup = feedStories[activeGroupIndex];
    if (!currentGroup || !currentGroup.stories[activeStoryIndex]) return;

    const currentStory = currentGroup.stories[activeStoryIndex];

    // Mark viewed
    apiFetch(`/stories/${currentStory.id}/view`, { method: 'POST' }).catch(() => {});

    if (isPaused) return;

    const timer = setTimeout(() => {
      handleNextStory();
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeGroupIndex, activeStoryIndex, isPaused, feedStories]);

  const handleNextStory = () => {
    if (activeGroupIndex === null) return;
    const currentGroup = feedStories[activeGroupIndex];

    if (activeStoryIndex < currentGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else if (activeGroupIndex < feedStories.length - 1) {
      const nextGroupIndex = activeGroupIndex + 1;
      setActiveGroupIndex(nextGroupIndex);
      setActiveStoryIndex(0);
    } else {
      closePlayer();
    }
  };

  const handlePrevStory = () => {
    if (activeGroupIndex === null) return;

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else if (activeGroupIndex > 0) {
      const prevGroupIndex = activeGroupIndex - 1;
      const prevGroup = feedStories[prevGroupIndex];
      setActiveGroupIndex(prevGroupIndex);
      setActiveStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const closePlayer = () => {
    setActiveGroupIndex(null);
    setActiveStoryIndex(0);
    fetchStories();
  };

  const handleLikeCurrentStory = async () => {
    if (activeGroupIndex === null) return;
    const currentStory = feedStories[activeGroupIndex]?.stories[activeStoryIndex];
    if (!currentStory) return;

    try {
      await apiFetch(`/stories/${currentStory.id}/like`, { method: 'POST' });
      currentStory.isLiked = true;
      currentStory.likesCount += 1;
      setFeedStories([...feedStories]);
    } catch (err) {
      console.error('Failed to like story:', err);
    }
  };

  return (
    <div className="w-full max-w-[470px] mx-auto pt-3 pb-2 select-none">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none items-center">
        {/* Your Story (+) Button */}
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

        {/* Active Story Circles */}
        {feedStories.map((group, gIdx) => (
          <div
            key={group.user.id || group.user.username}
            onClick={() => {
              setActiveGroupIndex(gIdx);
              setActiveStoryIndex(0);
            }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div
              className={`size-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
                group.hasUnseen
                  ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600'
                  : 'bg-neutral-800'
              }`}
            >
              <div className="size-full rounded-full bg-black p-0.5 overflow-hidden flex items-center justify-center">
                {group.user.avatar ? (
                  <img
                    src={getMediaUrl(group.user.avatar)}
                    alt={group.user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white">
                    {(group.user.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] text-neutral-300 truncate max-w-[66px]">
              {group.user.username}
            </span>
          </div>
        ))}
      </div>

      {/* Full-Screen Story Player Modal */}
      {activeGroupIndex !== null && feedStories[activeGroupIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closePlayer}
            className="absolute top-4 right-4 text-white hover:text-neutral-400 p-2 z-50"
          >
            <X className="size-8" />
          </button>

          {/* Player Container */}
          <div className="relative w-full max-w-sm h-[85vh] bg-neutral-900 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {/* Story Image / Content */}
            <div
              className="relative flex-1 w-full bg-black flex items-center justify-center cursor-pointer"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              <img
                src={getMediaUrl(
                  feedStories[activeGroupIndex].stories[activeStoryIndex]?.mediaPath,
                )}
                alt="Story"
                className="w-full h-full object-contain"
              />

              {/* Navigation overlays */}
              <div
                onClick={handlePrevStory}
                className="absolute left-0 top-0 bottom-0 w-1/3 z-20"
              />
              <div
                onClick={handleNextStory}
                className="absolute right-0 top-0 bottom-0 w-1/3 z-20"
              />

              {/* Progress bars top */}
              <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
                {feedStories[activeGroupIndex].stories.map((s, idx) => (
                  <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-white transition-all duration-300 ${
                        idx < activeStoryIndex
                          ? 'w-full'
                          : idx === activeStoryIndex
                          ? 'w-full animate-pulse'
                          : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Header Info */}
              <div className="absolute top-7 left-3 right-3 flex items-center justify-between z-30">
                <div className="flex items-center gap-2">
                  <img
                    src={getMediaUrl(feedStories[activeGroupIndex].user.avatar)}
                    alt={feedStories[activeGroupIndex].user.username}
                    className="size-8 rounded-full object-cover border border-neutral-700"
                  />
                  <span className="text-sm font-semibold text-white">
                    @{feedStories[activeGroupIndex].user.username}
                  </span>
                </div>
              </div>

              {/* Caption if present */}
              {feedStories[activeGroupIndex].stories[activeStoryIndex]?.caption && (
                <div className="absolute bottom-16 left-4 right-4 bg-black/60 backdrop-blur-sm p-3 rounded-lg z-30 text-sm text-white">
                  {feedStories[activeGroupIndex].stories[activeStoryIndex]?.caption}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-neutral-800 bg-black flex items-center justify-between z-30">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Eye className="size-4" />
                <span>
                  {feedStories[activeGroupIndex].stories[activeStoryIndex]?.viewsCount || 0} views
                </span>
              </div>

              <button
                onClick={handleLikeCurrentStory}
                className="flex items-center gap-1.5 text-white hover:text-rose-500 transition-colors"
              >
                <Heart
                  className={`size-6 ${
                    feedStories[activeGroupIndex].stories[activeStoryIndex]?.isLiked
                      ? 'fill-rose-500 text-rose-500'
                      : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
