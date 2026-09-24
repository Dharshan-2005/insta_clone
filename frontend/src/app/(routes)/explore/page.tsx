import ExploreFeed from '@/components/ExploreFeed';
import { getExplore } from '@/lib/api/feed';

export default async function ExplorePage() {
  const res = await getExplore(undefined, 18).catch(() => null);
  const posts = res?.data || [];
  return <ExploreFeed initialPosts={posts} />;
}
