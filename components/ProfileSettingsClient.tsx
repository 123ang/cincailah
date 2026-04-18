'use client';

import { useState } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  avatarUrl?: string | null;
}

interface Preferences {
  halal: boolean;
  vegOptions: boolean;
  defaultBudget: number;
  reminderEnabled?: boolean;
  reminderTimeLocal?: string;
  reminderTimezone?: string;
  reminderWeekdaysOnly?: boolean;
}

export default function ProfileSettingsClient({
  user,
  preferences: initialPrefs,
}: {
  user: User;
  preferences: Preferences;
}) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [reminder, setReminder] = useState({
    enabled: initialPrefs.reminderEnabled ?? false,
    reminderTimeLocal: initialPrefs.reminderTimeLocal ?? '11:45',
    timezone: initialPrefs.reminderTimezone ?? 'Asia/Kuala_Lumpur',
    weekdaysOnly: initialPrefs.reminderWeekdaysOnly ?? true,
  });
  const [reminderSaving, setReminderSaving] = useState(false);
  const [pushMsg, setPushMsg] = useState('');

  const handleAvatarChange = async (url: string | null) => {
    setAvatarUrl(url);
    try {
      await fetch('/api/user/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      });
    } catch {
      /* ignore — UI still shows new value */
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      const res = await fetch('/api/auth/send-verification', { method: 'POST' });
      const data = await res.json();
      setVerifyMsg(res.ok ? 'Verification email sent! Check your inbox.' : (data.error || 'Failed to send.'));
    } finally {
      setVerifyLoading(false);
    }
  };

  const saveReminder = async () => {
    setReminderSaving(true);
    setError('');
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminder),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save reminder');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setReminderSaving(false);
    }
  };

  const enableBrowserPush = async () => {
    try {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        setPushMsg('Push not supported in this browser.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushMsg('Notification permission not granted.');
        return;
      }
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        setPushMsg('Push key not configured yet (NEXT_PUBLIC_VAPID_PUBLIC_KEY).');
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const padded = vapid.padEnd(Math.ceil(vapid.length / 4) * 4, '=').replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(padded);
      const key = Uint8Array.from(raw, (c) => c.charCodeAt(0));
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      if (!res.ok) {
        const data = await res.json();
        setPushMsg(data.error || 'Failed to save push subscription');
        return;
      }
      setPushMsg('Browser push enabled.');
    } catch {
      setPushMsg('Unable to enable push. Configure VAPID key on server.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-mamak/20 to-cream">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/groups" className="flex items-center gap-2">
            <span className="text-xl">🍛</span>
            <span className="text-lg font-black text-slate">cincailah</span>
          </Link>
          <Link href="/groups" className="text-sm text-gray-500 hover:text-slate transition">
            ← My Groups
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate">Profile & Preferences</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your account and dietary defaults</p>
        </div>

        {/* Account info */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <ImageUpload
                type="avatar"
                value={avatarUrl}
                onChange={handleAvatarChange}
                label=""
                previewClassName="w-20 h-20 rounded-full"
              />
              <div>
                <p className="text-xs text-gray-400">Profile picture</p>
                <p className="text-xs text-gray-500 mt-0.5">JPEG / PNG / HEIC · max 50 MB</p>
                <p className="text-xs text-gray-400">Auto-resized to 400×400 WebP</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Display Name</p>
              <p className="font-semibold text-slate">{user.displayName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate">{user.email}</p>
                {user.emailVerified ? (
                  <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                    Unverified
                  </span>
                )}
              </div>
              {!user.emailVerified && (
                <div className="mt-2">
                  <button
                    onClick={handleResendVerification}
                    disabled={verifyLoading}
                    className="text-xs text-sambal hover:underline font-medium disabled:opacity-50"
                  >
                    {verifyLoading ? 'Sending…' : 'Resend verification email'}
                  </button>
                  {verifyMsg && <p className="text-xs text-gray-500 mt-1">{verifyMsg}</p>}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Dietary preferences */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Dietary Preferences
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            These defaults are applied automatically when you open the Decide page.
          </p>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
              <div>
                <p className="text-sm font-semibold">Halal only</p>
                <p className="text-xs text-gray-400">Only show halal-certified restaurants</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.halal}
                onChange={e => setPrefs(p => ({ ...p, halal: e.target.checked }))}
                className="w-5 h-5 accent-sambal"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
              <div>
                <p className="text-sm font-semibold">Vegetarian options</p>
                <p className="text-xs text-gray-400">Only show restaurants with veggie options</p>
              </div>
              <input
                type="checkbox"
                checked={prefs.vegOptions}
                onChange={e => setPrefs(p => ({ ...p, vegOptions: e.target.checked }))}
                className="w-5 h-5 accent-pandan"
              />
            </label>

            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">Default max budget</p>
                  <p className="text-xs text-gray-400">Filter restaurants below this price (RM)</p>
                </div>
                <span className="text-lg font-black text-sambal">RM {prefs.defaultBudget}</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={prefs.defaultBudget}
                onChange={e => setPrefs(p => ({ ...p, defaultBudget: Number(e.target.value) }))}
                className="w-full accent-sambal"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>RM5</span>
                <span>RM100</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-5 w-full btn-cincai text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Preferences'}
          </button>
        </section>

        {/* Lunch reminder */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Lunch Reminder
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Optional weekday reminder at your local time. Delivery uses email now, push later.
          </p>
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
            <div>
              <p className="text-sm font-semibold">Enable reminder</p>
              <p className="text-xs text-gray-400">Remind me around lunch time</p>
            </div>
            <input
              type="checkbox"
              checked={reminder.enabled}
              onChange={e => setReminder(r => ({ ...r, enabled: e.target.checked }))}
              className="w-5 h-5 accent-sambal"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <input
              type="time"
              value={reminder.reminderTimeLocal}
              onChange={e => setReminder(r => ({ ...r, reminderTimeLocal: e.target.value }))}
              className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
            />
            <input
              type="text"
              value={reminder.timezone}
              onChange={e => setReminder(r => ({ ...r, timezone: e.target.value }))}
              className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
              placeholder="Asia/Kuala_Lumpur"
            />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={reminder.weekdaysOnly}
              onChange={e => setReminder(r => ({ ...r, weekdaysOnly: e.target.checked }))}
              className="accent-sambal"
            />
            Weekdays only (Mon–Fri)
          </label>
          <button
            onClick={saveReminder}
            disabled={reminderSaving}
            className="mt-4 w-full bg-slate text-white font-bold py-2.5 rounded-xl disabled:opacity-50"
          >
            {reminderSaving ? 'Saving…' : 'Save Reminder'}
          </button>
          <button
            onClick={enableBrowserPush}
            type="button"
            className="mt-2 w-full border border-slate text-slate font-bold py-2.5 rounded-xl"
          >
            Enable Browser Push
          </button>
          {pushMsg && <p className="text-xs text-gray-500 mt-2">{pushMsg}</p>}
        </section>

        <div className="text-center">
          <Link href="/forgot-password" className="text-sm text-sambal hover:underline font-medium">
            Change password
          </Link>
        </div>
      </main>
    </div>
  );
}
