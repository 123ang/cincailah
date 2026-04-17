'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateGroupClient() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newGroupId, setNewGroupId] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create group');
      }

      setNewGroupId(data.group.id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const addStarterPack = async () => {
    if (!newGroupId) return;
    setSeedLoading(true);
    try {
      await fetch('/api/groups/seed-starter-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: newGroupId }),
      });
      setSeedDone(true);
    } finally {
      setSeedLoading(false);
    }
  };

  const goToGroup = () => {
    if (newGroupId) router.push(`/group/${newGroupId}`);
  };

  if (newGroupId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-cream dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-5xl block mb-3">🎉</span>
            <h1 className="text-3xl font-black text-slate dark:text-white mb-2">Group Created!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your makan group is ready. Want a head start?
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
            {!seedDone ? (
              <>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">🍽️ Add Starter Pack?</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Get 25 curated KL/PJ restaurants added instantly — nasi lemak to ramen, all price ranges.
                  </p>
                </div>
                <button
                  onClick={addStarterPack}
                  disabled={seedLoading}
                  className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
                >
                  {seedLoading ? 'Adding restaurants…' : '🚀 Yes! Add 25 starter restaurants'}
                </button>
                <button
                  onClick={goToGroup}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold py-3 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Skip — I'll add my own
                </button>
              </>
            ) : (
              <>
                <div className="bg-pandan/10 border border-pandan rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-pandan mb-1">✅ 25 restaurants added!</p>
                  <p className="text-xs text-gray-500">You can edit, remove, or add more anytime.</p>
                </div>
                <button
                  onClick={goToGroup}
                  className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm"
                >
                  Let's Makan! 🍛
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream dark:bg-gray-950">
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
          <span className="text-5xl block mb-3">🍽️</span>
          <h1 className="text-3xl font-black text-slate dark:text-white mb-2">Create Makan Group</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Start a new lunch decision group</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2" htmlFor="group-name">
                Group Name
              </label>
              <input
                id="group-name"
                type="text"
                placeholder="e.g. Office Lunch Crew"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-2">
                You'll receive a unique Makan Code to share with your team
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
