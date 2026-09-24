import { auth } from "@/auth";
import ProfilePageContent from "@/components/ProfilePageContent";
import { apiFetch } from "@/lib/api";
import { cookies } from "next/headers";

export default async function UserProfilePage({
  params: { username },
}: {
  params: { username: string };
}) {
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