'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthBrandHeader from '@/components/AuthBrandHeader';
import PublicSiteNav from '@/components/PublicSiteNav';

interface RegisterPageClientProps {
  pendingCode?: string;
}

export default function RegisterPageClient({
  pendingCode,
}: RegisterPageClientProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      if (pendingCode) {
        try {
          const joinRes = await fetch('/api/groups/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ makanCode: pendingCode }),
          });
          const joinData = await joinRes.json();
          if (joinRes.ok && joinData.group?.id) {
            router.push(`/group/${joinData.group.id}`);
            return;
          }
        } catch {
          // fall through to default redirect
        }
      }

      router.push('/groups');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-slate transition-colors dark:bg-gray-950 dark:text-gray-100">
      <PublicSiteNav />
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          <AuthBrandHeader subtitle="Create your free makan roulette account." />

          {pendingCode && (
            <div className="mb-4 rounded-xl border border-pandan/30 bg-pandan/10 px-4 py-3 text-sm text-slate dark:text-gray-100">
              <span className="font-bold">Joining group</span>{' '}
              <span className="font-mono font-bold">{pendingCode}</span> after
              you sign up.
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ahmad"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                href={
                  pendingCode
                    ? `/login?code=${encodeURIComponent(pendingCode)}`
                    : '/login'
                }
                className="text-sambal font-semibold hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}
