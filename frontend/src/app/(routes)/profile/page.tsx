import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server-api';

export default async function OwnProfilePage() {
  const me = await getCurrentUser();
  redirect(`/users/${me.username}`);
}
