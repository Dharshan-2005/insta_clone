'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Heart, MessageCircle } from 'lucide-react';
import { Post } from '@/types';
import { getMediaUrl } from '@/lib/api/client';

interface PostsGridProps {
  posts: Post[];
  isOurProfile?: boolean;
}

export default function PostsGrid({ posts, isOurProfile = true }: PostsGridProps) {
  const postList: Post[] = Array.isArray(posts)
    ? posts
    : (posts as any)?.posts || (posts as any)?.data || [];

  // Empty State matching Screenshot 1
  if (!postList || postList.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 flex flex-col items-center justify-center text-center">
        {/* Circular Camera Outline Icon */}
        <div className="size-18 md:size-20 rounded-full border-2 border-white flex items-center justify-center mb-5 text-white">
          <Camera className="size-9 stroke-[1.2]" />
        </div>

        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
          Share Photos
        </h2>

        {/* Subtitle */}
        <p className="text-xs md:text-sm text-neutral-300 max-w-sm mx-auto mb-4 leading-relaxed">
          When you share photos, they will appear on your profile.
        </p>

        {/* Action Link */}
        {isOurProfile && (
          <Link
            href="/create"
            className="text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Share your first photo
          </Link>
        )}
      </div>
    );
  }

  // 3-Column Square Grid
  return (
    <div className="w-full max-w-4xl mx-auto pb-16">
      <div className="grid grid-cols-3 gap-1 md:gap-7">
        {postList.map((post) => {
          const media = getMediaUrl(post.mediaPath || post.image);
          return (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="relative aspect-square overflow-hidden bg-neutral-900 group cursor-pointer"
            >
              <img
                src={media}
                alt={post.caption || post.description || 'Instagram post'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Hover Stats Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm">
                <div className="flex items-center gap-1.5">
                  <Heart className="size-5 fill-white stroke-none" />
                  <span>{post.likesCount || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="size-5 fill-white stroke-none" />
                  <span>{post.commentsCount || 0}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}