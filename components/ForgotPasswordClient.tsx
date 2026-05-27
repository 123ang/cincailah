'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthBrandHeader from '@/components/AuthBrandHeader';
import PublicSiteNav from '@/components/PublicSiteNav';

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setResetUrl('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      setSuccess(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-slate transition-colors dark:bg-gray-950 dark:text-gray-100">
      <PublicSiteNav />
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          <AuthBrandHeader subtitle="Reset your password." />

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="bg-pandan/10 border border-pandan/30 rounded-xl px-4 py-3 text-sm text-pandan">
                <p className="font-semibold mb-1">Check your email</p>
                <p className="text-gray-600">
                  If an account exists with that email, we've sent password reset instructions.
                </p>
              </div>

              {resetUrl && (
                <div className="bg-mamak/10 border border-mamak/30 rounded-xl px-4 py-3 text-sm">
                  <p className="font-semibold text-gray-700 mb-2">Development Mode</p>
                  <p className="text-gray-600 mb-2">Reset link (email not configured):</p>
                  <a
                    href={resetUrl}
                    className="text-sambal hover:underline break-all text-xs"
                  >
                    {resetUrl}
                  </a>
                </div>
              )}

              <Link
                href="/login"
                className="block text-center btn-cincai text-white font-bold py-3.5 rounded-xl text-sm"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6">
                Enter your email and we'll send you instructions to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-sambal font-semibold hover:underline">
                  Back to Login
                </Link>
              </div>
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
