'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronRight,
  Volume2,
  VolumeX,
  Smile,
} from 'lucide-react';
import { Post, Profile } from '@/types';
import { getMediaUrl } from '@/lib/api/client';
import {
  likePost,
  removeLikeFromPost,
  bookmarkPost,
  unbookmarkPost,
  followProfile,
  unfollowProfile,
  postComment,
} from '@/actions';

interface PostCardProps {
  post: Post;
  profile?: Profile | null;
  isLiked?: boolean;
  isBookmarked?: boolean;
  demoOverlay?: boolean;
}

function formatRelativeTime(dateString?: string | Date): string {
  if (!dateString) return '1d';
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

export default function PostCard({
  post,
  profile,
  isLiked = false,
  isBookmarked = false,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  // Author details
  const authorObj =
    profile ||
    (typeof (post as any)?.author === 'object' && (post as any)?.author ? (post as any).author : null) ||
    post.authorProfile ||
    null;
  const username =
    authorObj?.username ||
    (typeof post.author === 'string' ? post.author : 'user');
  const authorUserId =
    authorObj?.userId ||
    authorObj?.id ||
    (typeof post.author === 'string' ? post.author : '');
  const avatarUrl = authorObj?.avatar;
  const caption = post.caption || post.description || '';
  const mediaUrl = getMediaUrl(post.mediaPath || post.image);

  const initialFollowing =
    (profile as any)?.isFollowing ??
    (post.authorProfile as any)?.isFollowing ??
    false;
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isMuted, setIsMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  // Inline comment state
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [inlineComment, setInlineComment] = useState('');
  const [recentComments, setRecentComments] = useState<string[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Toggle Like with optimistic UI
  const handleToggleLike = async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const formData = new FormData();
      formData.append('postId', post.id);
      if (nextLiked) {
        await likePost(formData);
      } else {
        await removeLikeFromPost(formData);
      }
    } catch (e) {
      console.error('Failed to toggle like:', e);
    }
  };

  // Double tap to like
  const handleDoubleTap = () => {
    if (!liked) {
      handleToggleLike();
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    try {
      if (nextBookmarked) {
        await bookmarkPost(post.id);
      } else {
        await unbookmarkPost(post.id);
      }
    } catch (e) {
      console.error('Failed to toggle bookmark:', e);
    }
  };

  // Toggle Follow
  const handleToggleFollow = async () => {
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      if (next) {
        await followProfile(authorUserId);
      } else {
        await unfollowProfile(authorUserId);
      }
    } catch (e) {
      console.error('Follow toggle error:', e);
    }
  };

  // Post inline comment from feed
  const handlePostInlineComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineComment.trim() || submittingComment) return;

    const commentText = inlineComment.trim();
    setRecentComments((prev) => [...prev, commentText]);
    setCommentsCount((prev) => prev + 1);
    setInlineComment('');
    setSubmittingComment(true);

    try {
      const data = new FormData();
      data.append('postId', post.id);
      data.append('text', commentText);
      await postComment(data);
    } catch (e) {
      console.error('Failed to submit comment:', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const postUrl = `${window.location.origin}/posts/${post.id}`;
      try {
        await navigator.clipboard.writeText(postUrl);
        alert('Link copied to clipboard!');
      } catch {}
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return count.toString();
  };

  return (
    <article className="w-full max-w-[470px] mx-auto select-none pb-6 border-b border-[#262626]/60">
      {/* 1. Header: Avatar + Username + Time + Follow */}
      <div className="flex items-center justify-between pb-3 pt-2 px-1 sm:px-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/users/${username}`}
            className="size-9 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 flex-shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
          >
            {avatarUrl ? (
              <img
                src={getMediaUrl(avatarUrl)}
                alt={username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                {username[0]?.toUpperCase()}
              </div>
            )}
          </Link>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 leading-tight">
              <Link
                href={`/users/${username}`}
                className="font-semibold text-xs text-white hover:opacity-80 transition-opacity truncate"
              >
                {username}
              </Link>
              <span className="text-neutral-500 text-xs">•</span>
              <span className="text-neutral-400 text-xs">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            {!isFollowing && (
              <span className="text-[11px] text-neutral-400 leading-tight">
                Suggested for you
              </span>
            )}
          </div>
        </div>

        {/* Right side: [ Follow ] button & More */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleToggleFollow}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isFollowing
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                : 'bg-sky-500 hover:bg-sky-400 text-white'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button
            type="button"
            className="p-1 text-white hover:text-neutral-400 transition-colors"
            title="More options"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </div>

      {/* 2. Media Card */}
      <div
        onDoubleClick={handleDoubleTap}
        className="relative w-full aspect-square md:aspect-[4/5] bg-neutral-900 rounded-md overflow-hidden border border-neutral-800/80 group cursor-pointer"
      >
        <img
          src={mediaUrl}
          alt={caption || 'Post image'}
          className="w-full h-full object-cover"
        />

        {/* Speaker / Audio button only for video */}
        {(post as any).mediaType === 'video' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            aria-label="Toggle audio"
            className="absolute right-3 bottom-3 size-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-transform active:scale-90 z-10"
          >
            {isMuted ? (
              <VolumeX className="size-3.5 stroke-[2]" />
            ) : (
              <Volume2 className="size-3.5 stroke-[2]" />
            )}
          </button>
        )}

        {/* Bursting Heart Animation on Double Tap */}
        {showHeartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="size-24 text-white fill-white drop-shadow-2xl animate-in zoom-in-50 duration-200" />
          </div>
        )}
      </div>

      {/* 3. Action Bar: Like, Comment, Share, Bookmark */}
      <div className="flex items-center justify-between pt-2.5 pb-1">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Like */}
          <button
            type="button"
            onClick={handleToggleLike}
            className="flex items-center gap-1.5 group text-white hover:opacity-80 transition-opacity"
            title="Like"
          >
            <Heart
              className={`size-6 transition-transform group-active:scale-125 ${
                liked ? 'text-red-500 fill-red-500 stroke-red-500' : 'stroke-[1.8]'
              }`}
            />
            <span className="text-xs font-semibold tracking-tight">
              {formatCount(likesCount)}
            </span>
          </button>

          {/* Comment */}
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 group text-white hover:opacity-80 transition-opacity"
            title="Comment"
          >
            <MessageCircle className="size-6 stroke-[1.8] -rotate-90 group-active:scale-110 transition-transform" />
            <span className="text-xs font-semibold tracking-tight">
              {formatCount(commentsCount)}
            </span>
          </Link>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 group text-white hover:opacity-80 transition-opacity"
            title="Share"
          >
            <Send className="size-6 stroke-[1.8] -rotate-12 group-active:scale-110 transition-transform" />
          </button>
        </div>

        {/* Bookmark */}
        <button
          type="button"
          onClick={handleToggleBookmark}
          className="text-white hover:opacity-80 transition-opacity"
          title="Save"
        >
          <Bookmark
            className={`size-6 stroke-[1.8] ${
              bookmarked ? 'fill-white text-white' : ''
            }`}
          />
        </button>
      </div>

      {/* 4. Likes Count Row */}
      {likesCount > 0 && (
        <div className="pt-1 text-xs font-semibold text-white">
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </div>
      )}

      {/* 5. Caption Block */}
      {caption && (
        <div className="pt-1 text-xs sm:text-sm text-neutral-200 leading-relaxed">
          <Link
            href={`/users/${username}`}
            className="font-semibold text-white mr-1.5 hover:underline"
          >
            {username}
          </Link>
          <span className={isExpanded ? '' : 'line-clamp-2'}>{caption}</span>
          {caption.length > 80 && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-neutral-400 hover:text-white ml-1 font-medium text-xs"
            >
              more
            </button>
          )}
        </div>
      )}

      {/* 6. Comments Summary & Recent Inline Comments */}
      {commentsCount > 0 && (
        <Link
          href={`/posts/${post.id}`}
          className="text-xs text-neutral-500 hover:text-neutral-400 pt-1 block"
        >
          View all {commentsCount} comments
        </Link>
      )}

      {/* Display recent inline comments added by user */}
      {recentComments.length > 0 && (
        <div className="flex flex-col gap-1 pt-1">
          {recentComments.map((rc, idx) => (
            <div key={idx} className="text-xs text-neutral-200">
              <span className="font-semibold text-white mr-1.5">You</span>
              <span>{rc}</span>
            </div>
          ))}
        </div>
      )}

      {/* 7. Inline Comment Form */}
      <form onSubmit={handlePostInlineComment} className="mt-2 flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-1">
        <div className="flex items-center gap-2 flex-1">
          <Smile className="size-4 text-neutral-500 shrink-0 cursor-pointer hover:text-neutral-300" />
          <input
            type="text"
            value={inlineComment}
            onChange={(e) => setInlineComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none"
          />
        </div>
        {inlineComment.trim() && (
          <button
            type="submit"
            disabled={submittingComment}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Post
          </button>
        )}
      </form>
    </article>
  );
}
