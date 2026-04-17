'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface Restaurant {
  id: string;
  name: string;
  cuisineTags: any;
  vibeTags: any;
  priceMin: number;
  priceMax: number;
  halal: boolean;
  vegOptions: boolean;
  walkMinutes: number;
  mapsUrl: string | null;
}

interface DecisionOption {
  id: string;
  restaurantId: string;
  restaurant: Restaurant;
  votes: {
    id: string;
    vote: string;
    user: {
      id: string;
      displayName: string;
    };
  }[];
}

interface VotePageClientProps {
  groupId: string;
  userId: string;
  displayName: string;
  filters: any;
}

export default function VotePageClient({
  groupId,
  userId,
  displayName,
  filters,
}: VotePageClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'start' | 'voting' | 'results'>('start');
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [options, setOptions] = useState<DecisionOption[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});

  // Timer countdown
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Ended');
        setIsExpired(true);
        clearInterval(interval);
        // Fetch results
        fetchVoteData();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Poll for updates every 3 seconds when voting
  useEffect(() => {
    if (phase !== 'voting' || !decisionId) return;

    const interval = setInterval(() => {
      fetchVoteData();
    }, 3000);

    return () => clearInterval(interval);
  }, [phase, decisionId]);

  const startVote = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vote/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, filters }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start vote');
      }

      setDecisionId(data.decisionId);
      setExpiresAt(data.expiresAt);
      await fetchVoteData(data.decisionId);
      setPhase('voting');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoteData = async (id?: string) => {
    const targetId = id || decisionId;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/vote/${targetId}`);
      const data = await res.json();

      if (res.ok) {
        setOptions(data.decision.decisionOptions);
        setExpiresAt(data.expiresAt);
        setIsExpired(data.isExpired);
        setWinner(data.winner);

        if (data.isExpired && data.winner) {
          setPhase('results');
        }

        // Track user's votes
        const votes: Record<string, string> = {};
        data.decision.decisionOptions.forEach((option: DecisionOption) => {
          const myVote = option.votes.find((v) => v.user.id === userId);
          if (myVote) {
            votes[option.id] = myVote.vote;
          }
        });
        setMyVotes(votes);
      }
    } catch (err) {
      console.error('Fetch vote error:', err);
    }
  };

  const handleVote = async (optionId: string, vote: 'yes' | 'no') => {
    if (!decisionId || isExpired) return;

    try {
      const res = await fetch(`/api/vote/${decisionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, vote }),
      });

      if (res.ok) {
        setMyVotes((prev) => ({ ...prev, [optionId]: vote }));
        await fetchVoteData();
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const getVoteCount = (option: DecisionOption) => {
    return option.votes.filter((v) => v.vote === 'yes').length;
  };

  const getTotalVotes = () => {
    const voters = new Set<string>();
    options.forEach((option) => {
      option.votes.forEach((v) => {
        if (v.vote === 'yes') voters.add(v.user.id);
      });
    });
    return voters.size;
  };

  const getVotePercentage = (option: DecisionOption) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return (getVoteCount(option) / total) * 100;
  };

  const getLeadingOption = () => {
    if (options.length === 0) return null;
    return options.reduce((max, option) =>
      getVoteCount(option) > getVoteCount(max) ? option : max
    );
  };

  if (phase === 'start') {
    return (
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="pt-4 pb-2">
          <h1 className="text-2xl font-extrabold">⚔️ We Fight Mode</h1>
          <p className="text-sm text-gray-400 mt-1">
            Vote for your pick. Majority wins. No drama.
          </p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-center">
            <span className="text-5xl block mb-4">🗳️</span>
            <h2 className="text-xl font-black text-slate mb-2">Start Group Voting</h2>
            <p className="text-sm text-gray-500 mb-4">
              We'll pick 3-5 restaurants based on your filters. Everyone votes, majority wins!
            </p>
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-left">
              <p className="text-xs text-amber-700">
                <strong>⏱️ Voting window:</strong> 15 minutes
              </p>
              <p className="text-xs text-amber-700 mt-1">
                <strong>📊 How it works:</strong> Pick your favorite(s), highest votes wins
              </p>
            </div>
            <button
              onClick={startVote}
              disabled={loading}
              className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Voting 🚀'}
            </button>
          </div>
        </div>

        <Link
          href={`/group/${groupId}`}
          className="mt-4 block w-full text-sm text-gray-400 hover:text-gray-600 font-medium transition text-center"
        >
          ← Back to decide
        </Link>
      </div>
    );
  }

  if (phase === 'results' && winner) {
    return (
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-full animate-bounce-in">
            <p className="text-center text-sm text-gray-400 mb-4">🎉 The people have spoken!</p>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-pandan to-green-400 flex items-center justify-center relative">
                <span className="text-7xl">👑</span>
                <div className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 text-xs font-bold text-pandan">
                  Winner!
                </div>
              </div>

              <div className="p-5">
                <h2 className="text-2xl font-black text-slate">{winner.name}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {Array.isArray(winner.cuisineTags) && winner.cuisineTags.length > 0
                    ? winner.cuisineTags.join(' · ')
                    : 'Restaurant'}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {winner.halal && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      ✅ Halal
                    </span>
                  )}
                  {winner.vegOptions && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      🌱 Veg
                    </span>
                  )}
                  {Array.isArray(winner.vibeTags) &&
                    winner.vibeTags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Budget</p>
                    <p className="text-sm font-bold text-slate mt-0.5">
                      {formatPrice(winner.priceMin, winner.priceMax)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Walk</p>
                    <p className="text-sm font-bold text-slate mt-0.5">
                      {winner.walkMinutes} min 🚶
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  {winner.mapsUrl ? (
                    <a
                      href={winner.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-pandan hover:bg-pandan-dark text-white font-bold py-3 rounded-xl text-center text-sm transition shadow-lg shadow-pandan/30"
                    >
                      Let's Go! 📍
                    </a>
                  ) : (
                    <button
                      onClick={() => router.push(`/group/${groupId}`)}
                      className="flex-1 bg-pandan hover:bg-pandan-dark text-white font-bold py-3 rounded-xl text-center text-sm transition"
                    >
                      Confirmed! ✅
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/group/${groupId}`)}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 font-medium transition"
          >
            ← Back to home
          </button>
        </div>

        <style jsx>{`
          @keyframes bounce-in {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-bounce-in {
            animation: bounce-in 0.6s ease-out;
          }
        `}</style>
      </div>
    );
  }

  const leading = getLeadingOption();

  return (
    <div className="max-w-md mx-auto px-4 pb-6">
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-extrabold">⚔️ We Fight Mode</h1>
        <p className="text-sm text-gray-400 mt-1">Vote for your favorites!</p>
      </div>

      {/* Timer */}
      <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">
            {isExpired ? 'Voting ended' : 'Time remaining'}
          </p>
          <p
            className={`text-2xl font-black tabular-nums ${
              isExpired ? 'text-gray-400' : 'text-sambal'
            }`}
          >
            {timeLeft}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Votes cast</p>
          <p className="text-2xl font-black text-slate">{getTotalVotes()}</p>
        </div>
      </div>

      {/* Vote Options */}
      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const voteCount = getVoteCount(option);
          const percentage = getVotePercentage(option);
          const isLeading = leading?.id === option.id && getTotalVotes() > 0;
          const myVote = myVotes[option.id];

          return (
            <div
              key={option.id}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition ${
                isLeading ? 'border-pandan' : 'border-gray-100'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-3xl">
                      {option.restaurant.halal
                        ? '🍛'
                        : Array.isArray(option.restaurant.cuisineTags) &&
                          option.restaurant.cuisineTags.includes('Japanese')
                        ? '🍱'
                        : '🍽️'}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{option.restaurant.name}</p>
                      <p className="text-xs text-gray-400">
                        {Array.isArray(option.restaurant.cuisineTags)
                          ? option.restaurant.cuisineTags.join(', ')
                          : 'Restaurant'}{' '}
                        · {formatPrice(option.restaurant.priceMin, option.restaurant.priceMax)} ·{' '}
                        {option.restaurant.walkMinutes} min
                      </p>
                    </div>
                  </div>
                  {!isExpired && (
                    <button
                      onClick={() =>
                        handleVote(option.id, myVote === 'yes' ? 'no' : 'yes')
                      }
                      disabled={isExpired}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition disabled:opacity-50 ${
                        myVote === 'yes'
                          ? 'bg-pandan text-white shadow-md'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      {myVote === 'yes' ? '✓' : '+'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLeading ? 'bg-pandan' : 'bg-mamak'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isLeading ? 'text-pandan' : 'text-gray-500'
                    }`}
                  >
                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Link */}
      <div className="mt-5 bg-amber-50 rounded-xl p-4 border border-amber-200">
        <p className="text-xs text-amber-700 font-semibold mb-2">
          📤 Share this link with your group:
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={`${window.location.origin}/group/${groupId}/vote`}
            readOnly
            className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-600"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/group/${groupId}/vote`
              );
            }}
            className="bg-mamak hover:bg-mamak-dark text-slate font-bold px-4 py-2 rounded-lg text-xs transition"
          >
            Copy
          </button>
        </div>
      </div>

      <button
        onClick={() => router.push(`/group/${groupId}`)}
        className="mt-6 w-full text-sm text-gray-400 hover:text-gray-600 font-medium transition text-center"
      >
        ← Back to home
      </button>
    </div>
  );
}
