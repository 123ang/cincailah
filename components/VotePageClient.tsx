'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fireConfetti } from '@/lib/confetti';
import { PRICE_LEVEL_HINT, PRICE_LEVEL_LABEL, priceLevelFromRange, tagsFromJson } from '@/lib/restaurant-meta';
import { ToastContainer, useToast } from '@/components/Toast';
import { useT } from '@/components/LocaleProvider';

interface Restaurant {
  id: string;
  name: string;
  cuisineTags: unknown;
  vibeTags: unknown;
  priceMin: number;
  priceMax: number;
  halal: boolean;
  vegOptions: boolean;
  area?: string;
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
  filters: Record<string, unknown>;
  initialDecisionId?: string | null;
}

const card = 'bg-white rounded-2xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700';

export default function VotePageClient({
  groupId,
  userId,
  filters,
  initialDecisionId = null,
}: VotePageClientProps) {
  const router = useRouter();
  const t = useT();
  const { toasts, toast, dismiss } = useToast();
  const [phase, setPhase] = useState<'start' | 'voting' | 'results'>(
    initialDecisionId ? 'voting' : 'start',
  );
  const [decisionId, setDecisionId] = useState<string | null>(initialDecisionId);
  const [options, setOptions] = useState<DecisionOption[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [tiedRestaurantIds, setTiedRestaurantIds] = useState<string[]>([]);
  const [canFinalize, setCanFinalize] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [voteUrl, setVoteUrl] = useState('');

  useEffect(() => {
    setVoteUrl(
      decisionId
        ? `${window.location.origin}/group/${groupId}/vote/${decisionId}`
        : `${window.location.origin}/group/${groupId}/vote`,
    );
  }, [decisionId, groupId]);

  const showResults = useCallback(() => {
    setPhase((current) => {
      if (current !== 'results') {
        try { fireConfetti(); } catch { /* ignore */ }
      }
      return 'results';
    });
  }, []);

  const fetchVoteData = useCallback(async (id?: string) => {
    const targetId = id || decisionId;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/vote/${targetId}`);
      let data = await res.json();

      if (res.ok) {
        if (data.isExpired && !data.winner) {
          const resolveRes = await fetch(`/api/vote/${targetId}/resolve`, {
            method: 'POST',
          });
          if (resolveRes.ok) {
            const resolved = await resolveRes.json();
            data = { ...data, winner: resolved.winner, tiedRestaurantIds: resolved.tiedRestaurantIds };
          }
        }

        setOptions(data.decision.decisionOptions);
        setExpiresAt(data.expiresAt);
        setIsExpired(data.isExpired);
        setWinner(data.winner);
        setTiedRestaurantIds(Array.isArray(data.tiedRestaurantIds) ? data.tiedRestaurantIds : []);
        setCanFinalize(Boolean(data.canFinalize));

        if (data.isExpired && data.winner) {
          showResults();
        }

        const votes: Record<string, string> = {};
        const selected = data.decision.decisionOptions.find((option: DecisionOption) =>
          option.votes.some((v) => v.user.id === userId && v.vote === 'yes')
        );
        if (selected) votes[selected.id] = 'yes';
        setMyVotes(votes);
      }
    } catch (err) {
      console.error('Fetch vote error:', err);
    }
  }, [decisionId, userId, showResults]);

  useEffect(() => {
    if (!initialDecisionId) return;
    fetchVoteData(initialDecisionId);
  }, [fetchVoteData, initialDecisionId]);

  // Timer countdown
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(t('Ended'));
        setIsExpired(true);
        return false;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      return true;
    };

    if (!tick()) {
      fetchVoteData();
      return;
    }
    const interval = setInterval(() => {
      if (!tick()) {
        clearInterval(interval);
        fetchVoteData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, fetchVoteData, t]);

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
      const sanitizedFilters =
        filters && typeof filters === 'object'
          ? Object.fromEntries(
              Object.entries(filters).filter(
                ([, v]) => v !== '' && v !== null && v !== undefined
              )
            )
          : undefined;

      const res = await fetch('/api/vote/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, filters: sanitizedFilters }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ? t(data.error) : t('Failed to start vote'));
      }

      setDecisionId(data.decisionId);
      setExpiresAt(data.expiresAt);
      await fetchVoteData(data.decisionId);
      setPhase('voting');
      router.replace(`/group/${groupId}/vote/${data.decisionId}`);
      toast(
        data.reused
          ? t('🗳️ Joined the live group vote.')
          : t('🗳️ Vote is live! Share the link so your group can vote.'),
        'info',
        8000,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to start vote'));
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!decisionId || isExpired) return;

    try {
      const res = await fetch(`/api/vote/${decisionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, vote: 'yes' }),
      });

      if (res.ok) {
        setMyVotes({ [optionId]: 'yes' });
        await fetchVoteData();
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  // Finalise button: skip the countdown and pick the result now.
  const finalizeVote = async () => {
    if (!decisionId) return;
    setFinalizing(true);
    try {
      const res = await fetch(`/api/vote/${decisionId}/finalize`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ? t(data.error) : t('Could not finalise vote'), 'error');
        return;
      }
      setConfirmFinalize(false);
      await fetchVoteData();
    } catch {
      toast(t('Could not finalise vote'), 'error');
    } finally {
      setFinalizing(false);
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
    const maxVotes = Math.max(...options.map(getVoteCount));
    const topOptions = options.filter((option) => getVoteCount(option) === maxVotes);
    return topOptions.length === 1 ? topOptions[0] : null;
  };

  if (phase === 'start') {
    return (
      <div className="max-w-md mx-auto px-4 pb-6">
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        <div className="pt-4 pb-2">
          <h1 className="text-2xl font-extrabold dark:text-white">⚔️ {t('We Fight Mode')}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('Vote once for your pick. Majority wins. No drama.')}
          </p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
            {error}
          </div>
        )}

        <div className={`mt-6 p-5 ${card}`}>
          <div className="text-center">
            <span className="text-5xl block mb-4">🗳️</span>
            <h2 className="text-xl font-black text-slate dark:text-white mb-2">{t('Start or Join Group Voting')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('We pick up to 5 spots from your filters. Everyone votes, majority wins!')}
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 mb-4 text-left">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>⏱️ {t('Voting window:')}</strong> {t('15 minutes')}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                <strong>📊 {t('How it works:')}</strong> {t('Pick one spot only; highest votes wins')}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                <strong>🎲 {t('Tie?')}</strong> {t('One of the tied spots is picked at random')}
              </p>
            </div>
            <button
              onClick={startVote}
              disabled={loading}
              className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? t('Starting...') : `${t('Start Voting')} 🚀`}
            </button>
          </div>
        </div>

        <Link
          href={`/group/${groupId}`}
          className="mt-4 block w-full text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-medium transition text-center"
        >
          ← {t('Back to decide')}
        </Link>
      </div>
    );
  }

  if (phase === 'results' && winner) {
    const tiedNames = options
      .filter((option) => tiedRestaurantIds.includes(option.restaurantId))
      .map((option) => option.restaurant.name);
    const level = priceLevelFromRange(winner.priceMin, winner.priceMax);
    const cuisineTags = tagsFromJson(winner.cuisineTags);
    const vibeTags = tagsFromJson(winner.vibeTags);

    return (
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="w-full animate-bounce-in">
            <p className="text-center text-sm text-gray-400 mb-4">
              {tiedNames.length > 1 ? `🎲 ${t('Tie broken at random!')}` : `🎉 ${t('The people have spoken!')}`}
            </p>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-pandan to-green-400 dark:from-green-900 dark:to-pandan flex items-center justify-center relative">
                <span className="text-7xl">👑</span>
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 rounded-full px-3 py-1 text-xs font-bold text-pandan dark:text-green-300">
                  {t('Winner!')}
                </div>
              </div>

              <div className="p-5">
                <h2 className="text-2xl font-black text-slate dark:text-white">{winner.name}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {cuisineTags.length > 0 ? cuisineTags.map((tag) => t(tag)).join(' · ') : t('Restaurant')}
                </p>

                {tiedNames.length > 1 && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    {t('{names} had the same number of votes, so one was picked at random.', {
                      names: tiedNames.join(', '),
                    })}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {winner.halal && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      ✅ {t('Halal')}
                    </span>
                  )}
                  {winner.vegOptions && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      🌱 {t('Veg')}
                    </span>
                  )}
                  {vibeTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {t(tag)}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">{t('Price')}</p>
                    <p className="text-sm font-bold text-slate dark:text-white mt-0.5">
                      {t(PRICE_LEVEL_LABEL[level])} <span className="text-xs font-medium text-gray-400">{PRICE_LEVEL_HINT[level]}</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">{t('Area')}</p>
                    <p className="text-sm font-bold text-slate dark:text-white mt-0.5 truncate">
                      {winner.area ? `📍 ${winner.area}` : '—'}
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
                      {t("Let's Go!")} 📍
                    </a>
                  ) : (
                    <button
                      onClick={() => router.push(`/group/${groupId}`)}
                      className="flex-1 bg-pandan hover:bg-pandan-dark text-white font-bold py-3 rounded-xl text-center text-sm transition"
                    >
                      {t('Confirmed!')} ✅
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/group/${groupId}`)}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-medium transition"
          >
            ← {t('Back to home')}
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
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-extrabold dark:text-white">⚔️ {t('We Fight Mode')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('Vote once for your pick')}</p>
      </div>

      {/* Timer */}
      <div className={`mt-4 p-4 flex items-center justify-between ${card}`}>
        <div>
          <p className="text-xs text-gray-400">
            {isExpired ? t('Voting ended') : t('Time remaining')}
          </p>
          <p
            className={`text-2xl font-black tabular-nums ${
              isExpired ? 'text-gray-400' : 'text-sambal dark:text-orange-300'
            }`}
          >
            {timeLeft}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{t('Votes cast')}</p>
          <p className="text-2xl font-black text-slate dark:text-white">{getTotalVotes()}</p>
        </div>
      </div>

      {/* Finalise: skip the countdown */}
      {!isExpired && (
        <div className="mt-3">
          {canFinalize ? (
            confirmFinalize ? (
              <div className={`p-3 ${card}`}>
                <p className="text-sm font-semibold text-slate dark:text-white">
                  {t('End voting now and show the result?')}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {t('Ties are broken at random.')}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfirmFinalize(false)}
                    disabled={finalizing}
                    className="rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {t('Keep voting')}
                  </button>
                  <button
                    onClick={finalizeVote}
                    disabled={finalizing}
                    className="btn-cincai rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {finalizing ? t('Finalising...') : t('Finalise now')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmFinalize(true)}
                className="w-full btn-cincai rounded-xl py-3 text-sm font-bold text-white"
              >
                🏁 {t('Finalise result now')}
              </button>
            )
          ) : (
            <p className="text-center text-xs text-gray-400">
              {t('The person who started the vote or the group owner can finalise early.')}
            </p>
          )}
        </div>
      )}

      {/* Vote Options */}
      <div className="mt-4 space-y-3">
        {options.map((option) => {
          const voteCount = getVoteCount(option);
          const percentage = getVotePercentage(option);
          const isLeading = leading?.id === option.id && getTotalVotes() > 0;
          const myVote = myVotes[option.id];
          const cuisineTags = tagsFromJson(option.restaurant.cuisineTags);
          const level = priceLevelFromRange(option.restaurant.priceMin, option.restaurant.priceMax);

          return (
            <div
              key={option.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm overflow-hidden transition ${
                isLeading ? 'border-pandan' : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-3xl">
                      {option.restaurant.halal
                        ? '🍛'
                        : cuisineTags.includes('Japanese')
                        ? '🍱'
                        : '🍽️'}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-sm dark:text-white">{option.restaurant.name}</p>
                      <p className="text-xs text-gray-400">
                        {cuisineTags.length > 0 ? cuisineTags.map((tag) => t(tag)).join(', ') : t('Restaurant')}
                        {' · '}
                        {t(PRICE_LEVEL_LABEL[level])}
                        {option.restaurant.area ? ` · ${option.restaurant.area}` : ''}
                      </p>
                    </div>
                  </div>
                  {!isExpired && (
                    <button
                      onClick={() =>
                        handleVote(option.id)
                      }
                      disabled={isExpired}
                      aria-pressed={myVote === 'yes'}
                      className={`w-16 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition disabled:opacity-50 ${
                        myVote === 'yes'
                          ? 'bg-pandan text-white shadow-md'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {myVote === 'yes' ? '✓' : t('Pick')}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLeading ? 'bg-pandan' : 'bg-mamak'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isLeading ? 'text-pandan' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {voteCount === 1 ? t('1 vote') : t('{count} votes', { count: voteCount })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Link */}
      <div className="mt-5 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-900">
        <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold mb-2">
          📤 {t('Share this vote with your group:')}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={voteUrl}
            readOnly
            aria-label={t('Vote link')}
            className="flex-1 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 dark:text-gray-300"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(voteUrl);
              toast(t('Link copied'), 'success', 2500);
            }}
            className="bg-mamak hover:bg-mamak-dark text-slate font-bold px-4 py-2 rounded-lg text-xs transition"
          >
            {t('Copy')}
          </button>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`🗳️ ${t('Vote now! Where shall we makan?')} ${voteUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold py-2 rounded-lg text-xs hover:bg-[#20bd5a] transition"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.833L.057 23.876a.5.5 0 0 0 .611.61l6.187-1.493A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.853 0-3.6-.498-5.107-1.365l-.34-.202-3.77.91.924-3.664-.22-.352A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          {t('Share on WhatsApp')}
        </a>
      </div>

      <button
        onClick={() => router.push(`/group/${groupId}`)}
        className="mt-6 w-full text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-medium transition text-center"
      >
        ← {t('Back to home')}
      </button>
    </div>
  );
}
