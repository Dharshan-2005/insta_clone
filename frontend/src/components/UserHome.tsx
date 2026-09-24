import HomePosts from "@/components/HomePosts";
import StoryTray from "@/components/StoryTray";
import { apiFetch } from "@/lib/api";
import { Session } from "next-auth";

export default async function UserHome({ session: _session }: { session?: Session | null }) {
  const [feedRes, usersRes] = await Promise.all([
    apiFetch('/feed').catch(() => ({ data: [], nextCursor: null })),
    apiFetch('/users/search?q=').catch(() => ({ data: [] })),
  ]);

  const posts = Array.isArray(feedRes) ? feedRes : (feedRes?.data || []);
  const profiles = Array.isArray(usersRes) ? usersRes : (usersRes?.data || []);

  return (
    <div className="flex flex-col gap-6 pb-16">
      <StoryTray />
      <HomePosts
        posts={posts}
        profiles={profiles}
        likes={[]}
        bookmarks={[]}
        nextCursor={feedRes?.nextCursor}
      />
    </div>
  );
}