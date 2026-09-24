import type { Metadata } from 'next';
import CreateForm from '@/components/CreateForm';

export const metadata: Metadata = { title: 'Create' };

export default function CreatePage({ searchParams }: { searchParams: { type?: string } }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <CreateForm initialMode={searchParams.type === 'story' ? 'story' : 'post'} />
    </div>
  );
}
