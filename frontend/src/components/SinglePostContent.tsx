import BookmarkButton from "@/components/BookmarkButton";
import Comment from "@/components/Comment";
import LikesInfo from "@/components/LikesInfo";
import Preloader from "@/components/Preloader";
import SessionCommentForm from "@/components/SessionCommentForm";
import { Post, Profile, Comment as CommentModel, Like, Bookmark } from "@/types";
import { Suspense } from "react";
import Link from "next/link";
import { getMediaUrl } from "@/lib/api/client";

export default function SinglePostContent({
  post,
  authorProfile,
  comments,
  commentsAuthors,
  myLike,
  myBookmark,
}: {
  post: Post;
  authorProfile: Profile;
  comments: CommentModel[];
  commentsAuthors: Profile[];
  myLike: Like | null;
  myBookmark: Bookmark | null;
}) {
  const authorName = authorProfile?.name || authorProfile?.username || 'Creator';
  const authorUsername = authorProfile?.username || 'user';
  const authorAvatar = authorProfile?.avatar;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-6 select-none">
      <div className="bg-[#121214] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl grid md:grid-cols-2">
        {/* Left Side: Post Image */}
        <div className="bg-black flex items-center justify-center min-h-[380px] md:min-h-[560px] border-b md:border-b-0 md:border-r border-neutral-800">
          <img
            className="w-full h-full object-contain max-h-[600px]"
            src={post.image}
            alt={post.description || 'Post image'}
          />
        </div>

        {/* Right Side: Header, Comments Stream, Actions, Comment Form */}
        <div className="flex flex-col justify-between h-full bg-[#121214] min-h-[500px]">
          {/* Post Header */}
          <div className="flex items-center gap-3 p-4 border-b border-neutral-800 bg-[#16161a]">
            <Link
              href={`/users/${authorUsername}`}
              className="size-9 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 flex items-center justify-center cursor-pointer hover:opacity-90"
            >
              {authorAvatar ? (
                <img
                  src={getMediaUrl(authorAvatar)}
                  alt={authorUsername}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-xs text-white">
                  {authorUsername[0]?.toUpperCase()}
                </div>
              )}
            </Link>
            <div className="flex flex-col">
              <Link
                href={`/users/${authorUsername}`}
                className="text-xs font-semibold text-white hover:underline leading-tight"
              >
                {authorUsername}
              </Link>
              {authorProfile?.subtitle && (
                <span className="text-[10px] text-neutral-400 leading-tight">
                  {authorProfile.subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Comments & Caption Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[360px] md:max-h-[420px] flex flex-col gap-4">
            {/* Post Caption as first comment item if present */}
            {post.description && (
              <div className="pb-3 border-b border-neutral-800/60">
                <Comment
                  createdAt={post.createdAt}
                  text={post.description}
                  authorProfile={authorProfile}
                />
              </div>
            )}

            {/* User Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-10 text-neutral-500 text-xs">
                No comments yet. Be the first to start the conversation!
              </div>
            ) : (
              comments.map((comment) => {
                const author = commentsAuthors.find(
                  (a) =>
                    a.userId === comment.author ||
                    (a as any).id === comment.author ||
                    a.email === comment.author
                );
                return (
                  <div key={comment.id}>
                    <Comment
                      createdAt={comment.createdAt}
                      text={comment.text}
                      authorProfile={author}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Area: Likes, Bookmark, Date, & Comment Input Form */}
          <div className="border-t border-neutral-800 p-4 bg-[#141417]">
            <div className="flex items-center justify-between pb-3">
              <LikesInfo post={post} sessionLike={myLike} />
              <BookmarkButton post={post} sessionBookmark={myBookmark} />
            </div>

            <div className="pt-2">
              <Suspense fallback={<Preloader />}>
                <SessionCommentForm postId={post.id} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}