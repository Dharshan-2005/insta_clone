import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_API_URL ||
  "http://api-gateway:3051/api";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "default_auth_secret_for_dev_session_32bytes",
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const isDocker = process.env.NODE_ENV === 'production' && !process.env.USERPROFILE;
        const candidateUrls = [
          process.env.INTERNAL_GATEWAY_URL,
          process.env.NEXT_PUBLIC_GATEWAY_URL,
          process.env.NEXT_PUBLIC_API_URL,
          isDocker ? 'http://api-gateway:3051/api' : 'http://localhost:3051/api',
          isDocker ? 'http://localhost:3051/api' : 'http://api-gateway:3051/api',
        ].filter(Boolean) as string[];

        for (const baseUrl of candidateUrls) {
          try {
            const cleanBase = baseUrl.replace(/\/+$/, '');
            const res = await fetch(`${cleanBase}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: (credentials.email as string).trim(),
                password: credentials.password,
              }),
            });
            if (!res.ok) continue;
            const data = await res.json();
            const user = data?.data?.user || data?.user;
            const accessToken = data?.data?.accessToken || data?.accessToken;
            if (!user) continue;
            return {
              id: user.id,
              name: user.fullName || user.username || user.name || "Instagram User",
              email: user.email,
              image: user.avatar,
              backendToken: accessToken,
            };
          } catch {
            continue;
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if ((user as any).backendToken) {
          token.backendToken = (user as any).backendToken;
          token.userId = user.id;
        } else if (user.email && account?.provider === "google") {
          try {
            const res = await fetch(`${GATEWAY_URL}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                avatar: user.image,
                googleId: account?.providerAccountId || user.id || "google-user",
              }),
            });
            if (res.ok) {
              const data = await res.json();
              token.backendToken = data?.data?.accessToken || data?.accessToken;
              token.userId = data?.data?.user?.id || data?.user?.id;
            }
          } catch (err) {
            console.error("Error syncing Google session with API Gateway:", err);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.backendToken) {
        (session as any).backendToken = token.backendToken;
      }
      if (token?.userId && session.user) {
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
});