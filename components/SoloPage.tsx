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

type Mode = 'food' | 'favorite' | 'category';

type Picked =
  | { kind: 'food'; item: SoloFood }
  | { kind: 'favorite'; item: FavoriteSpot }
  | { kind: 'empty'; message: string };

const SHUFFLE_DURATION_MS = 2800;
const SHUFFLE_TICK_MS = 80;

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

  const addFavorite = () => {
    const name = newFavName.trim();
    if (!name) return;
    const fav: FavoriteSpot = {
      id: makeId(),
      name,
      note: newFavNote.trim() || undefined,
      createdAt: Date.now(),
    };
    setFavorites((prev) => [fav, ...prev]);
    setNewFavName('');
    setNewFavNote('');
  };

  const deleteFavorite = (id: string) => {
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
  const pickedEmoji =
    picked.kind === 'food'
      ? picked.item.emoji
      : picked.kind === 'favorite'
        ? '📍'
        : '🤔';
  const pickedCategory =
    picked.kind === 'food' ? picked.item.category : null;
  const pickedNote =
    picked.kind === 'favorite' ? picked.item.note : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-mamak/10 to-cream">
      {/* Top bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍛</span>
            <span className="text-lg font-black text-slate">cincailah</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-600 hover:text-sambal px-3 py-1.5"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="btn-cincai text-white font-bold text-sm px-4 py-2 rounded-xl"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-slate">
            Decide for Yourself 🍽️
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            No account. No group. Just spin and makan.
          </p>
        </header>

        {/* Mode toggle */}
        <div className="bg-white rounded-2xl p-1.5 flex gap-1 border border-gray-200 shadow-sm mb-4">
          {(
            [
              { key: 'food', label: '🎲 Spin Food' },
              { key: 'favorite', label: '❤️ Favorites' },
              { key: 'category', label: '🏷️ Category' },
            ] as { key: Mode; label: string }[]
          ).map((m) => (
            <button
              key={m.key}
              onClick={() => switchMode(m.key)}
              disabled={isShuffling}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                mode === m.key
                  ? 'bg-sambal text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              } disabled:opacity-60`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Category selector */}
        {mode === 'category' && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">
                Pick your cuisines
              </span>
              <button
                onClick={() => setSelectedCategories([])}
                className="text-xs text-sambal font-semibold hover:underline"
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
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                      active
                        ? 'bg-sambal text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Winner card */}
        <div
          className={`relative bg-white rounded-3xl border shadow-sm overflow-hidden mb-4 transition-transform ${
            justWon ? 'scale-[1.02] border-sambal' : 'border-gray-200'
          }`}
        >
          <div className="relative aspect-[4/3] bg-gradient-to-br from-mamak/30 to-cream">
            {pickedImage && picked.kind !== 'empty' ? (
              <Image
                src={pickedImage}
                alt={pickedName}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className={`object-cover transition-opacity ${
                  isShuffling ? 'opacity-60' : 'opacity-100'
                }`}
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl">
                {pickedEmoji}
              </div>
            )}

            {isShuffling && (
              <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                Shuffling…
              </div>
            )}
            {justWon && !isShuffling && (
              <div className="absolute top-3 left-3 bg-pandan text-white text-xs font-black px-3 py-1.5 rounded-full shadow">
                🎉 Winner!
              </div>
            )}
          </div>

          <div className="p-5 text-center">
            <div className="text-2xl md:text-3xl font-black text-slate">
              {pickedName}
            </div>
            {pickedCategory && (
              <div className="mt-1 text-xs font-bold text-sambal uppercase tracking-wider">
                {pickedCategory}
              </div>
            )}
            {pickedNote && (
              <div className="mt-1 text-sm text-gray-500">{pickedNote}</div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mb-8">
          <button
            onClick={startShuffle}
            disabled={isShuffling}
            className="btn-cincai text-white font-black text-lg py-4 rounded-2xl disabled:opacity-60"
          >
            {isShuffling ? 'Shuffling…' : 'Decide for me 🎲'}
          </button>
          <button
            onClick={rerollQuick}
            disabled={isShuffling || currentPool.length === 0}
            className="bg-white border-2 border-gray-200 text-slate font-bold py-3 rounded-2xl hover:bg-gray-50 disabled:opacity-60"
          >
            Not this 🙅 Try another
          </button>
        </div>

        {/* Favorites manager */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
          <button
            onClick={() => setShowFavorites((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="font-bold text-slate">
              ❤️ My Favorite Spots
              <span className="ml-2 text-xs font-semibold text-gray-400">
                {favorites.length}
              </span>
            </span>
            <span className="text-gray-400 text-sm">
              {showFavorites ? 'Hide' : 'Manage'}
            </span>
          </button>

          {showFavorites && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newFavName}
                  onChange={(e) => setNewFavName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFavorite()}
                  placeholder="Restaurant / spot name"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sambal"
                />
                <input
                  value={newFavNote}
                  onChange={(e) => setNewFavNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addFavorite()}
                  placeholder="Note (optional)"
                  className="sm:w-48 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sambal"
                />
                <button
                  onClick={addFavorite}
                  disabled={!newFavName.trim()}
                  className="btn-cincai text-white font-bold px-4 py-2.5 rounded-xl disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              {favorites.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">
                  No favorites yet. Add your regular spots above.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {favorites.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {f.name}
                        </div>
                        {f.note && (
                          <div className="text-xs text-gray-400 truncate">
                            {f.note}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteFavorite(f.id)}
                        className="text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* History */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="font-bold text-slate">
              🕐 Recent Picks
              <span className="ml-2 text-xs font-semibold text-gray-400">
                {history.length}
              </span>
            </span>
            <span className="text-gray-400 text-sm">
              {showHistory ? 'Hide' : 'Show'}
            </span>
          </button>

          {showHistory && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-4">
              {history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">
                  No picks yet — spin above to get started!
                </p>
              ) : (
                <>
                  <ul className="divide-y divide-gray-100">
                    {history.map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-lg">{h.emoji ?? '📍'}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">
                              {h.name}
                            </div>
                            <div className="text-[11px] text-gray-400">
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
                    className="mt-3 text-xs font-semibold text-red-600 hover:underline"
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
        <div className="bg-gradient-to-r from-sambal to-sambal/90 text-white rounded-3xl p-6 text-center shadow-md">
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
    </div>
  );
}
