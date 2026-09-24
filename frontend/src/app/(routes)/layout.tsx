import { CurrentUserProvider } from '@/components/CurrentUser';
import Nav from '@/components/Nav';
import { getCurrentUser } from '@/lib/server-api';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();

  return (
    <CurrentUserProvider user={me}>
      <Nav />
      <main className="min-h-screen pb-16 md:pb-0 md:pl-[72px] xl:pl-60">{children}</main>
    </CurrentUserProvider>
  );
}
