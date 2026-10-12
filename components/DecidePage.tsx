'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { CUISINE_TAGS, PRICE_LEVEL_LABEL, VIBE_TAGS, priceLevelFromRange } from '@/lib/restaurant-meta';
import { getVoteExpiry } from '@/lib/vote-resolution';
import { useT } from '@/components/LocaleProvider';

type BudgetFilter = '' | 'kering' | 'ok' | 'belanja';
type DecisionMode = 'you_pick' | 'we_fight';
type Translate = ReturnType<typeof useT>;

type FilterState = {
  budgetFilter: BudgetFilter;
  cuisineTags: string[];
  vibeTags: string[];
  halal: boolean;
  vegOptions: boolean;
  favoritesOnly: boolean;
  allowRepeatPicks: boolean;
};

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
}

interface LunchDecision {
  id: string;
  modeUsed: string;
  createdAt: Date;
  constraintsUsed?: unknown;
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
  members: unknown[];
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

function budgetFromDefault(defaultBudget?: number): BudgetFilter {
  if (!defaultBudget) return '';
  if (defaultBudget <= 10) return 'kering';
  if (defaultBudget <= 20) return 'ok';
  return 'belanja';
}

function getDefaultFilters(userPrefs?: UserPrefs | null): FilterState {
  return {
    budgetFilter: budgetFromDefault(userPrefs?.defaultBudget),
    cuisineTags: [],
    vibeTags: [],
    halal: userPrefs?.halal ?? false,
    vegOptions: userPrefs?.vegOptions ?? false,
    favoritesOnly: false,
    allowRepeatPicks: false,
  };
}

function toApiFilters(filters: FilterState): Record<string, unknown> {
  return {
    cuisineTags: filters.cuisineTags,
    vibeTags: filters.vibeTags,
    halal: filters.halal,
    vegOptions: filters.vegOptions,
    favoritesOnly: filters.favoritesOnly,
    ...(filters.budgetFilter && { budgetFilter: filters.budgetFilter }),
    ...(filters.allowRepeatPicks && { allowRepeatPicks: true }),
  };
}

function budgetLabel(value: BudgetFilter, t: Translate) {
  if (value === 'kering') return t('Kering');
  if (value === 'ok') return t('OK lah');
  if (value === 'belanja') return t('Belanja');
  return t('Any budget');
}

function greeting(t: Translate) {
  const hour = new Date().getHours();
  if (hour < 12) return t('Good morning');
  if (hour < 18) return t('Good afternoon');
  return t('Good evening');
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
  const t = useT();
  // Flowchart: only the owner picks filters and can use You Pick;
  // members always go to the group vote (We Fight) on the owner's spots.
  const isOwner = group.createdBy === currentUserId;
  const initialMode = isOwner && group.decisionModeDefault === 'you_pick' ? 'you_pick' : 'we_fight';
  const storageKey = `cincailah:lastFilters:${currentUserId}:${groupId}`;

  const defaultFilters = useMemo(() => getDefaultFilters(userPrefs), [userPrefs]);
  const [mode, setMode] = useState<DecisionMode>(initialMode);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [filterSource, setFilterSource] = useState<'defaults' | 'last' | 'custom'>('defaults');
  const [showFilters, setShowFilters] = useState(false);
  const [hello, setHello] = useState('');

  useEffect(() => setHello(greeting(t)), [t]);

  useEffect(() => {
    setFilters(defaultFilters);
    setFilterSource('defaults');
  }, [defaultFilters]);

  useEffect(() => {
    if (!isOwner) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<FilterState>;
      setFilters({
        ...defaultFilters,
        ...saved,
        budgetFilter:
          saved.budgetFilter === 'kering' ||
          saved.budgetFilter === 'ok' ||
          saved.budgetFilter === 'belanja'
            ? saved.budgetFilter
            : defaultFilters.budgetFilter,
        cuisineTags: Array.isArray(saved.cuisineTags) ? saved.cuisineTags : [],
        vibeTags: Array.isArray(saved.vibeTags) ? saved.vibeTags.filter((tag) => VIBE_TAGS.includes(tag)) : [],
      });
      setFilterSource('last');
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [defaultFilters, storageKey, isOwner]);

  const updateFilters = (next: FilterState | ((current: FilterState) => FilterState)) => {
    setFilterSource('custom');
    setFilters((current) => (typeof next === 'function' ? next(current) : next));
  };

  const activeMode: DecisionMode = isOwner ? mode : 'we_fight';

  const handleDecide = () => {
    if (!isOwner) {
      router.push(`/group/${groupId}/vote`);
      return;
    }
    const apiFilters = toApiFilters(filters);
    window.localStorage.setItem(storageKey, JSON.stringify(filters));
    const target = activeMode === 'you_pick' ? 'decide' : 'vote';
    router.push(`/group/${groupId}/${target}?filters=${encodeURIComponent(JSON.stringify(apiFilters))}`);
  };

  const toggleTag = (tag: string, type: 'cuisine' | 'vibe') => {
    updateFilters((current) => {
      const key = type === 'cuisine' ? 'cuisineTags' : 'vibeTags';
      const currentTags = current[key];
      return {
        ...current,
        [key]: currentTags.includes(tag)
          ? currentTags.filter((item) => item !== tag)
          : [...currentTags, tag],
      };
    });
  };

  const resetFilters = () => updateFilters(defaultFilters);

  const applyPreset = (preset: 'anything' | 'cheap' | 'comfort' | 'favorites') => {
    const base = getDefaultFilters(userPrefs);
    if (preset === 'anything') {
      updateFilters({ ...base, budgetFilter: '', cuisineTags: [], vibeTags: [] });
    }
    if (preset === 'cheap') {
      updateFilters({ ...base, budgetFilter: 'kering', vibeTags: [] });
    }
    if (preset === 'comfort') {
      updateFilters({ ...base, budgetFilter: 'ok', vibeTags: ['Aircond', 'Group Friendly'] });
    }
    if (preset === 'favorites') {
      updateFilters({ ...base, favoritesOnly: true });
    }
  };

  const activeChips = [
    budgetLabel(filters.budgetFilter, t),
    ...filters.cuisineTags.map((tag) => t(tag)),
    ...filters.vibeTags.map((tag) => t(tag)),
    filters.halal ? t('Halal') : null,
    filters.vegOptions ? t('Veg options') : null,
    filters.favoritesOnly ? t('Favorites') : null,
    filters.allowRepeatPicks ? t('Repeats OK') : null,
  ].filter((chip): chip is string => Boolean(chip));

  const activeFilterCount = Math.max(0, activeChips.length - (filters.budgetFilter ? 0 : 1));
  const isFight = activeMode === 'we_fight';

  return (
    <div className="max-w-md mx-auto px-4 pb-6">
      <div className="pt-4 pb-3">
        <p className="text-slate/55 dark:text-gray-400 text-sm">
          {hello || t('Good afternoon')},{' '}
          <span className="font-semibold text-slate dark:text-white">{displayName}</span>
        </p>
        <h1 className="text-2xl font-black mt-1 tracking-tight dark:text-white">{t('Makan mana hari ni?')}</h1>
      </div>

      {isOwner && (
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-gray-800 dark:text-gray-100">{t("Today's makan mood")}</h2>
              <p className="mt-1 text-xs text-gray-400">
                {activeFilterCount > 0
                  ? t('{count} active filters', { count: activeFilterCount })
                  : t('One-tap surprise mode')}
              </p>
            </div>
            <button
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
            >
              {showFilters ? t('Hide filters') : t('Edit filters')}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-sambal-soft px-3 py-1 text-xs font-black text-sambal dark:bg-orange-900/30 dark:text-orange-200"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {([
              ['anything', 'Surprise me'],
              ['cheap', 'Cheap & easy'],
              ['comfort', 'Comfy group'],
              ['favorites', 'My favorites'],
            ] as const).map(([preset, label]) => (
              <button
                key={preset}
                onClick={() => applyPreset(preset)}
                className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {t(label)}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="mt-5 space-y-5 border-t border-gray-100 pt-5 dark:border-gray-700">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide text-gray-400">{t('Budget')}</span>
                  <button onClick={resetFilters} className="text-xs font-bold text-sambal dark:text-orange-300">
                    {t('Reset to usual')}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['kering', 'Kering', '< RM10'],
                    ['ok', 'OK lah', 'RM10-20'],
                    ['belanja', 'Belanja', 'RM20+'],
                  ].map(([value, label, sublabel]) => (
                    <button
                      key={value}
                      onClick={() =>
                        updateFilters((current) => ({
                          ...current,
                          budgetFilter: current.budgetFilter === value ? '' : (value as BudgetFilter),
                        }))
                      }
                      aria-pressed={filters.budgetFilter === value}
                      className={`rounded-xl px-2 py-2 text-sm font-bold transition ${
                        filters.budgetFilter === value
                          ? 'bg-sambal text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {t(label)}
                      <span className="block text-[10px] font-medium opacity-70">{sublabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              <FilterTagGroup
                title={t('Cuisine')}
                options={CUISINE_TAGS}
                selected={filters.cuisineTags}
                onToggle={(tag) => toggleTag(tag, 'cuisine')}
                t={t}
              />

              <FilterTagGroup
                title={t('Vibe')}
                options={VIBE_TAGS}
                selected={filters.vibeTags}
                onToggle={(tag) => toggleTag(tag, 'vibe')}
                t={t}
              />

              <div className="grid grid-cols-2 gap-2">
                <ToggleButton
                  label={t('Halal')}
                  active={filters.halal}
                  onClick={() => updateFilters((current) => ({ ...current, halal: !current.halal }))}
                />
                <ToggleButton
                  label={t('Veg options')}
                  active={filters.vegOptions}
                  onClick={() => updateFilters((current) => ({ ...current, vegOptions: !current.vegOptions }))}
                />
                <ToggleButton
                  label={t('Favorites only')}
                  active={filters.favoritesOnly}
                  onClick={() => updateFilters((current) => ({ ...current, favoritesOnly: !current.favoritesOnly }))}
                />
                <ToggleButton
                  label={t('Repeats OK')}
                  active={filters.allowRepeatPicks}
                  onClick={() =>
                    updateFilters((current) => ({
                      ...current,
                      allowRepeatPicks: !current.allowRepeatPicks,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </section>
      )}

      {isOwner ? (
        <div
          role="tablist"
          aria-label={t('Decision mode')}
          className="mt-4 rounded-2xl border border-white bg-white/90 p-1.5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="grid grid-cols-2 gap-1">
            {([
              ['you_pick', 'You Pick'],
              ['we_fight', 'We Fight'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  mode === value
                    ? 'bg-sambal text-white'
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <section className="brand-card mt-4 rounded-[1.75rem] p-5 shadow-2xl shadow-sambal/20 overflow-hidden relative">
        <div className="absolute -right-14 -top-12 h-44 w-44 rounded-full border-[22px] border-white/70 border-l-transparent rotate-[-24deg] dark:border-orange-500/40 dark:border-l-transparent" />
        <div className="absolute -left-12 bottom-3 h-28 w-28 rounded-full bg-white/10 dark:bg-orange-500/10" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-black">
              <span className="h-2 w-2 rounded-full bg-pandan" />
              {group.name}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">
              {t('{count} members', { count: group.members.length })}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 font-mono font-semibold">{group.makanCode}</span>
          </div>

          <div className="mt-7 text-center">
            <p className="text-sm font-semibold text-white/75 dark:text-gray-300">
              {!isOwner
                ? t('Vote with your group on today’s spots')
                : filterSource === 'last'
                  ? t('Using your last setup')
                  : t('Ready with your usual preferences')}
            </p>
            <button
              onClick={handleDecide}
              disabled={activeRestaurantsCount === 0}
              className="mt-4 mx-auto flex h-44 w-44 flex-col items-center justify-center rounded-full bg-white text-sambal shadow-2xl shadow-slate/20 ring-8 ring-white/20 transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900 dark:text-orange-300 dark:ring-orange-500/25"
            >
              <Image
                src="/brand/cincailah-logo.jpeg"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-sambal/20"
              />
              <span className="mt-1 text-xl font-black tracking-tight">
                {isFight ? t('Fight lah!') : t('Cincai lah!')}
              </span>
              <span className="mt-1 px-4 text-xs font-black text-slate/45 dark:text-gray-400">
                {isFight ? t('Tap once to enter vote page') : t('Tap once to decide')}
              </span>
            </button>
            <p className="mt-4 text-xs font-semibold text-white/70 dark:text-gray-400">
              {activeRestaurantsCount > 0
                ? t('{count} restaurants available', { count: activeRestaurantsCount })
                : t('No restaurants yet - add some first')}
            </p>
          </div>
        </div>
      </section>

      {!isOwner && (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-black text-gray-800 dark:text-gray-100">{t('We Fight')}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            {t('Only the group owner picks filters and uses You Pick.')}{' '}
            <Link href={`/group/${groupId}/restaurants/add`} className="font-bold text-sambal dark:text-orange-300">
              {t('Add a spot')}
            </Link>
          </p>
        </div>
      )}

      {recentDecisions.length > 0 && (
        <section className="mt-5 mb-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('Recently Makan')}
          </h2>
          <div className="space-y-2">
            {recentDecisions.map((decision) => (
              <RecentDecision key={decision.id} decision={decision} groupId={groupId} t={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RecentDecision({
  decision,
  groupId,
  t,
}: {
  decision: LunchDecision;
  groupId: string;
  t: Translate;
}) {
  const restaurant = decision.chosenRestaurant;
  const isVote = decision.modeUsed === 'we_fight';
  const expiry = isVote ? getVoteExpiry(decision.constraintsUsed) : null;
  const voteOpen = isVote && !restaurant && expiry !== null && expiry.getTime() > Date.now();
  const title = restaurant?.name ?? (voteOpen ? t('Vote in progress') : t('No result'));

  const body = (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div>
        <p className="text-sm font-semibold dark:text-white">{title}</p>
        <p className="text-xs text-gray-400">
          {formatDate(new Date(decision.createdAt), t)} · {isVote ? t('We Fight') : t('You Pick')}
          {restaurant?.area ? ` · ${restaurant.area}` : ''}
        </p>
      </div>
      {restaurant ? (
        <div className="text-right">
          {restaurant.halal && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {t('Halal')}
            </span>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {t(PRICE_LEVEL_LABEL[priceLevelFromRange(restaurant.priceMin, restaurant.priceMax)])}
          </p>
        </div>
      ) : voteOpen ? (
        <span className="text-xs font-bold text-sambal dark:text-orange-300">{t('Join')} →</span>
      ) : null}
    </div>
  );

  return voteOpen ? <Link href={`/group/${groupId}/vote/${decision.id}`}>{body}</Link> : body;
}

function FilterTagGroup({
  title,
  options,
  selected,
  onToggle,
  t,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  t: Translate;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-400">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            aria-pressed={selected.includes(tag)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              selected.includes(tag)
                ? 'bg-pandan text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {t(tag)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
        active
          ? 'bg-green-100 text-green-700 ring-2 ring-pandan/60 dark:bg-green-900/30 dark:text-green-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
