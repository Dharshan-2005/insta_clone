import Logo from '@/components/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={48} />
          <h1 className="text-3xl font-semibold tracking-tight">Instagram</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
