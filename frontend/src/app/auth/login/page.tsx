'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { EyeIcon, EyeOffIcon, CheckCircle2, ArrowRight, Zap } from 'lucide-react';



// Default export wraps in Suspense so useSearchParams() is safe during static build
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');

  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = (customEmail || emailOrUser).trim();
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      setError('Please enter your email or username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Use Next.js proxy to avoid CORS (works in both local dev and Docker)
      const res = await fetch(`/api/gateway/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid username or password');
      }

      // Remove manual token setting as NextAuth handles cookies
      // Also authenticate with NextAuth so NextAuth session is populated
      try {
        await signIn('credentials', {
          email: loginEmail,
          password: loginPass,
          redirect: false,
        });
      } catch (err) {
        console.warn('NextAuth credentials sync warning:', err);
      }

      // Full navigation ensuring all cookies are passed to the server
      const callback = searchParams.get('callbackUrl');
      const targetUrl = callback && !callback.includes('/auth') ? callback : '/';
      window.location.href = targetUrl;
    } catch (err: any) {
      setError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="relative min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden px-4 py-12">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-orange-500/15 to-rose-600/15 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-900/10 to-violet-900/10 blur-[100px]" />
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-[900px] flex items-center gap-12">

        {/* Left side branding */}
        <div className="hidden lg:flex flex-col gap-8 flex-1">
          {/* Instagram wordmark */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <h1 className="text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] select-none leading-none">
                Instagram
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-20 blur-lg rounded-lg" />
            </div>
            <p className="text-neutral-400 text-lg font-light leading-relaxed">
              Share moments, connect with friends, and discover the world around you.
            </p>
          </div>

          {/* Feature cards */}
          <div className="flex flex-col gap-3">
            {[
              { icon: '📸', title: 'Share Photos & Videos', desc: 'Capture and share life\'s moments' },
              { icon: '🔔', title: 'Real-time Notifications', desc: 'Stay connected with what matters' },
              { icon: '💬', title: 'Messages & Stories', desc: 'Communicate in creative ways' },
            ].map((feat, i) => (
              <div
                key={feat.title}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.06] transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xl shrink-0 border border-white/10">
                  {feat.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{feat.title}</div>
                  <div className="text-xs text-neutral-500">{feat.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex -space-x-2">
              {['from-amber-400 to-rose-500', 'from-cyan-400 to-blue-500', 'from-violet-400 to-pink-500', 'from-green-400 to-emerald-500'].map((g, i) => (
                <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2 border-[#0a0a0f]`} />
              ))}
            </div>
            <p className="text-xs text-neutral-400">
              Join <span className="text-white font-semibold">2+ billion</span> people already on Instagram
            </p>
          </div>
        </div>

        {/* Right side: Login card */}
        <div className="w-full max-w-[400px] mx-auto lg:mx-0 flex flex-col gap-3">
          {/* Main card */}
          <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
            {/* Card inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-3xl" />

            <div className="relative z-10">
              {/* Logo & heading */}
              <div className="mb-8 flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-0.5 shadow-lg shadow-pink-500/25">
                    <div className="w-full h-full rounded-[14px] bg-[#0a0a0f] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-1">
                  <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                  <p className="text-sm text-neutral-500 mt-1">Sign in to your account to continue</p>
                </div>
              </div>

              {/* Registered success */}
              {registered && (
                <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Account created successfully! You can now sign in.</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs text-center">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={(e) => handleLogin(e)} className="flex flex-col gap-3">
                {/* Email field */}
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'email' ? 'ring-2 ring-violet-500/40' : ''}`}>
                  <input
                    id="login-email"
                    type="text"
                    placeholder="Phone number, username, or email"
                    value={emailOrUser}
                    onChange={(e) => setEmailOrUser(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all duration-200"
                    required
                    autoComplete="username"
                  />
                </div>

                {/* Password field */}
                <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'password' ? 'ring-2 ring-violet-500/40' : ''}`}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-4 pr-14 py-3.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all duration-200"
                    required
                    autoComplete="current-password"
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

                {/* Forgot password */}
                <div className="flex justify-end">
                  <Link href="/auth/forgot" className="text-xs text-neutral-500 hover:text-violet-400 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading || !emailOrUser || !password}
                  className="relative w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group"
                  style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#bc1888] via-[#e1306c] to-[#f09433] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Log in
                        <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                      </>
                    )}
                  </span>
                </button>
              </form>

            </div>
          </div>

          {/* Sign up card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] rounded-2xl p-5 text-center">
            <span className="text-sm text-neutral-500">Don&apos;t have an account? </span>
            <Link href="/auth/register" className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 hover:opacity-80 transition-opacity">
              Sign up
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
