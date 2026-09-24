import PostsGrid from "@/components/PostsGrid";
import { apiFetch } from "@/lib/api";

export default async function ProfilePosts({
  email,
  userId,
  username,
}: {
  email?: string | null;
  userId?: string | null;
  username?: string | null;
}) {
  const target = userId || username || email || '';
  let posts: any[] = [];
  if (target) {
    posts = await apiFetch(`/posts?userId=${encodeURIComponent(target)}`).catch(() => []);
    if (!posts || (Array.isArray(posts) && posts.length === 0)) {
      posts = await apiFetch(`/posts/user/${encodeURIComponent(target)}`).catch(() => []);
    }
  }

  const postList = Array.isArray(posts)
    ? posts
    : (posts as any)?.posts || (posts as any)?.data || [];

  return <PostsGrid posts={postList} />;
}