import PostsGrid from "@/components/PostsGrid";
import { apiFetch } from "@/lib/api";

export default async function BrowsePage() {
  const res = await apiFetch('/posts/browse').catch(() => []);
  const posts = Array.isArray(res) ? res : (res?.data || []);
  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Browse</h1>
        <p className="text-sm text-gray-500">Discover recent photos and inspiration from creators</p>
      </div>
      <PostsGrid posts={posts} />
    </div>
  );
}