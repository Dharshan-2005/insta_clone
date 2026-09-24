import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold">Sorry, this page isn&apos;t available.</h1>
      <p className="text-sm text-neutral-400">The link may be broken, or the page may have been removed.</p>
      <Link href="/" className="text-sm font-semibold text-sky-400 hover:text-sky-300">
        Go back to Instagram
      </Link>
    </main>
  );
}
