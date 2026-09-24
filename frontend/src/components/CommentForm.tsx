'use client';

import React, { useRef, useState } from 'react';
import { postComment } from "@/actions";
import { useRouter } from "next/navigation";
import { Smile, Send } from 'lucide-react';

export default function CommentForm({
  avatar,
  postId,
}: {
  avatar?: string;
  postId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('postId', postId);
      data.append('text', text.trim());
      await postComment(data);
      setText('');
      router.refresh();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full pt-1 select-none">
      <div className="flex items-center gap-2 flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2 focus-within:border-neutral-700 transition-colors">
        <Smile className="size-4 text-neutral-500 shrink-0 cursor-pointer hover:text-neutral-300" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="w-full bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={!text.trim() || submitting}
        className="px-3 py-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 disabled:opacity-40 transition-opacity flex items-center gap-1"
      >
        <span>Post</span>
      </button>
    </form>
  );
}