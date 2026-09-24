'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { EyeIcon, EyeOffIcon, SparklesIcon, ArrowRight, User, Mail, Lock, AtSign, CheckCircle2 } from 'lucide-react';

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 6 characters', test: (p: string) => p.length >= 6 },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !username) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      // Use Next.js proxy to avoid CORS (works in both local dev and Docker)
      const res = await fetch(`/api/gateway/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: fullName || username,
          fullName: fullName || username,
          username: username.toLowerCase().replace(/\s+/g, '_'),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed. Please try another email or username.');
      }

      try {
        await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
      } catch (err) {
        console.warn('NextAuth credentials sync warning:', err);
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setEmail(`user${randomNum}@instagram.demo`);
    setFullName('Instagram Explorer');
    setUsername(`explorer_${randomNum}`);
    setPassword('demo1234');
  };

  const step1Valid = email.length > 0 && password.length >= 6;
  const step2Valid = username.length > 0;

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden px-4 py-12">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-violet-600/20 to-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-rose-500/15 to-orange-500/15 blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-fuchsia-900/15 to-pink-900/15 blur-[100px]" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-[900px] flex items-center gap-12">

        {/* Left branding */}
        <div className="hidden lg:flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <h1 className="text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] select-none leading-none">
                Instagram
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-20 blur-lg rounded-lg" />
            </div>
            <p className="text-neutral-400 text-lg font-light leading-relaxed">
              Join millions of people sharing photos, videos and stories every day.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: '2B+', label: 'Monthly Users', icon: '👥' },
              { value: '100M+', label: 'Photos Daily', icon: '📸' },
              { value: '50+', label: 'Countries', icon: '🌍' },
              { value: '4.7★', label: 'App Store Rating', icon: '⭐' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1">
                <div className="text-xl">{stat.icon}</div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-neutral-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="flex flex-col gap-2.5">
            {[
              'Free to create and share content',
              'Connect with friends and creators worldwide',
              'Discover trending photos and reels',
              'Private and secure messaging',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm text-neutral-400">
                <CheckCircle2 className="size-4 text-violet-500 shrink-0" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Register card */}
        <div className="w-full max-w-[400px] mx-auto lg:mx-0 flex flex-col gap-3">
          {/* Main card */}
          <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-3xl" />

            <div className="relative z-10">
              {/* Logo & heading */}
              <div className="mb-7 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-0.5 shadow-lg shadow-pink-500/25">
                  <div className="w-full h-full rounded-[14px] bg-[#0a0a0f] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                </div>
                <div className="text-center mt-1">
                  <h2 className="text-2xl font-bold text-white">Create account</h2>
                  <p className="text-sm text-neutral-500 mt-1">Sign up to see photos from your friends</p>
                </div>
              </div>

              {/* Quick fill */}
              <button
                id="register-quick-fill"
                type="button"
                onClick={handleQuickFill}
                className="w-full mb-5 py-2.5 px-4 bg-gradient-to-r from-amber-500/10 to-rose-500/10 hover:from-amber-500/20 hover:to-rose-500/20 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-xs font-semibold text-amber-400 flex items-center justify-center gap-1.5 transition-all duration-200"
              >
                <SparklesIcon className="size-3.5" />
                Auto-fill demo credentials
              </button>

              {/* Error */}
              {error && (
                <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs text-center">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                {/* Email */}
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-violet-500/40' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none">
                    <Mail className="size-4" />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all duration-200"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Full name */}
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'fullname' ? 'ring-2 ring-violet-500/40' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none">
                    <User className="size-4" />
                  </div>
                  <input
                    id="register-fullname"
                    type="text"
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('fullname')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all duration-200"
                    autoComplete="name"
                  />
                </div>

                {/* Username */}
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'username' ? 'ring-2 ring-violet-500/40' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none">
                    <AtSign className="size-4" />
                  </div>
                  <input
                    id="register-username"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all duration-200"
                    required
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-violet-500/40' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none">
                    <Lock className="size-4" />
                  </div>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-11 pr-14 py-3.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all duration-200"
                    required
                    autoComplete="new-password"
                  />
                  {password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  )}
                </div>

                {/* Password strength */}
                {password.length > 0 && (
                  <div className="flex gap-2 px-1">
                    {PASSWORD_REQUIREMENTS.map((req) => (
                      <div key={req.label} className={`flex items-center gap-1.5 text-[11px] transition-colors ${req.test(password) ? 'text-emerald-500' : 'text-neutral-600'}`}>
                        <CheckCircle2 className="size-3" />
                        {req.label}
                      </div>
                    ))}
                  </div>
                )}

                {/* Terms */}
                <p className="text-[11px] text-neutral-600 text-center leading-relaxed px-2">
                  By signing up, you agree to our{' '}
                  <span className="text-neutral-400 hover:text-white cursor-pointer transition-colors">Terms</span>,{' '}
                  <span className="text-neutral-400 hover:text-white cursor-pointer transition-colors">Privacy Policy</span> and{' '}
                  <span className="text-neutral-400 hover:text-white cursor-pointer transition-colors">Cookies Policy</span>.
                </p>

                {/* Submit */}
                <button
                  id="register-submit"
                  type="submit"
                  disabled={loading || !email || !password || !username}
                  className="relative w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group mt-1"
                  style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#bc1888] via-[#e1306c] to-[#f09433] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* Log in card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-5 text-center">
            <span className="text-sm text-neutral-500">Have an account? </span>
            <Link href="/auth/login" className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 hover:opacity-80 transition-opacity">
              Log in
            </Link>
          </div>

          {/* App links */}
          <div className="flex flex-col items-center gap-3 pt-1">
            <span className="text-xs text-neutral-700">Get the app.</span>
            <div className="flex gap-2">
              {[{ top: 'GET IT ON', bottom: 'Google Play' }, { top: 'Download on the', bottom: 'App Store' }].map((store) => (
                <div key={store.bottom} className="h-10 px-4 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl flex items-center gap-2 cursor-pointer hover:bg-white/[0.08] transition-colors">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] leading-tight text-neutral-600">{store.top}</span>
                    <span className="text-[11px] font-semibold text-neutral-300">{store.bottom}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 text-center text-[11px] text-neutral-700 py-4 flex flex-col gap-2">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-4">
          {['Meta', 'About', 'Blog', 'Jobs', 'Help', 'API', 'Privacy', 'Terms', 'Locations', 'Instagram Lite', 'Threads', 'Meta Verified'].map((link) => (
            <span key={link} className="hover:text-neutral-500 cursor-pointer transition-colors">{link}</span>
          ))}
        </div>
        <span>English (US) · © 2026 Instagram from Meta</span>
      </footer>
    </div>
  );
}
