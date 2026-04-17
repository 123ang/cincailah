'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinGroupClient() {
  const router = useRouter();
  const [makanCode, setMakanCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!makanCode.trim()) {
      setError('Makan Code is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makanCode: makanCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join group');
      }

      router.push(`/group/${data.group.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sambal mb-6 font-semibold"
        >
          ← Back to My Groups
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">🤝</span>
          <h1 className="text-3xl font-black text-slate mb-2">Join Makan Group</h1>
          <p className="text-gray-500 text-sm">Enter the Makan Code to join</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Makan Code
              </label>
              <input
                type="text"
                placeholder="e.g. ABC123"
                value={makanCode}
                onChange={(e) => setMakanCode(e.target.value.toUpperCase())}
                disabled={loading}
                maxLength={6}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-center text-lg tracking-widest focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-2">
                Ask your group admin for the 6-character code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
