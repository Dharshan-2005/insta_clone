import { auth } from "@/auth";
import ProfilePageContent from "@/components/ProfilePageContent";
import { apiFetch } from "@/lib/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  const token = cookies().get('access_token')?.value;

  if (!session && !token) {
    redirect('/auth/login');
  }

  const profile = await apiFetch('/users/profile').catch(() => null);
  if (!profile) {
    redirect('/auth/login');
  }

  return (
    <ProfilePageContent
      ourFollow={null}
      profile={profile}
      isOurProfile={true}
    />
  );
}