import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <AuthForm
      endpoint="/auth/login"
      submitLabel="Log in"
      fields={[
        { name: 'login', label: 'Username or email', autoComplete: 'username' },
        { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' },
      ]}
      hint={
        <p className="text-center text-xs text-neutral-500">
          Demo account: <span className="font-mono text-neutral-300">alex_morgan</span> /{' '}
          <span className="font-mono text-neutral-300">demo1234</span>
        </p>
      }
      footer={{ text: "Don't have an account?", linkLabel: 'Sign up', href: '/auth/register' }}
    />
  );
}
