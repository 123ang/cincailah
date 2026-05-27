'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthBrandHeader from '@/components/AuthBrandHeader';
import PublicSiteNav from '@/components/PublicSiteNav';

interface ResetPasswordClientProps {
  token: string;
}

export default function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Both fields are required');
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
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-slate transition-colors dark:bg-gray-950 dark:text-gray-100">
      <PublicSiteNav />
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          <AuthBrandHeader subtitle="Create a new password." />

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-pandan/10 border border-pandan/30 rounded-xl px-4 py-3 text-sm text-pandan">
                <p className="font-semibold mb-1">Password reset successful!</p>
                <p className="text-gray-600">Redirecting to login...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !token}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !token}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-sambal font-semibold hover:underline">
                Back to Login
              </Link>
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
