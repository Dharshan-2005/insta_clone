'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Post } from '@/lib/types';

export function usePostActions(post: Post) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked);

  const setLike = async (next: boolean) => {
    if (next === liked) return;
    setLiked(next);
    setLikesCount((count) => count + (next ? 1 : -1));
    try {
      if (next) await api.post(`/posts/${post.id}/like`);
      else await api.delete(`/posts/${post.id}/like`);
    } catch {
      setLiked(!next);
      setLikesCount((count) => count + (next ? -1 : 1));
    }
  };

  const toggleBookmark = async () => {
    const next = !bookmarked;
    setBookmarked(next);
    try {
      if (next) await api.post(`/posts/${post.id}/bookmark`);
      else await api.delete(`/posts/${post.id}/bookmark`);
    } catch {
      setBookmarked(!next);
    }
  };

  return { liked, likesCount, bookmarked, toggleLike: () => setLike(!liked), like: () => setLike(true), toggleBookmark };
}
