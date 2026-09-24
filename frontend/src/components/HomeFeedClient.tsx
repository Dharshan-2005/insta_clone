'use client';

import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Bookmark, Like, Post, Profile } from '@/types';
import { getFeed } from '@/lib/api/feed';
import PostCard from '@/components/PostCard';
import { PulseLoader } from 'react-spinners';

interface HomeFeedClientProps {
  initialPosts: Post[];
  profiles: Profile[];
  initialLikes: Like[];
  initialBookmarks: Bookmark[];
  initialCursor?: string | null;
}

// Sample fallback posts matching Screenshot 1 and 2 when database has 0 posts
const FALLBACK_POSTS: Post[] = [
  {
    id: 'demo-post-1',
    author: 'trad_west_',
    authorProfile: {
      id: 'demo-u1',
      username: 'trad_west_',
      name: 'Trad West',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    } as any,
    caption: 'There is something humbling about walking into a medieval cathedral and realizing that the people who built it had no modern cranes or computers, only stone, faith, and craftsmanship.',
    image: 'https://images.unsplash.com/photo-1548625361-16a7f0580eb5?w=800&auto=format&fit=crop&q=80',
    likesCount: 7700,
    commentsCount: 31,
    createdAt: new Date().toISOString(),
  } as any,
  {
    id: 'demo-post-2',
    author: 'kundi_.kun',
    authorProfile: {
      id: 'demo-u2',
      username: 'kundi_.kun',
      name: 'Kundi Kun',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    } as any,
    caption: 'காண்டு 2001 - 2025 • நீங்கள் எங்களுக்கு விட்டுப் பிரிந்திருந்தாலும் உங்கள் நினைவுகள் எப்போதும் எங்கள் இதயத்தில் வாழும்.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    likesCount: 12400,
    commentsCount: 182,
    createdAt: new Date().toISOString(),
  } as any,
];

export default function HomeFeedClient({
  initialPosts,
  profiles,
  initialLikes,
  initialBookmarks,
  initialCursor,
}: HomeFeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(
    initialPosts.length > 0 ? initialPosts : FALLBACK_POSTS
  );
  const [cursor, setCursor] = useState<string | null | undefined>(initialCursor);
  const [hasMore, setHasMore] = useState(!!initialCursor);
  const [loading, setLoading] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  useEffect(() => {
    if (initialPosts.length > 0) {
      setPosts(initialPosts);
    }
  }, [initialPosts]);

  useEffect(() => {
    if (inView && hasMore && !loading && cursor) {
      loadMore();
    }
  }, [inView, hasMore, loading, cursor]);

  const loadMore = async () => {
    if (loading || !cursor) return;
    setLoading(true);
    try {
      const res = await getFeed(cursor, 10);
      if (res?.data && res.data.length > 0) {
        setPosts((prev) => [...prev, ...res.data]);
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error('Failed to load more feed items:', e);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 select-none">
      {posts.map((post) => {
        // Resolve author profile from DB or post
        const profile =
          post.authorProfile ||
          profiles.find(
            (p) =>
              p.email === post.author ||
              p.userId === post.author ||
              p.userId === post.userId ||
              p.username === post.author
          );

        const isLiked = initialLikes.some((like) => like.postId === post.id);
        const isBookmarked = initialBookmarks.some((b) => b.postId === post.id);

        return (
          <PostCard
            key={post.id}
            post={post}
            profile={profile}
            isLiked={isLiked}
            isBookmarked={isBookmarked}
          />
        );
      })}

      {hasMore && (
        <div ref={ref} className="py-6 flex justify-center items-center">
          <PulseLoader color="#e1306c" size={8} />
        </div>
      )}
    </div>
  );
}
