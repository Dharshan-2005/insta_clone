import { auth } from "@/auth";
import Preloader from "@/components/Preloader";
import UserHome from "@/components/UserHome";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  const cookieStore = cookies();
  const hasToken = cookieStore.has("access_token");

  // Redirect unauthenticated users to the sign-in page
  if (!session && !hasToken) {
    redirect("/auth/login");
  }

  return (
    <div className="w-full">
      <Suspense fallback={<Preloader />}>
        <UserHome session={session} />
      </Suspense>
    </div>
  );
}
