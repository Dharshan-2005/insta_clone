import PostsGrid from "@/components/PostsGrid";
import { apiFetch } from "@/lib/api";
import { getMediaUrl } from "@/lib/api/client";
import { Avatar } from "@radix-ui/themes";
import Link from "next/link";

export default async function SearchResults({ query }: { query: string }) {
  const [usersRes, postsRes] = await Promise.all([
    apiFetch(`/users/search?q=${encodeURIComponent(query)}`).catch(() => []),
    apiFetch(`/posts/search?q=${encodeURIComponent(query)}`).catch(() => []),
  ]);

  const profiles = Array.isArray(usersRes) ? usersRes : (usersRes?.data || []);
  const posts = Array.isArray(postsRes) ? postsRes : (postsRes?.data || []);

  return (
    <div>
      <h1 className="text-lg mt-4">
        Search results for &quot;{query}&quot;
      </h1>
      {profiles.length > 0 && (
        <div className="grid mt-4 sm:grid-cols-2 gap-2">
          {profiles.map((profile: any) => (
            <Link
              key={profile.id || profile.userId || profile.username}
              href={`/users/${profile.username}`}
              className="flex gap-2 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 rounded-full"
            >
              <div>
                <Avatar
                  size="4"
                  radius="full"
                  fallback="avatar"
                  src={getMediaUrl(profile.avatar)}
                />
              </div>
              <div>
                <h3>{profile.name || profile.username}</h3>
                <h4 className="text-gray-500 dark:text-gray-300 text-sm">
                  @{profile.username}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-4">
        <PostsGrid posts={posts} />
      </div>
    </div>
  );
}