import { mediaUrl } from '@/lib/format';
import type { Post } from '@/lib/types';

export default function PostMedia({ post, className = '' }: { post: Post; className?: string }) {
  if (post.mediaType === 'video') {
    return <video src={mediaUrl(post.mediaPath)} className={className} controls playsInline preload="metadata" />;
  }
  return (
    <img
      src={mediaUrl(post.mediaPath)}
      alt={post.caption ?? `Post by ${post.author.username}`}
      className={className}
      loading="lazy"
    />
  );
}
