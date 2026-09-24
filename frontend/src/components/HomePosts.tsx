import { Bookmark, Like, Post, Profile } from "@/types";
import HomeFeedClient from "@/components/HomeFeedClient";

export default async function HomePosts({
  posts,
  profiles,
  likes,
  bookmarks,
  nextCursor,
}: {
  posts: Post[];
  profiles: Profile[];
  likes: Like[];
  bookmarks: Bookmark[];
  nextCursor?: string | null;
}) {
  return (
    <HomeFeedClient
      initialPosts={posts}
      profiles={profiles}
      initialLikes={likes}
      initialBookmarks={bookmarks}
      initialCursor={nextCursor}
    />
  );
}