'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useT } from '@/components/LocaleProvider';
import {
  CUISINE_TAGS,
  PRICE_LEVELS,
  PRICE_LEVEL_HINT,
  PRICE_LEVEL_LABEL,
  PriceLevel,
  VIBE_TAGS,
  priceLevelFromRange,
  tagsFromJson,
} from '@/lib/restaurant-meta';

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
  isActive: boolean;
  mapsUrl: string | null;
  photoUrl?: string | null;
}

type SpotFilters = {
  priceLevels: PriceLevel[];
  areas: string[];
  cuisineTags: string[];
  vibeTags: string[];
  halal: boolean;
  vegOptions: boolean;
  favoritesOnly: boolean;
};

const EMPTY_FILTERS: SpotFilters = {
  priceLevels: [],
  areas: [],
  cuisineTags: [],
  vibeTags: [],
  halal: false,
  vegOptions: false,
  favoritesOnly: false,
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function RestaurantsPage({
  groupId,
  restaurants,
}: {
  groupId: string;
  restaurants: Restaurant[];
}) {
  const t = useT();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<SpotFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loadingFav, setLoadingFav] = useState<string | null>(null);

  useEffect(() => {
    // Load user's favorites on mount
    void fetch('/api/favorites')
      .then((res) => res.json())
      .then((data) => {
        if (data.restaurantIds) {
          setFavorites(new Set(data.restaurantIds));
        }
      })
      .catch(() => {
        // ignore; user might not be logged in or error occurred
      });
  }, []);

  const toggleFavorite = async (restaurantId: string) => {
    setLoadingFav(restaurantId);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });

      if (!res.ok) throw new Error('Failed to toggle favorite');

      const data = await res.json();
      setFavorites((prev) => {
        const next = new Set(prev);
        if (data.favorited) {
          next.add(restaurantId);
        } else {
          next.delete(restaurantId);
        }
        return next;
      });
    } catch (error) {
      console.error('Toggle favorite failed:', error);
    } finally {
      setLoadingFav(null);
    }
  };

  const areas = useMemo(
    () =>
      Array.from(new Set(restaurants.map((r) => r.area?.trim()).filter((a): a is string => Boolean(a)))).sort(),
    [restaurants],
  );

  const activeFilterCount =
    filters.priceLevels.length +
    filters.areas.length +
    filters.cuisineTags.length +
    filters.vibeTags.length +
    Number(filters.halal) +
    Number(filters.vegOptions) +
    Number(filters.favoritesOnly);

  // Within a group (cuisine, vibe, ...) any selected value matches; groups combine with AND.
  const filteredRestaurants = restaurants.filter((r) => {
    const query = search.trim().toLowerCase();
    if (query && !r.name.toLowerCase().includes(query) && !(r.area ?? '').toLowerCase().includes(query)) {
      return false;
    }
    const cuisine = tagsFromJson(r.cuisineTags);
    const vibe = tagsFromJson(r.vibeTags);
    if (filters.priceLevels.length && !filters.priceLevels.includes(priceLevelFromRange(r.priceMin, r.priceMax))) return false;
    if (filters.areas.length && !filters.areas.includes(r.area?.trim() ?? '')) return false;
    if (filters.cuisineTags.length && !filters.cuisineTags.some((tag) => cuisine.includes(tag))) return false;
    if (filters.vibeTags.length && !filters.vibeTags.some((tag) => vibe.includes(tag))) return false;
    if (filters.halal && !r.halal) return false;
    if (filters.vegOptions && !r.vegOptions) return false;
    if (filters.favoritesOnly && !favorites.has(r.id)) return false;
    return true;
  });

  const isFiltering = Boolean(search.trim()) || activeFilterCount > 0;

  const getEmoji = (name: string, cuisineTags: unknown) => {
    const tags = tagsFromJson(cuisineTags);
    if (tags.includes('Mamak') || name.toLowerCase().includes('mamak')) return '🍜';
    if (tags.includes('Japanese')) return '🍱';
    if (tags.includes('Western')) return '🥘';
    if (tags.includes('Chinese')) return '🍚';
    if (tags.includes('Thai')) return '🌮';
    if (tags.includes('Fast Food') || tags.includes('Pizza')) return '🍕';
    if (tags.includes('Cafe')) return '☕';
    return '🍛';
  };

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? 'bg-pandan text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
    }`;

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold dark:text-white">{t('Our Spots')} 📍</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isFiltering
              ? t('{shown} of {total} restaurants', { shown: filteredRestaurants.length, total: restaurants.length })
              : t('{count} restaurants', { count: restaurants.length })}
          </p>
        </div>
        <Link
          href={`/group/${groupId}/restaurants/add`}
          className="bg-sambal hover:bg-sambal-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-sambal/20"
        >
          + {t('Add')}
        </Link>
      </div>

      {/* Search + filter toggle */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('Search name or area...')}
            aria-label={t('Search name or area...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="spot-filters"
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition ${
            activeFilterCount > 0
              ? 'border-sambal bg-sambal text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
          </svg>
          {t('Filter')}
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-white/25 px-1.5 text-xs">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div
          id="spot-filters"
          className="mt-3 space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <FilterRow label={t('Price')}>
            {PRICE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={filters.priceLevels.includes(level)}
                onClick={() => setFilters((f) => ({ ...f, priceLevels: toggle(f.priceLevels, level) }))}
                className={chip(filters.priceLevels.includes(level))}
              >
                {t(PRICE_LEVEL_LABEL[level])} <span className="opacity-70">{PRICE_LEVEL_HINT[level]}</span>
              </button>
            ))}
          </FilterRow>

          {areas.length > 0 && (
            <FilterRow label={t('Area')}>
              {areas.map((area) => (
                <button
                  key={area}
                  type="button"
                  aria-pressed={filters.areas.includes(area)}
                  onClick={() => setFilters((f) => ({ ...f, areas: toggle(f.areas, area) }))}
                  className={chip(filters.areas.includes(area))}
                >
                  📍 {area}
                </button>
              ))}
            </FilterRow>
          )}

          <FilterRow label={t('Cuisine')}>
            {CUISINE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={filters.cuisineTags.includes(tag)}
                onClick={() => setFilters((f) => ({ ...f, cuisineTags: toggle(f.cuisineTags, tag) }))}
                className={chip(filters.cuisineTags.includes(tag))}
              >
                {t(tag)}
              </button>
            ))}
          </FilterRow>

          <FilterRow label={t('Vibe')}>
            {VIBE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={filters.vibeTags.includes(tag)}
                onClick={() => setFilters((f) => ({ ...f, vibeTags: toggle(f.vibeTags, tag) }))}
                className={chip(filters.vibeTags.includes(tag))}
              >
                {t(tag)}
              </button>
            ))}
          </FilterRow>

          <FilterRow label={t('Options')}>
            {([
              ['halal', 'Halal'],
              ['vegOptions', 'Veg options'],
              ['favoritesOnly', 'Favorites only'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filters[key]}
                onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
                className={chip(filters[key])}
              >
                {t(label)}
              </button>
            ))}
          </FilterRow>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs font-bold text-sambal dark:text-orange-300"
            >
              {t('Clear filters')}
            </button>
          )}
        </div>
      )}

      {/* Restaurant List */}
      {filteredRestaurants.length === 0 ? (
        <div className="mt-8 text-center py-12">
          <span className="text-5xl block mb-4">🍽️</span>
          <p className="text-gray-500 dark:text-gray-300 font-semibold">
            {isFiltering ? t('No restaurants found') : t('No restaurants yet')}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {isFiltering ? t('Try a different search or filter') : t('Add your first makan spot!')}
          </p>
          {!isFiltering && (
            <Link
              href={`/group/${groupId}/restaurants/add`}
              className="inline-block mt-4 bg-sambal hover:bg-sambal-dark text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
            >
              + {t('Add Restaurant')}
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3 pb-6">
          {filteredRestaurants.map((restaurant) => {
            const isFav = favorites.has(restaurant.id);
            const isTogglingThis = loadingFav === restaurant.id;
            const cuisine = tagsFromJson(restaurant.cuisineTags);
            const vibe = tagsFromJson(restaurant.vibeTags).filter((tag) => VIBE_TAGS.includes(tag));
            const level = priceLevelFromRange(restaurant.priceMin, restaurant.priceMax);

            return (
              <div
                key={restaurant.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition ${
                  !restaurant.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden ${
                        restaurant.isActive ? 'bg-red-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {restaurant.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={restaurant.photoUrl}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                          onError={e => {
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) parent.textContent = getEmoji(restaurant.name, restaurant.cuisineTags);
                          }}
                        />
                      ) : (
                        getEmoji(restaurant.name, restaurant.cuisineTags)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm dark:text-white">
                        {restaurant.name}
                        {!restaurant.isActive && (
                          <span className="text-xs font-normal text-red-500 ml-1">
                            ({t('Inactive')})
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {cuisine.length > 0 ? cuisine.map((tag) => t(tag)).join(' · ') : t('Restaurant')}
                        {restaurant.area ? ` · 📍 ${restaurant.area}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {restaurant.halal && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {t('Halal')}
                          </span>
                        )}
                        {restaurant.vegOptions && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {t('Veg')}
                          </span>
                        )}
                        {vibe.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {t(tag)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 flex-shrink-0">
                    <Link
                      href={`/group/${groupId}/restaurants/${restaurant.id}/edit`}
                      className="text-xs font-bold text-sambal dark:text-orange-300 hover:bg-red-50 dark:hover:bg-gray-700 px-2 py-2 rounded-lg self-start"
                    >
                      {t('Edit')}
                    </Link>
                    <button
                      onClick={() => toggleFavorite(restaurant.id)}
                      disabled={isTogglingThis}
                      className={`p-2 rounded-lg transition ${
                        isFav
                          ? 'bg-red-100 text-sambal dark:bg-orange-900/30 dark:text-orange-300'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                      } ${isTogglingThis ? 'opacity-50 cursor-wait' : ''}`}
                      aria-label={isFav ? t('Remove from favorites') : t('Add to favorites')}
                    >
                      {isFav ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      )}
                    </button>
                    <p className="pt-2 text-xs font-bold text-sambal dark:text-orange-300">{t(PRICE_LEVEL_LABEL[level])}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-400">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
