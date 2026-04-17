'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { fireConfetti } from '@/lib/confetti';
import { ToastContainer, useToast } from '@/components/Toast';

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
  const { toasts, toast, dismiss } = useToast();
  const [phase, setPhase] = useState<'start' | 'voting' | 'results'>('start');
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [options, setOptions] = useState<DecisionOption[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [fateWinner, setFateWinner] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});

  const fetchVoteData = useCallback(async (id?: string) => {
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
          try { fireConfetti(); } catch { /* ignore */ }
        }

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
  }, [decisionId, userId]);

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
        fetchVoteData();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, fetchVoteData]);

  // Poll for updates every 3 seconds when voting
  useEffect(() => {
    if (phase !== 'voting' || !decisionId) return;

    const interval = setInterval(() => {
      fetchVoteData();
    }, 3000);

    return () => clearInterval(interval);
  }, [phase, decisionId, fetchVoteData]);

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
      toast('🗳️ Vote is live! Share the link so your group can vote.', 'info', 8000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
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

  const isTie =
    phase === 'results' &&
    !winner &&
    options.length > 1 &&
    options.every(o => getVoteCount(o) === getVoteCount(options[0]));

  const letFateDecide = () => {
    const opts = options.filter(o => getVoteCount(o) === getVoteCount(options[0]));
    setFateWinner(opts[Math.floor(Math.random() * opts.length)].restaurant);
  };

  if (isTie && !fateWinner) {
    return (
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="text-7xl mb-4 animate-bounce">🪙</div>
          <h2 className="text-2xl font-black text-slate mb-2">It&apos;s a tie!</h2>
          <p className="text-gray-500 mb-8">
            {options.filter(o => getVoteCount(o) === getVoteCount(options[0])).length} options are tied.
            Let fate break the deadlock!
          </p>
          <button
            onClick={letFateDecide}
            className="btn-cincai text-white font-black px-10 py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition transform hover:scale-105"
          >
            🎲 Let Fate Decide!
          </button>
          <button
            onClick={() => router.push(`/group/${groupId}`)}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 font-medium transition"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results' && (winner || fateWinner)) {
    const finalWinner = fateWinner ?? winner!;
    return (
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-full animate-bounce-in">
            <p className="text-center text-sm text-gray-400 mb-4">
              {fateWinner ? '🎲 Fate has spoken!' : '🎉 The people have spoken!'}
            </p>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-pandan to-green-400 flex items-center justify-center relative">
                <span className="text-7xl">👑</span>
                <div className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 text-xs font-bold text-pandan">
                  Winner!
                </div>
              </div>

              <div className="p-5">
                <h2 className="text-2xl font-black text-slate">{finalWinner.name}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {Array.isArray(finalWinner.cuisineTags) && finalWinner.cuisineTags.length > 0
                    ? finalWinner.cuisineTags.join(' · ')
                    : 'Restaurant'}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {finalWinner.halal && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      ✅ Halal
                    </span>
                  )}
                  {finalWinner.vegOptions && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      🌱 Veg
                    </span>
                  )}
                  {Array.isArray(finalWinner.vibeTags) &&
                    finalWinner.vibeTags.slice(0, 3).map((tag: string) => (
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
                      {formatPrice(finalWinner.priceMin, finalWinner.priceMax)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Walk</p>
                    <p className="text-sm font-bold text-slate mt-0.5">
                      {finalWinner.walkMinutes} min 🚶
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  {finalWinner.mapsUrl ? (
                    <a
                      href={finalWinner.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-pandan hover:bg-pandan-dark text-white font-bold py-3 rounded-xl text-center text-sm transition shadow-lg shadow-pandan/30"
                    >
                      Let&apos;s Go! 📍
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
          📤 Share this vote with your group:
        </p>
        <div className="flex items-center gap-2 mb-2">
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
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`🗳️ Vote now! Where shall we makan? ${window.location.origin}/group/${groupId}/vote`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold py-2 rounded-lg text-xs hover:bg-[#20bd5a] transition"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.833L.057 23.876a.5.5 0 0 0 .611.61l6.187-1.493A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.6-.498-5.107-1.365l-.34-.202-3.77.91.924-3.664-.22-.352A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          Share on WhatsApp
        </a>
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
