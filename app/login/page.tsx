'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen bg-[#f4f2e9] px-6 py-12 text-[#123d36]">
      <div className="mx-auto max-w-xl">

        <Link
          href="/"
          className="mb-8 inline-block text-sm font-semibold text-[#4c7469] hover:underline"
        >
          ← Back to home
        </Link>

        <div className="rounded-3xl bg-white p-8 shadow-lg md:p-10">

          <div className="mb-8">

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#57b89d]">
              TRIZup
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Welcome back
            </h1>

            <p className="mt-3 text-[#66736f]">
              Log in to continue working on your TRIZ projects.
            </p>

          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#123d36] px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>

          </form>

          <p className="mt-7 text-center text-sm text-[#66736f]">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#123d36] hover:underline"
            >
              Create account
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}