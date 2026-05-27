'use client';

import Image from 'next/image';
import Link from 'next/link';
import { fireConfetti } from '@/lib/confetti';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FAVORITES_KEY,
  FavoriteSpot,
  FoodCategory,
  HISTORY_KEY,
  MAX_HISTORY,
  SOLO_CATEGORIES,
  SOLO_FOODS,
  SoloFood,
  SoloHistoryEntry,
} from '@/lib/soloData';
import { useLocalStorage } from '@/lib/useLocalStorage';
import MakanCodeInput from '@/components/MakanCodeInput';
import PublicSiteNav from '@/components/PublicSiteNav';

type Mode = 'food' | 'favorite' | 'category';

type Picked =
  | { kind: 'food'; item: SoloFood }
  | { kind: 'favorite'; item: FavoriteSpot }
  | { kind: 'empty'; message: string };

const SHUFFLE_DURATION_MS = 2800;
const SHUFFLE_TICK_MS = 80;

const soloWheelTokens = [
  { label: 'Malay', mark: '🍛', className: 'left-[55%] top-[11%]' },
  { label: 'Western', mark: '🍔', className: 'right-[11%] top-[39%]' },
  { label: 'Chinese', mark: '🥢', className: 'bottom-[17%] right-[23%]' },
  { label: 'Japan', mark: '🍣', className: 'bottom-[18%] left-[17%]' },
  { label: 'Indian', mark: '🫓', className: 'left-[10%] top-[39%]' },
];

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function SoloPage() {
  const [mode, setMode] = useState<Mode>('food');
  const [selectedCategories, setSelectedCategories] = useState<FoodCategory[]>([
    'Malay',
    'Chinese',
  ]);
  const [favorites, setFavorites] = useLocalStorage<FavoriteSpot[]>(
    FAVORITES_KEY,
    []
  );
  const [history, setHistory] = useLocalStorage<SoloHistoryEntry[]>(
    HISTORY_KEY,
    []
  );
  const [newFavName, setNewFavName] = useState('');
  const [newFavNote, setNewFavNote] = useState('');
  const [editingFavId, setEditingFavId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [picked, setPicked] = useState<Picked>({
    kind: 'food',
    item: SOLO_FOODS[0],
  });
  const [isShuffling, setIsShuffling] = useState(false);
  const [justWon, setJustWon] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload winner sound once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const a = new Audio('/sounds/winner.mp3');
    a.preload = 'auto';
    a.volume = 0.6;
    audioRef.current = a;
  }, []);

  // Clean up any running timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const currentPool = useMemo((): Picked[] => {
    if (mode === 'favorite') {
      return favorites.map((f) => ({ kind: 'favorite', item: f }));
    }
    if (mode === 'category') {
      return SOLO_FOODS.filter((f) =>
        selectedCategories.includes(f.category)
      ).map((f) => ({ kind: 'food', item: f }));
    }
    return SOLO_FOODS.map((f) => ({ kind: 'food', item: f }));
  }, [mode, favorites, selectedCategories]);

  const emptyMessage = useMemo(() => {
    if (mode === 'favorite') return 'No favorite spots yet — add one below ↓';
    if (mode === 'category') return 'Pick at least one category ↑';
    return 'No foods available';
  }, [mode]);

  const switchMode = (next: Mode) => {
    if (isShuffling) return;
    setMode(next);
    setJustWon(false);
    if (next === 'food') {
      setPicked({ kind: 'food', item: SOLO_FOODS[0] });
    } else if (next === 'favorite') {
      setPicked(
        favorites.length > 0
          ? { kind: 'favorite', item: favorites[0] }
          : { kind: 'empty', message: 'No favorite spots yet' }
      );
    } else {
      const pool = SOLO_FOODS.filter((f) =>
        selectedCategories.includes(f.category)
      );
      setPicked(
        pool.length > 0
          ? { kind: 'food', item: pool[0] }
          : { kind: 'empty', message: 'No foods in this category' }
      );
    }
  };

  const toggleCategory = (cat: FoodCategory) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat];
      if (mode === 'category') {
        const pool = SOLO_FOODS.filter((f) => next.includes(f.category));
        setPicked(
          pool.length > 0
            ? { kind: 'food', item: pool[0] }
            : { kind: 'empty', message: 'No foods in selected categories' }
        );
      }
      return next;
    });
  };

  const pickRandom = useCallback(
    (pool: Picked[]): Picked | null => {
      if (pool.length === 0) return null;
      // Avoid immediately repeating the same item if possible
      if (pool.length === 1) return pool[0];
      let next = pool[Math.floor(Math.random() * pool.length)];
      const currentId =
        picked.kind === 'food'
          ? picked.item.id
          : picked.kind === 'favorite'
            ? picked.item.id
            : null;
      let guard = 0;
      while (
        currentId !== null &&
        ((next.kind === 'food' && next.item.id === currentId) ||
          (next.kind === 'favorite' && next.item.id === currentId)) &&
        guard < 8
      ) {
        next = pool[Math.floor(Math.random() * pool.length)];
        guard++;
      }
      return next;
    },
    [picked]
  );

  const saveToHistory = (finalPick: Picked) => {
    if (finalPick.kind === 'empty') return;
    const entry: SoloHistoryEntry =
      finalPick.kind === 'food'
        ? {
            id: makeId(),
            name: finalPick.item.name,
            mode,
            category: finalPick.item.category,
            emoji: finalPick.item.emoji,
            time: Date.now(),
          }
        : {
            id: makeId(),
            name: finalPick.item.name,
            mode: 'favorite',
            category: null,
            time: Date.now(),
          };
    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
  };

  const celebrate = () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        void audioRef.current.play();
      }
    } catch {
      // autoplay can fail silently; user can still see the result
    }
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([80, 40, 140]);
      }
    } catch {
      // Some browsers throw on vibrate; safe to ignore
    }
    try { fireConfetti(); } catch { /* ignore */ }
    setJustWon(true);
    window.setTimeout(() => setJustWon(false), 1200);
  };

  const startShuffle = () => {
    if (isShuffling) return;
    if (mode === 'category' && selectedCategories.length === 0) {
      setPicked({
        kind: 'empty',
        message: 'Pick at least one category first',
      });
      return;
    }
    const pool = currentPool;
    if (pool.length === 0) {
      setPicked({ kind: 'empty', message: emptyMessage });
      return;
    }

    setIsShuffling(true);
    setJustWon(false);

    intervalRef.current = setInterval(() => {
      const flick = pool[Math.floor(Math.random() * pool.length)];
      setPicked(flick);
    }, SHUFFLE_TICK_MS);

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const finalPick = pickRandom(pool) ?? pool[0];
      setPicked(finalPick);
      setIsShuffling(false);
      saveToHistory(finalPick);
      celebrate();
    }, SHUFFLE_DURATION_MS);
  };

  const rerollQuick = () => {
    if (isShuffling) return;
    const pool = currentPool;
    const next = pickRandom(pool);
    if (next) {
      setPicked(next);
      setJustWon(false);
    }
  };

  const cancelFavoriteEdit = () => {
    setEditingFavId(null);
    setNewFavName('');
    setNewFavNote('');
  };

  const beginEditFavorite = (f: FavoriteSpot) => {
    setEditingFavId(f.id);
    setNewFavName(f.name);
    setNewFavNote(f.note ?? '');
    setShowFavorites(true);
  };

  const saveFavorite = () => {
    const name = newFavName.trim();
    if (!name) return;
    if (editingFavId) {
      setFavorites((prev) =>
        prev.map((f) =>
          f.id === editingFavId
            ? {
                ...f,
                name,
                note: newFavNote.trim() || undefined,
              }
            : f
        )
      );
      setEditingFavId(null);
    } else {
      const fav: FavoriteSpot = {
        id: makeId(),
        name,
        note: newFavNote.trim() || undefined,
        createdAt: Date.now(),
      };
      setFavorites((prev) => [fav, ...prev]);
    }
    setNewFavName('');
    setNewFavNote('');
  };

  const deleteFavorite = (id: string) => {
    if (editingFavId === id) cancelFavoriteEdit();
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const clearHistory = () => {
    if (!confirm('Clear all solo history?')) return;
    setHistory([]);
  };

  const pickedImage =
    picked.kind === 'food' ? picked.item.image : null;
  const pickedName =
    picked.kind === 'empty'
      ? picked.message
      : picked.kind === 'food'
        ? picked.item.name
        : picked.item.name;
  const pickedCategory =
    picked.kind === 'food' ? picked.item.category : null;
  const pickedNote =
    picked.kind === 'favorite' ? picked.item.note : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-sambal/10 to-cream transition-colors dark:from-gray-950 dark:via-sambal/10 dark:to-gray-950 dark:text-gray-100">
      <PublicSiteNav />

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <section
          className={`relative mb-8 overflow-hidden rounded-[2rem] bg-sambal p-5 pt-6 text-white shadow-2xl shadow-sambal/20 transition-transform ${
            justWon ? 'scale-[1.01]' : ''
          }`}
        >
          <div className="pointer-events-none absolute -right-36 top-24 h-80 w-80 rotate-[-24deg] rounded-full border-[34px] border-white/70 border-l-transparent" />
          <div className="pointer-events-none absolute -left-16 bottom-28 h-36 w-36 rounded-full bg-white/10" />

          <div className="relative z-[1]">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]">
                Solo food roulette
              </span>
              <button
                onClick={startShuffle}
                disabled={isShuffling}
                className="rounded-full bg-white px-4 py-2 text-xs font-black text-sambal shadow-lg shadow-slate/10 transition hover:scale-[1.03] disabled:opacity-60"
              >
                {isShuffling ? 'Spinning...' : 'Spin again'}
              </button>
            </div>

            <div className="mt-6 max-w-sm">
              <h1 className="text-5xl font-black leading-[0.9] tracking-tight">
                Spin once. Go makan.
              </h1>
              <p className="mt-4 text-sm font-bold leading-6 text-white/80 md:text-base">
                No account. No group. The wheel lands and tells you the answer right here.
              </p>
            </div>

            <div className="relative mx-auto mt-8 h-72 w-72 max-w-full">
              <div className={`${isShuffling ? 'needle-tick' : ''} absolute left-1/2 top-[-0.45rem] z-[4] h-16 w-10 -translate-x-1/2 drop-shadow-lg`}>
                <div className="h-full w-full rounded-2xl bg-white [clip-path:polygon(50%_100%,8%_12%,92%_12%)]" />
                <div className="absolute left-1/2 top-5 h-3 w-3 -translate-x-1/2 rounded-full bg-sambal" />
              </div>

              <div
                key={`${pickedName}-${isShuffling ? 'spinning' : 'landed'}`}
                className={`absolute inset-0 rounded-full border-[10px] border-white bg-[conic-gradient(from_-30deg,#ffc233_0deg_60deg,#ff5a00_60deg_120deg,#e9321b_120deg_180deg,#6d2cb7_180deg_240deg,#078bce_240deg_300deg,#45b619_300deg_360deg)] shadow-2xl shadow-black/25 ${
                  isShuffling ? 'logo-preview-wheel' : ''
                }`}
              >
                <div className="absolute inset-0 rounded-full bg-[repeating-conic-gradient(from_-30deg,transparent_0deg_58deg,rgba(255,255,255,.82)_58deg_60deg)]" />
                <div className="absolute inset-[28%] rounded-full border-[18px] border-white/95 bg-transparent" />
                {pickedImage && picked.kind !== 'empty' ? (
                  <Image
                    src={pickedImage}
                    alt=""
                    width={96}
                    height={96}
                    className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-white object-cover shadow-lg"
                    priority
                  />
                ) : (
                  <Image
                    src="/brand/cincailah-logo.jpeg"
                    alt=""
                    width={96}
                    height={96}
                    className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-white object-cover shadow-lg"
                    priority
                  />
                )}
                {soloWheelTokens.map((token) => (
                  <span
                    key={token.label}
                    aria-label={token.label}
                    className={`absolute flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white/90 text-lg shadow-lg ${token.className}`}
                  >
                    {token.mark}
                  </span>
                ))}
              </div>
            </div>

            <div className="-mt-9 rounded-[1.6rem] bg-white/95 p-4 text-slate shadow-2xl shadow-black/20 backdrop-blur dark:bg-gray-950/95 dark:text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sambal">
                The needle says
              </p>
              <div className="mt-1 text-3xl font-black leading-tight tracking-[-0.02em]">
                {pickedName}
              </div>
              {pickedCategory && (
                <div className="mt-1 text-xs font-black uppercase tracking-wider text-sambal">
                  {pickedCategory}
                </div>
              )}
              {pickedNote && (
                <div className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-300">{pickedNote}</div>
              )}
              {picked.kind !== 'empty' && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={startShuffle}
                    disabled={isShuffling}
                    className="rounded-2xl bg-pandan px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-pandan/20 transition hover:scale-[1.02] disabled:opacity-60"
                  >
                    {isShuffling ? 'Spinning...' : 'Spin again'}
                  </button>
                  <button
                    onClick={rerollQuick}
                    disabled={isShuffling || currentPool.length === 0}
                    className="rounded-2xl bg-slate/10 px-4 py-3 text-center text-sm font-black text-slate transition hover:bg-slate/15 disabled:opacity-60 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  >
                    Not this
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-3xl border border-sambal/10 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3">
            <h2 className="text-base font-black text-slate dark:text-white">Tune the roulette</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
              Leave this alone for pure cincai mode.
            </p>
          </div>
          <div className="mb-4 flex gap-1 rounded-2xl bg-cream p-1.5 dark:bg-gray-950">
            {(
              [
                { key: 'food', label: 'Spin' },
                { key: 'favorite', label: 'Favorites' },
                { key: 'category', label: 'Category' },
              ] as { key: Mode; label: string }[]
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => switchMode(m.key)}
                disabled={isShuffling}
                className={`flex-1 rounded-xl py-2.5 text-sm font-black transition ${
                  mode === m.key
                    ? 'bg-sambal text-white shadow-sm'
                    : 'text-gray-500 hover:bg-white dark:text-gray-300 dark:hover:bg-white/10'
                } disabled:opacity-60`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'category' && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  Pick your cuisines
                </span>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs font-semibold text-sambal hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SOLO_CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                        active
                          ? 'bg-sambal text-white'
                          : 'bg-cream text-gray-700 hover:bg-sambal-soft dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Favorites manager */}
        <section className="mb-4 rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setShowFavorites((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="font-bold text-slate dark:text-white">
              ❤️ My Favorite Spots
              <span className="ml-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                {favorites.length}
              </span>
            </span>
            <span className="text-gray-400 text-sm dark:text-gray-500">
              {showFavorites ? 'Hide' : 'Manage'}
            </span>
          </button>

          {showFavorites && (
            <div className="space-y-3 border-t border-gray-100 px-5 pb-5 pt-4 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newFavName}
                  onChange={(e) => setNewFavName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveFavorite()}
                  placeholder="Restaurant / spot name"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-sambal focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
                <input
                  value={newFavNote}
                  onChange={(e) => setNewFavNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveFavorite()}
                  placeholder="Note (optional)"
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-sambal focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white sm:w-48"
                />
                <button
                  onClick={saveFavorite}
                  disabled={!newFavName.trim()}
                  className="btn-cincai text-white font-bold px-4 py-2.5 rounded-xl disabled:opacity-50"
                >
                  {editingFavId ? 'Save' : 'Add'}
                </button>
                {editingFavId && (
                  <button
                    type="button"
                    onClick={cancelFavoriteEdit}
                    className="px-2 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {favorites.length === 0 ? (
                <p className="py-3 text-center text-sm text-gray-400 dark:text-gray-500">
                  No favorites yet. Add your regular spots above.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {favorites.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold dark:text-white">
                          {f.name}
                        </div>
                        {f.note && (
                          <div className="truncate text-xs text-gray-400 dark:text-gray-500">
                            {f.note}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => beginEditFavorite(f)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sambal hover:bg-red-50 dark:hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFavorite(f.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-white/10"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* History */}
        <section className="mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="font-bold text-slate dark:text-white">
              🕐 Recent Picks
              <span className="ml-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                {history.length}
              </span>
            </span>
            <span className="text-gray-400 text-sm dark:text-gray-500">
              {showHistory ? 'Hide' : 'Show'}
            </span>
          </button>

          {showHistory && (
            <div className="border-t border-gray-100 px-5 pb-5 pt-4 dark:border-gray-800">
              {history.length === 0 ? (
                <p className="py-3 text-center text-sm text-gray-400 dark:text-gray-500">
                  No picks yet — spin above to get started!
                </p>
              ) : (
                <>
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {history.map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-lg">{h.emoji ?? '📍'}</span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold dark:text-white">
                              {h.name}
                            </div>
                            <div className="text-[11px] text-gray-400 dark:text-gray-500">
                              {new Date(h.time).toLocaleString()}
                              {h.category ? ` · ${h.category}` : ''}
                              {h.mode === 'favorite' ? ' · Favorite' : ''}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={clearHistory}
                    className="mt-3 text-xs font-semibold text-red-600 hover:underline dark:text-red-300"
                  >
                    Clear history
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* Makan Code quick-join */}
        <div className="mb-4">
          <MakanCodeInput variant="compact" />
        </div>

        {/* Upsell */}
        <div className="brand-card text-white rounded-3xl p-6 text-center shadow-md">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-black text-xl mb-1">
            Deciding with your crew?
          </h3>
          <p className="text-sm opacity-90 mb-4">
            Create a Makan group and let everyone vote — or spin together.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-sambal font-black px-6 py-3 rounded-2xl shadow hover:shadow-lg transition"
          >
            Create free account →
          </Link>
        </div>
      </main>

      <style jsx>{`
        .logo-preview-wheel {
          animation: solo-logo-spin 2.45s cubic-bezier(0.13, 0.9, 0.22, 1) both;
        }

        .needle-tick {
          animation: solo-needle-tick 0.16s steps(2, end) 0s 14 alternate;
        }

        @keyframes solo-logo-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(1578deg);
          }
        }

        @keyframes solo-needle-tick {
          from {
            transform: translateX(-50%) rotate(-5deg);
          }
          to {
            transform: translateX(-50%) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}
