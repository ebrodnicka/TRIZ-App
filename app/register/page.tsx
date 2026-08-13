'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (
      !fullName ||
      !username ||
      !email ||
      !password ||
      !repeatPassword
    ) {
      setError('Please complete all fields.');
      return;
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one special character.');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the Terms & Conditions.');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccess(
      'Account created successfully. Please check your email if confirmation is required.'
    );

    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRepeatPassword('');
    setAcceptTerms(false);
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
              Create your account
            </h1>

            <p className="mt-3 text-[#66736f]">
              Create an account to save and manage your TRIZ projects.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Full name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Name and surname"
                className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
              />
            </div>

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
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
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
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
              />

              <p className="mt-2 text-xs text-[#7a8682]">
                Minimum 8 characters, including an uppercase letter,
                a number and a special character.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Repeat password
              </label>

              <input
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-xl border border-[#cbd5d1] px-4 py-3 outline-none focus:border-[#57b89d]"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4"
              />

              <span className="text-sm text-[#66736f]">
                I accept the Terms & Conditions.
              </span>
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#123d36] px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[#66736f]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#123d36] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}