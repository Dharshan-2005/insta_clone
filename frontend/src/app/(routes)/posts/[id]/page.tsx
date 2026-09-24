import PostDetail from '@/components/PostDetail';
import { serverApi } from '@/lib/server-api';
import type { PostDetail as PostDetailType } from '@/lib/types';

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await serverApi<PostDetailType>(`/posts/${encodeURIComponent(params.id)}`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PostDetail post={post} />
    </div>
  );
}
