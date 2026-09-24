'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-neutral-400">We couldn&apos;t load this page. Please try again.</p>
      <button type="button" onClick={reset} className="rounded-lg bg-sky-500 px-4 py-1.5 text-sm font-semibold hover:bg-sky-600">
        Try again
      </button>
    </div>
  );
}
