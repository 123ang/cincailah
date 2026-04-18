'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

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
}

interface LunchDecision {
  id: string;
  modeUsed: string;
  createdAt: Date;
  chosenRestaurant: Restaurant | null;
}

interface Group {
  id: string;
  name: string;
  makanCode: string;
  noRepeatDays: number;
  maxReroll: number;
  decisionModeDefault: string;
  members: any[];
}

interface UserPrefs {
  halal: boolean;
  vegOptions: boolean;
  defaultBudget: number;
}

interface DecidePageProps {
  groupId: string;
  group: Group;
  recentDecisions: LunchDecision[];
  activeRestaurantsCount: number;
  currentUserId: string;
  displayName: string;
  userPrefs?: UserPrefs | null;
}

export default function DecidePage({
  groupId,
  group,
  recentDecisions,
  activeRestaurantsCount,
  currentUserId,
  displayName,
  userPrefs,
}: DecidePageProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'you_pick' | 'we_fight'>(
    group.decisionModeDefault as 'you_pick' | 'we_fight'
  );
  const [budgetFilter, setBudgetFilter] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [walkTimeMax, setWalkTimeMax] = useState<number>(30);
  const [halal, setHalal] = useState<boolean>(userPrefs?.halal ?? false);
  const [vegOptions, setVegOptions] = useState<boolean>(userPrefs?.vegOptions ?? false);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [nearby500m, setNearby500m] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleDecide = () => {
    // Only include fields when actually set — the server schema expects
    // enums (e.g. budgetFilter) to be one of the allowed values or omitted.
    // Sending '' triggers a 400 on some server builds.
    const filters: Record<string, unknown> = {
      selectedTags,
      walkTimeMax,
      halal,
      vegOptions,
      favoritesOnly,
    };
    if (budgetFilter === 'kering' || budgetFilter === 'ok' || budgetFilter === 'belanja') {
      filters.budgetFilter = budgetFilter;
    }
    if (nearby500m) filters.maxDistanceKm = 0.5;
    if (userCoords) {
      filters.userLat = userCoords.lat;
      filters.userLng = userCoords.lng;
    }

    if (mode === 'you_pick') {
      router.push(`/group/${groupId}/decide?filters=${encodeURIComponent(JSON.stringify(filters))}`);
    } else {
      router.push(`/group/${groupId}/vote?filters=${encodeURIComponent(JSON.stringify(filters))}`);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setBudgetFilter('');
    setSelectedTags([]);
    setWalkTimeMax(30);
    setHalal(false);
    setVegOptions(false);
    setFavoritesOnly(false);
    setNearby500m(false);
  };

  return (
    <div className="max-w-md mx-auto px-4">
      {/* Greeting */}
      <div className="pt-4 pb-2">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Good afternoon, <span className="font-semibold text-slate dark:text-white">{displayName}</span>
        </p>
        <h1 className="text-2xl font-extrabold mt-1 dark:text-white">Makan mana hari ni? 🤔</h1>
      </div>

      {/* Group Badge */}
      <div className="mt-3 inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-pandan animate-pulse"></span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{group.name}</span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-400">{group.members.length} members</span>
        <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-mono">
          {group.makanCode}
        </span>
      </div>

      {/* Quick Filters */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Filters</h2>
          <button
            onClick={resetFilters}
            className="text-xs text-sambal font-semibold hover:underline"
          >
            Reset All
          </button>
        </div>

        {/* Dompet Status (Budget) */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">💰</span>
            <span className="text-sm font-bold text-gray-700">Dompet Status</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setBudgetFilter(budgetFilter === 'kering' ? '' : 'kering')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition ${
                budgetFilter === 'kering'
                  ? 'bg-sambal text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Kering<br />
              <span className={`text-xs font-normal ${budgetFilter === 'kering' ? 'opacity-80' : 'text-gray-400'}`}>
                &lt; RM10
              </span>
            </button>
            <button
              onClick={() => setBudgetFilter(budgetFilter === 'ok' ? '' : 'ok')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition ${
                budgetFilter === 'ok'
                  ? 'bg-sambal text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              OK lah<br />
              <span className={`text-xs font-normal ${budgetFilter === 'ok' ? 'opacity-80' : 'text-gray-400'}`}>
                RM10-20
              </span>
            </button>
            <button
              onClick={() => setBudgetFilter(budgetFilter === 'belanja' ? '' : 'belanja')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition ${
                budgetFilter === 'belanja'
                  ? 'bg-sambal text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Belanja<br />
              <span className={`text-xs font-normal ${budgetFilter === 'belanja' ? 'opacity-80' : 'text-gray-400'}`}>
                RM20+
              </span>
            </button>
          </div>
        </div>

        {/* Type & Preference Filters */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏷️</span>
            <span className="text-sm font-bold text-gray-700">What mood?</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Halal', 'Veg Options', 'Aircond', 'Mamak', 'Japanese', 'Western', 'Atas', 'Cheap'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (tag === 'Halal') setHalal(!halal);
                  else if (tag === 'Veg Options') setVegOptions(!vegOptions);
                  else toggleTag(tag);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  (tag === 'Halal' && halal) ||
                  (tag === 'Veg Options' && vegOptions) ||
                  selectedTags.includes(tag)
                    ? 'bg-green-100 text-green-700 ring-2 ring-pandan'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag === 'Halal' && '🥗 '}
                {tag === 'Veg Options' && '🌱 '}
                {tag === 'Aircond' && '❄️ '}
                {tag === 'Mamak' && '🍜 '}
                {tag === 'Japanese' && '🍱 '}
                {tag === 'Western' && '🥘 '}
                {tag === 'Atas' && '✨ '}
                {tag === 'Cheap' && '💨 '}
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Walk Time */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🚶</span>
              <span className="text-sm font-bold text-gray-700">Walk Time</span>
            </div>
            <span className="text-sm font-bold text-sambal">≤ {walkTimeMax} min</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            value={walkTimeMax}
            onChange={(e) => setWalkTimeMax(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sambal"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5 min</span>
            <span>30 min</span>
          </div>
        </div>

        {/* Favorites Only */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">❤️</span>
              <span className="text-sm font-bold text-gray-700">My Favorites Only</span>
            </div>
            <div
              className={`w-12 h-6 rounded-full flex items-center px-0.5 transition ${
                favoritesOnly ? 'bg-sambal' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition transform ${
                  favoritesOnly ? 'translate-x-6' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Nearby 500m */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mt-3">
          <button
            onClick={() => {
              if (!nearby500m && !userCoords && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setNearby500m(true);
                  },
                  () => setNearby500m(false)
                );
              } else {
                setNearby500m(!nearby500m);
              }
            }}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span className="text-sm font-bold text-gray-700">Within 500m</span>
            </div>
            <div
              className={`w-12 h-6 rounded-full flex items-center px-0.5 transition ${
                nearby500m ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition transform ${
                  nearby500m ? 'translate-x-6' : ''
                }`}
              />
            </div>
          </button>
          {nearby500m && !userCoords && (
            <p className="text-xs text-amber-600 mt-2">
              Location permission is needed for nearby filter.
            </p>
          )}
        </div>
      </div>

      {/* Anti-Repeat Notice */}
      <div className="mt-4 flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-200">
        <span className="text-base">🔁</span>
        <p className="text-xs text-amber-700">
          <strong>Anti-Repeat ON:</strong> Ate Already protection — skipping last {group.noRepeatDays} days of picks.
        </p>
      </div>

      {/* Decision Mode Toggle */}
      <div className="mt-6">
        <div className="bg-white rounded-2xl p-1.5 flex gap-1 border border-gray-200 shadow-sm">
          <button
            onClick={() => setMode('you_pick')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              mode === 'you_pick'
                ? 'bg-sambal text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            🎲 You Pick
          </button>
          <button
            onClick={() => setMode('we_fight')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
              mode === 'we_fight'
                ? 'bg-sambal text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            ⚔️ We Fight
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          {mode === 'you_pick'
            ? 'Smart random pick — let fate decide!'
            : 'Vote with your group — majority wins!'}
        </p>
      </div>

      {/* MAIN ACTION BUTTON */}
      <div className="mt-8 mb-6 flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-sambal/20 animate-pulse"></div>
          <button
            onClick={handleDecide}
            disabled={activeRestaurantsCount === 0}
            className="btn-cincai relative z-10 w-44 h-44 rounded-full text-white flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-3xl mb-1">🍛</span>
            <span className="text-xl font-black tracking-tight">Cincai lah!</span>
            <span className="text-xs font-medium opacity-80 mt-0.5">Tap to decide</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          {activeRestaurantsCount > 0
            ? `${activeRestaurantsCount} restaurants available`
            : 'No restaurants yet — add some first!'}
        </p>
      </div>

      {/* Recently Makan */}
      {recentDecisions.length > 0 && (
        <div className="mt-2 mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Recently Makan 🕐
          </h2>
          <div className="space-y-2">
            {recentDecisions.map((decision) => (
              <div
                key={decision.id}
                className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-gray-100 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-sm">
                    {decision.chosenRestaurant?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(decision.createdAt)} · {decision.modeUsed === 'you_pick' ? 'You Pick' : 'We Fight'}
                  </p>
                </div>
                {decision.chosenRestaurant && (
                  <div className="flex items-center gap-2">
                    {decision.chosenRestaurant.halal && (
                      <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
                        Halal
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      RM{decision.chosenRestaurant.priceMin}-{decision.chosenRestaurant.priceMax}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
