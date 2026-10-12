'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useT } from '@/components/LocaleProvider';

interface Restaurant {
  id: string;
  name: string;
}

interface Decision {
  id: string;
  decisionDate: Date;
  modeUsed: string;
  createdAt: Date;
  chosenRestaurant: Restaurant | null;
  creator: {
    displayName: string;
  };
}

interface TopRestaurant extends Restaurant {
  count: number;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; displayName: string };
}

function CommentThread({ decisionId }: { decisionId: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    if (loaded) { setOpen(o => !o); return; }
    const res = await fetch(`/api/comments?decisionId=${decisionId}`);
    const data = await res.json();
    if (res.ok) setComments(data.comments ?? []);
    setLoaded(true);
    setOpen(true);
  };

  useEffect(() => {
    if (!open || !loaded) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/comments?decisionId=${decisionId}`);
      const data = await res.json();
      if (res.ok) setComments(data.comments ?? []);
    }, 5000);
    return () => clearInterval(interval);
  }, [open, loaded, decisionId]);

  const post = async () => {
    if (!body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId, body }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [...prev, data.comment]);
        setBody('');
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-2 border-t border-gray-50 pt-2 dark:border-gray-700">
      <button
        onClick={load}
        className="text-xs text-gray-400 hover:text-sambal transition font-medium"
      >
        💬 {open ? t('Hide') : t('Comments')}
        {loaded && comments.length > 0 && ` (${comments.length})`}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {comments.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2 dark:bg-gray-900/60">
              <p className="text-xs font-semibold text-slate dark:text-white">{c.user.displayName}</p>
              <p className="text-xs text-gray-600 mt-0.5 dark:text-gray-300">{c.body}</p>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && void post()}
              placeholder={t('Add a comment…')}
              maxLength={500}
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-sambal/30 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
            <button
              onClick={post}
              disabled={posting || !body.trim()}
              className="text-xs font-bold text-white bg-sambal px-3 py-2 rounded-lg disabled:opacity-40"
            >
              {posting ? '…' : t('Send')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DayOfWeekChart({ decisions }: { decisions: Decision[] }) {
  const t = useT();
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = Array(7).fill(0);
  decisions.forEach(d => {
    const day = new Date(d.decisionDate).getDay(); // 0=Sun
    const idx = day === 0 ? 6 : day - 1; // shift to Mon=0
    counts[idx]++;
  });
  const max = Math.max(...counts, 1);
  const barColors = ['#3B82F6', '#45B619', '#45B619', '#45B619', '#45B619', '#FFC233', '#EF4444'];

  return (
    <div className="flex items-end gap-2 h-24" aria-label={t('Picks by day of week chart')}>
      {DAYS.map((day, i) => {
        const pct = counts[i] / max;
        const height = Math.max(pct * 72, counts[i] > 0 ? 8 : 2);
        return (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-gray-500">{counts[i] > 0 ? counts[i] : ''}</span>
            <div
              className="w-full rounded-t-md transition-all"
              style={{ height: `${height}px`, backgroundColor: barColors[i] }}
              role="img"
              aria-label={`${t(day)}: ${counts[i]}`}
            />
            <span className="text-[10px] text-gray-400">{t(day)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function HistoryPage({
  decisions,
  totalDecisions,
  restaurantsCount,
  topRestaurants,
  groupId,
}: {
  decisions: Decision[];
  totalDecisions: number;
  restaurantsCount: number;
  topRestaurants: TopRestaurant[];
  groupId: string;
}) {
  const t = useT();
  const getDayLabel = (date: Date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return t(days[new Date(date).getDay()]);
  };

  const getDayColor = (date: Date) => {
    const day = new Date(date).getDay();
    const colors = [
      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300',
      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-sambal/10 text-sambal dark:text-orange-300',
      'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300',
    ];
    return colors[day];
  };

  const getEmoji = (index: number) => {
    const emojis = ['🍛', '🍜', '🍱'];
    return emojis[index] || '🍽️';
  };

  // Streak calculation: consecutive days with decisions
  const sortedDates = decisions
    .map(d => new Date(d.decisionDate).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (sortedDates[i] === expected.toDateString()) {
      streak++;
    } else {
      break;
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pb-6">
      <div className="pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold dark:text-white">{t('Makan History')} 📊</h1>
          <p className="text-sm text-gray-400 mt-1">{t('Past decisions for your group')}</p>
        </div>
        <Link
          href={`/group/${groupId}/activity`}
          className="text-xs text-sambal font-bold border border-sambal px-3 py-1 rounded-lg hover:bg-sambal hover:text-white transition"
        >
          {t('Activity')} →
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <p className="text-2xl font-black text-sambal">{totalDecisions}</p>
          <p className="text-xs text-gray-400 mt-1">{t('Total')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <p className="text-2xl font-black text-mamak-dark">{restaurantsCount}</p>
          <p className="text-xs text-gray-400 mt-1">{t('Spots')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <p className="text-2xl font-black text-pandan">{streak}</p>
          <p className="text-xs text-gray-400 mt-1">🔥 {t('Streak')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <p className="text-2xl font-black text-blue-500">&lt;30s</p>
          <p className="text-xs text-gray-400 mt-1">{t('Speed')}</p>
        </div>
      </div>

      {/* Top Picked */}
      {topRestaurants.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            🏆 {t('Most Picked')}
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
            {topRestaurants.map((restaurant, index) => (
              <div
                key={restaurant.id}
                className={`flex items-center gap-3 p-3 ${
                  index < topRestaurants.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''
                }`}
              >
                <span
                  className={`text-sm font-black w-6 text-center ${
                    index === 0 ? 'text-mamak-dark' : 'text-gray-400'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-xl">{getEmoji(index)}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold dark:text-white">{restaurant.name}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    index === 0
                      ? 'bg-sambal/10 text-sambal'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {restaurant.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Picks by Day of Week Chart */}
      {decisions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            📈 {t('Picks by Day')}
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700 p-4">
            <DayOfWeekChart decisions={decisions} />
          </div>
        </div>
      )}

      {/* Timeline */}
      {decisions.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            📅 {t('Recent Picks')}
          </h2>
          <div className="space-y-2">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDayColor(
                        decision.decisionDate
                      )}`}
                    >
                      <span className="text-xs font-black">
                        {getDayLabel(decision.decisionDate)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm dark:text-white">
                        {decision.chosenRestaurant?.name || t('No result')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {decision.modeUsed === 'you_pick' ? t('You Pick') : t('We Fight')} ·{' '}
                        {t('by {name}', { name: decision.creator.displayName })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(new Date(decision.createdAt), t)}</span>
                </div>
                <CommentThread decisionId={decision.id} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center py-12">
          <span className="text-5xl block mb-4">📊</span>
          <p className="text-gray-500 dark:text-gray-300 font-semibold">{t('No history yet')}</p>
          <p className="text-sm text-gray-400 mt-1">
            {t('Make your first decision to see it here!')}
          </p>
        </div>
      )}
    </div>
  );
}
