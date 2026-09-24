import { auth } from "@/auth";
import ProfilePageContent from "@/components/ProfilePageContent";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

// Reserved root paths to prevent dynamic route collision
const RESERVED = new Set([
  'api',
  'browse',
  'create',
  'explore',
  'notifications',
  'posts',
  'profile',
  'search',
  'settings',
  'users',
  'auth',
  'media',
  'favicon.ico',
]);

export default async function UsernameProfilePage({
  params: { username },
}: {
  params: { username: string };
}) {
  if (RESERVED.has(username.toLowerCase())) {
    notFound();
  }

  const session = await auth();
  let currentUserId = (session?.user as any)?.id;
  let currentEmail = session?.user?.email;

  if (!currentUserId || !currentEmail) {
    const token = cookies().get('access_token')?.value;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          currentUserId = currentUserId || payload.sub;
          currentEmail = currentEmail || payload.email;
        }
      } catch {}
    }
  }

  const result = await apiFetch(`/users/${username}`).catch(() => null);
  const profile = (result?.id ? result : result?.profile) || {
    id: username,
    userId: username,
    email: '',
    username: username,
    name: username,
    bio: '',
    avatar: null,
    followersCount: 0,
    followingCount: 0,
  };

  const isOurProfile = Boolean(
    (currentUserId && (profile.userId === currentUserId || profile.id === currentUserId)) ||
    (currentEmail && profile.email === currentEmail) ||
    result?.isOurProfile
  );

  const ourFollow = result?.isFollowing
    ? { id: 'following', followerId: currentUserId, followingId: profile.userId || profile.id }
    : (result?.ourFollow || null);

  return (
    <ProfilePageContent
      isOurProfile={isOurProfile}
      ourFollow={ourFollow}
      profile={profile}
    />
  );
}
