'use client';

import { Eye, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/format';
import type { StoryGroup } from '@/lib/types';
import Avatar from './Avatar';
import { useCurrentUser } from './CurrentUser';
import TimeAgo from './TimeAgo';

type Position = { group: number; story: number };

export default function StoryTray() {
  const me = useCurrentUser();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [paused, setPaused] = useState(false);

  const load = useCallback(() => {
    api
      .get<StoryGroup[]>('/stories/feed')
      .then(setGroups)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (position === null) load();
  }, [position, load]);

  const close = useCallback(() => setPosition(null), []);

  const next = useCallback(() => {
    setPosition((current) => {
      if (!current) return null;
      if (current.story < groups[current.group].stories.length - 1) return { ...current, story: current.story + 1 };
      if (current.group < groups.length - 1) return { group: current.group + 1, story: 0 };
      return null;
    });
  }, [groups]);

  const previous = useCallback(() => {
    setPosition((current) => {
      if (!current) return null;
      if (current.story > 0) return { ...current, story: current.story - 1 };
      if (current.group > 0) return { group: current.group - 1, story: groups[current.group - 1].stories.length - 1 };
      return current;
    });
  }, [groups]);

  const group = position ? groups[position.group] : null;
  const story = group && position ? group.stories[position.story] : null;

  useEffect(() => {
    if (story && !story.viewed) api.post(`/stories/${story.id}/view`).catch(() => undefined);
  }, [story]);

  useEffect(() => {
    if (!story) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') previous();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [story, close, next, previous]);

  const hasOwnStory = groups.some((g) => g.user.id === me.id);

  return (
    <>
      <div className="scrollbar-none flex gap-4 overflow-x-auto py-4">
        {!hasOwnStory && (
          <Link href="/create?type=story" className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <div className="relative">
              <Avatar user={me} size={64} />
              <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full border-2 border-black bg-sky-500">
                <Plus className="size-3" strokeWidth={3} />
              </span>
            </div>
            <span className="w-full truncate text-center text-xs text-neutral-400">Your story</span>
          </Link>
        )}
        {groups.map((g, index) => (
          <button
            key={g.user.id}
            type="button"
            onClick={() => setPosition({ group: index, story: Math.max(0, g.stories.findIndex((s) => !s.viewed)) })}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <div
              className={`rounded-full p-[2px] ${
                g.hasUnseen ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600' : 'bg-neutral-700'
              }`}
            >
              <div className="rounded-full bg-black p-[2px]">
                <Avatar user={g.user} size={56} />
              </div>
            </div>
            <span className="w-full truncate text-center text-xs">
              {g.user.id === me.id ? 'Your story' : g.user.username}
            </span>
          </button>
        ))}
      </div>

      {group && story && position && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={close}>
          <div
            className="relative flex h-full max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-neutral-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
              {group.stories.map((s, index) => (
                <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                  {index < position.story && <div className="h-full w-full bg-white" />}
                  {index === position.story && (
                    <div
                      key={`${position.group}-${position.story}`}
                      className="h-full animate-story-progress bg-white"
                      style={{ animationPlayState: paused ? 'paused' : 'running' }}
                      onAnimationEnd={next}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="absolute inset-x-3 top-6 z-20 flex items-center gap-2">
              <Avatar user={group.user} size={32} />
              <Link href={`/users/${group.user.username}`} className="text-sm font-semibold">
                {group.user.username}
              </Link>
              <TimeAgo date={story.createdAt} className="text-sm text-neutral-300" />
              <button type="button" onClick={close} className="ml-auto" aria-label="Close">
                <X className="size-6" />
              </button>
            </div>

            <div
              className="relative flex flex-1 items-center justify-center"
              onPointerDown={() => setPaused(true)}
              onPointerUp={() => setPaused(false)}
              onPointerLeave={() => setPaused(false)}
            >
              <img src={mediaUrl(story.mediaPath)} alt={story.caption ?? 'Story'} className="max-h-full w-full object-contain" />
              <button type="button" aria-label="Previous" onClick={previous} className="absolute inset-y-0 left-0 w-1/3" />
              <button type="button" aria-label="Next" onClick={next} className="absolute inset-y-0 right-0 w-1/3" />
              {story.caption && (
                <p className="absolute inset-x-4 bottom-6 rounded-lg bg-black/60 p-3 text-center text-sm">{story.caption}</p>
              )}
            </div>

            {story.viewsCount !== null && (
              <div className="flex items-center gap-2 border-t border-neutral-800 p-3 text-sm text-neutral-300">
                <Eye className="size-4" />
                {story.viewsCount} {story.viewsCount === 1 ? 'view' : 'views'}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
