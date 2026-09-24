'use client';

import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import type { Comment, PostDetail as PostDetailType } from '@/lib/types';
import Avatar from './Avatar';
import { useCurrentUser } from './CurrentUser';
import PostActions from './PostActions';
import PostMedia from './PostMedia';
import TimeAgo from './TimeAgo';
import { usePostActions } from './usePostActions';

function CommentItem({ author, text, createdAt }: Pick<Comment, 'author' | 'text' | 'createdAt'>) {
  return (
    <div className="flex gap-3">
      <Link href={`/users/${author.username}`}>
        <Avatar user={author} size={32} />
      </Link>
      <div className="min-w-0 text-sm">
        <p className="whitespace-pre-line break-words">
          <Link href={`/users/${author.username}`} className="mr-1.5 font-semibold">
            {author.username}
          </Link>
          {text}
        </p>
        <TimeAgo date={createdAt} className="text-xs text-neutral-500" />
      </div>
    </div>
  );
}

export default function PostDetail({ post }: { post: PostDetailType }) {
  const router = useRouter();
  const me = useCurrentUser();
  const actions = usePostActions(post);
  const [comments, setComments] = useState(post.comments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOwner = post.userId === me.id;

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const comment = await api.post<Comment>(`/posts/${post.id}/comments`, { text });
      setComments((current) => [...current, comment]);
      setText('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      router.replace(`/users/${me.username}`);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="grid overflow-hidden rounded-lg border border-neutral-800 md:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex items-center justify-center bg-neutral-950">
        <PostMedia post={post} className="max-h-[80vh] w-full object-contain" />
      </div>

      <div className="flex max-h-[80vh] min-h-[420px] flex-col border-t border-neutral-800 md:border-l md:border-t-0">
        <header className="flex items-center gap-3 border-b border-neutral-800 p-4">
          <Link href={`/users/${post.author.username}`}>
            <Avatar user={post.author} size={32} />
          </Link>
          <div className="min-w-0 flex-1 text-sm leading-tight">
            <Link href={`/users/${post.author.username}`} className="font-semibold">
              {post.author.username}
            </Link>
            {post.location && <p className="truncate text-xs text-neutral-400">{post.location}</p>}
          </div>
          {isOwner && (
            <button type="button" onClick={deletePost} aria-label="Delete post" className="text-neutral-400 hover:text-rose-400">
              <Trash2 className="size-5" />
            </button>
          )}
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {post.caption && <CommentItem author={post.author} text={post.caption} createdAt={post.createdAt} />}
          {comments.map((comment) => (
            <CommentItem key={comment.id} {...comment} />
          ))}
          {!post.caption && comments.length === 0 && (
            <p className="m-auto text-center text-sm text-neutral-500">No comments yet. Start the conversation.</p>
          )}
        </div>

        <div className="border-t border-neutral-800 px-4 pb-2">
          <PostActions postId={post.id} actions={actions} onComment={() => inputRef.current?.focus()} />
          <TimeAgo date={post.createdAt} className="text-xs uppercase text-neutral-500" />
        </div>

        <form onSubmit={submitComment} className="flex items-center gap-2 border-t border-neutral-800 px-4 py-3">
          <input
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={1000}
            placeholder="Add a comment…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-500"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="text-sm font-semibold text-sky-400 hover:text-sky-300 disabled:opacity-40"
          >
            Post
          </button>
        </form>
        {error && <p className="px-4 pb-3 text-xs text-rose-400">{error}</p>}
      </div>
    </div>
  );
}
