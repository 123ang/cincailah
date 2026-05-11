'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

const CUISINE_TAG_OPTIONS = ['Mamak', 'Japanese', 'Western', 'Chinese', 'Thai', 'Fast Food', 'Cafe', 'Indian'];
const VIBE_TAG_OPTIONS = ['Aircond', 'Cheap', 'Atas', 'Group Friendly', 'Parking', '24hrs', 'Delivery'];

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
  createdBy: string;
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
  const isOwner = group.createdBy === currentUserId;
  const initialMode = isOwner && group.decisionModeDefault === 'you_pick' ? 'you_pick' : 'we_fight';
  const [mode, setMode] = useState<'you_pick' | 'we_fight'>(initialMode);
  const [budgetFilter, setBudgetFilter] = useState<string>('');
  const [selectedCuisineTags, setSelectedCuisineTags] = useState<string[]>([]);
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>([]);
  const [halal, setHalal] = useState<boolean>(userPrefs?.halal ?? false);
  const [vegOptions, setVegOptions] = useState<boolean>(userPrefs?.vegOptions ?? false);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  /** When true, anti-repeat is skipped and "Not this" rerolls can land on the same spot again. */
  const [allowRepeatPicks, setAllowRepeatPicks] = useState(false);

  const handleDecide = () => {
    // Only include fields when actually set — the server schema expects
    // enums (e.g. budgetFilter) to be one of the allowed values or omitted.
    // Sending '' triggers a 400 on some server builds.
    const filters: Record<string, unknown> = {
      cuisineTags: selectedCuisineTags,
      vibeTags: selectedVibeTags,
      halal,
      vegOptions,
      favoritesOnly,
    };
    if (budgetFilter === 'kering' || budgetFilter === 'ok' || budgetFilter === 'belanja') {
      filters.budgetFilter = budgetFilter;
    }
    if (allowRepeatPicks) {
      filters.allowRepeatPicks = true;
    }

    if (mode === 'you_pick') {
      router.push(`/group/${groupId}/decide?filters=${encodeURIComponent(JSON.stringify(filters))}`);
    } else {
      router.push(`/group/${groupId}/vote?filters=${encodeURIComponent(JSON.stringify(filters))}`);
    }
  };

  const toggleTag = (tag: string, type: 'cuisine' | 'vibe') => {
    const setter = type === 'cuisine' ? setSelectedCuisineTags : setSelectedVibeTags;
    setter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };


  const resetFilters = () => {
    setBudgetFilter('');
    setSelectedCuisineTags([]);
    setSelectedVibeTags([]);
    setHalal(false);
    setVegOptions(false);
    setFavoritesOnly(false);
    setAllowRepeatPicks(false);
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

        {/* Cuisine type */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🍜</span>
            <span className="text-sm font-bold text-gray-700">Cuisine Type</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Pick any cuisine types. Leave empty to include all.</p>
          <div className="flex flex-wrap gap-2">
            {CUISINE_TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag, 'cuisine')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCuisineTags.includes(tag)
                    ? 'bg-green-100 text-green-700 ring-2 ring-pandan'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine vibe */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">✨</span>
            <span className="text-sm font-bold text-gray-700">Cuisine Vibe</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">Pick any vibes. Cuisine and vibe filters work together.</p>
          <div className="flex flex-wrap gap-2">
            {VIBE_TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag, 'vibe')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedVibeTags.includes(tag)
                    ? 'bg-green-100 text-green-700 ring-2 ring-pandan'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Halal / vegetarian */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🥗</span>
            <span className="text-sm font-bold text-gray-700">Halal / Vegetarian</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Halal', 'Veg Options'].map((tag) => (
              <button
                key={tag}
                onClick={() => (tag === 'Halal' ? setHalal(!halal) : setVegOptions(!vegOptions))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  (tag === 'Halal' && halal) || (tag === 'Veg Options' && vegOptions)
                    ? 'bg-green-100 text-green-700 ring-2 ring-pandan'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag === 'Halal' ? '🥗 ' : '🌱 '}{tag}
              </button>
            ))}
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


      </div>


      {/* Same spot can win again */}
      <div className="mt-3 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowRepeatPicks}
            onChange={(e) => setAllowRepeatPicks(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded accent-sambal shrink-0"
          />
          <span className="min-w-0">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 block">
              Same spot can win again
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5 leading-snug">
              Tick this to include recently picked places and to allow &quot;Not this&quot; rerolls to pick the same restaurant again.
            </span>
          </span>
        </label>
      </div>

      {/* Decision Mode Toggle */}
      <div className="mt-6">
        <div className="bg-white rounded-2xl p-1.5 flex gap-1 border border-gray-200 shadow-sm">
          <button
            onClick={() => isOwner && setMode('you_pick')}
            disabled={!isOwner}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
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
            ? 'Owner-only random pick — reroll up to 3 times.'
            : 'Vote once with your group — majority wins!'}
        </p>
        {!isOwner && (
          <p className="text-xs text-amber-600 text-center mt-1">Only the group owner can use You Pick.</p>
        )}
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
