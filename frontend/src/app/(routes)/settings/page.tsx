import { auth, signOut } from "@/auth";
import SettingsForm from "@/components/SettingsForm";
import { apiFetch } from "@/lib/api";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LogOut } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  let userEmail = session?.user?.email;

  if (!userEmail) {
    const token = cookies().get('access_token')?.value;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          userEmail = payload.email || payload.sub;
        }
      } catch {}
    }
  }

  if (!userEmail) {
    redirect('/auth/login');
  }

  const profile = (await apiFetch('/users/profile').catch(() => null)) || {
    id: '',
    username: '',
    name: '',
    bio: '',
    subtitle: '',
    avatar: '',
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 select-none">
      <div className="bg-[#121214] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="mb-6 pb-4 border-b border-neutral-800">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Edit profile
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {userEmail}
          </p>
        </div>

        <SettingsForm profile={profile} />

        <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-center">
          <form
            action={async () => {
              'use server';
              const { cookies } = await import('next/headers');
              const c = cookies();
              c.delete('access_token');
              c.delete('authjs.session-token');
              c.delete('__Secure-authjs.session-token');
              c.delete('next-auth.session-token');
              c.delete('__Secure-next-auth.session-token');
              try {
                await signOut({ redirectTo: '/auth/login' });
              } catch {
                const { redirect } = await import('next/navigation');
                redirect('/auth/login');
              }
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-2"
            >
              <LogOut className="size-4" />
              <span>Log out of account</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}