import PostsGrid from "@/components/PostsGrid";
import ProfileNav from "@/components/ProfileNav";
import ProfilePageInfo from "@/components/ProfilePageInfo";
import {apiFetch} from "@/lib/api";
import {redirect} from "next/navigation";

export default async function BookmarkedPage() {
  const profile = await apiFetch('/users/profile').catch(() => null);
  if (!profile) {
    return redirect('/auth/login');
  }
  const { posts } = await apiFetch('/posts/bookmarked').catch(() => ({ posts: [] }));
  return (
    <div>
      <ProfilePageInfo
        profile={profile}
        isOurProfile={true}
        ourFollow={null} />
      <ProfileNav
        username={profile.username || ''}
        isOurProfile={true} />
      <div className="mt-4">
        <PostsGrid posts={posts} />
      </div>
    </div>
  );
}