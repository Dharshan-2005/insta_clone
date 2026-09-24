'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage } from '@/lib/api';

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete: string;
  minLength?: number;
  optional?: boolean;
};

type Props = {
  endpoint: '/auth/login' | '/auth/register';
  fields: Field[];
  submitLabel: string;
  footer: { text: string; linkLabel: string; href: string };
  hint?: React.ReactNode;
};

export default function AuthForm({ endpoint, fields, submitLabel, footer, hint }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post(endpoint, values);
      window.location.assign('/');
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-6">
        {fields.map((field) => (
          <input
            key={field.name}
            name={field.name}
            type={field.type ?? 'text'}
            aria-label={field.label}
            placeholder={field.label}
            autoComplete={field.autoComplete}
            minLength={field.minLength}
            required={!field.optional}
            value={values[field.name] ?? ''}
            onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
            className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm outline-none focus:border-neutral-600"
          />
        ))}
        {error && <p className="text-center text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-sky-500 py-2 text-sm font-semibold hover:bg-sky-600 disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : submitLabel}
        </button>
        {hint}
      </form>
      <p className="rounded-xl border border-neutral-800 p-5 text-center text-sm">
        {footer.text}{' '}
        <Link href={footer.href} className="font-semibold text-sky-400 hover:text-sky-300">
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}
