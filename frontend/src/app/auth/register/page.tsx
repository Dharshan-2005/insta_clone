import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';

export const metadata: Metadata = { title: 'Sign up' };

export default function RegisterPage() {
  return (
    <AuthForm
      endpoint="/auth/register"
      submitLabel="Sign up"
      fields={[
        { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
        { name: 'name', label: 'Full name', autoComplete: 'name', optional: true },
        { name: 'username', label: 'Username', autoComplete: 'username', minLength: 3 },
        { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', minLength: 6 },
      ]}
      footer={{ text: 'Have an account?', linkLabel: 'Log in', href: '/auth/login' }}
    />
  );
}
