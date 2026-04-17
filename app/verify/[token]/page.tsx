'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params.token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setTimeout(() => router.push('/groups'), 3000);
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Verification failed');
        }
      } catch {
        setStatus('error');
        setErrorMessage('Something went wrong. Please try again.');
      }
    };

    void verify();
  }, [params.token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-mamak/20 to-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="text-6xl mb-6 animate-spin inline-block">⏳</div>
            <h1 className="text-2xl font-black text-slate mb-2">Verifying your email…</h1>
            <p className="text-gray-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-2xl font-black text-slate mb-2">Email Verified!</h1>
            <p className="text-gray-500 mb-6">
              Your email has been verified. Redirecting you now…
            </p>
            <Link
              href="/groups"
              className="btn-cincai text-white font-bold px-8 py-3 rounded-xl inline-block"
            >
              Go to My Groups
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">❌</div>
            <h1 className="text-2xl font-black text-slate mb-2">Verification Failed</h1>
            <p className="text-gray-500 mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setStatus('loading');
                  try {
                    const res = await fetch('/api/auth/send-verification', { method: 'POST' });
                    if (res.ok) {
                      setStatus('error');
                      setErrorMessage('A new verification email has been sent. Check your inbox.');
                    } else {
                      const d = await res.json();
                      setStatus('error');
                      setErrorMessage(d.error || 'Failed to resend. Are you logged in?');
                    }
                  } catch {
                    setStatus('error');
                    setErrorMessage('Failed to resend email.');
                  }
                }}
                className="w-full btn-cincai text-white font-bold py-3 rounded-xl"
              >
                Resend Verification Email
              </button>
              <Link
                href="/groups"
                className="block w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
              >
                Back to Groups
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
