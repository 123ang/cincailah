'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface Restaurant {
  id: string;
  name: string;
  cuisineTags: unknown;
  vibeTags: unknown;
  priceMin: number;
  priceMax: number;
  halal: boolean;
  vegOptions: boolean;
  walkMinutes: number;
  isActive: boolean;
  mapsUrl: string | null;
  photoUrl?: string | null;
}

export default function RestaurantsPage({
  groupId,
  restaurants,
}: {
  groupId: string;
  restaurants: Restaurant[];
}) {
  const [search, setSearch] = useState('');
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

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const getEmoji = (name: string, cuisineTags: any) => {
    const tags = Array.isArray(cuisineTags) ? cuisineTags : [];
    if (tags.includes('Mamak') || name.toLowerCase().includes('mamak')) return '🍜';
    if (tags.includes('Japanese')) return '🍱';
    if (tags.includes('Western')) return '🥘';
    if (tags.includes('Chinese')) return '🍚';
    if (tags.includes('Thai')) return '🌮';
    if (tags.includes('Fast Food') || tags.includes('Pizza')) return '🍕';
    if (tags.includes('Cafe')) return '☕';
    return '🍛';
  };

  return (
    <div className="max-w-md mx-auto px-4">
      <div className="pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Our Spots 📍</h1>
          <p className="text-sm text-gray-400 mt-1">
            {restaurants.length} restaurants
          </p>
        </div>
        <Link
          href={`/group/${groupId}/restaurants/add`}
          className="bg-sambal hover:bg-sambal-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-sambal/20"
        >
          + Add
        </Link>
      </div>

      {/* Search */}
      <div className="mt-4 relative">
        <svg
          className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search restaurants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition"
        />
      </div>

      {/* Restaurant List */}
      {filteredRestaurants.length === 0 ? (
        <div className="mt-8 text-center py-12">
          <span className="text-5xl block mb-4">🍽️</span>
          <p className="text-gray-500 font-semibold">
            {search ? 'No restaurants found' : 'No restaurants yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different search' : 'Add your first makan spot!'}
          </p>
          {!search && (
            <Link
              href={`/group/${groupId}/restaurants/add`}
              className="inline-block mt-4 bg-sambal hover:bg-sambal-dark text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
            >
              + Add Restaurant
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3 pb-6">
          {filteredRestaurants.map((restaurant) => {
            const isFav = favorites.has(restaurant.id);
            const isTogglingThis = loadingFav === restaurant.id;

            return (
              <div
                key={restaurant.id}
                className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition ${
                  !restaurant.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden ${
                      restaurant.isActive ? 'bg-red-100' : 'bg-gray-100'
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
                    <div className="flex-1">
                      <h3 className="font-bold text-sm">
                        {restaurant.name}
                        {!restaurant.isActive && (
                          <span className="text-xs font-normal text-red-500 ml-1">
                            (Inactive)
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Array.isArray(restaurant.cuisineTags)
                          ? restaurant.cuisineTags.join(' · ')
                          : 'Restaurant'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {restaurant.halal && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                            Halal
                          </span>
                        )}
                        {restaurant.vegOptions && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                            Veg
                          </span>
                        )}
                        {Array.isArray(restaurant.vibeTags) &&
                          restaurant.vibeTags.slice(0, 2).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 flex-shrink-0">
                    <Link
                      href={`/group/${groupId}/restaurants/${restaurant.id}/edit`}
                      className="text-xs font-bold text-sambal hover:bg-red-50 px-2 py-2 rounded-lg self-start"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => toggleFavorite(restaurant.id)}
                      disabled={isTogglingThis}
                      className={`p-2 rounded-lg transition ${
                        isFav
                          ? 'bg-red-100 text-sambal'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      } ${isTogglingThis ? 'opacity-50 cursor-wait' : ''}`}
                      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
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
                    <div className="text-right">
                      <p className="text-xs font-bold text-sambal">
                        {formatPrice(restaurant.priceMin, restaurant.priceMax)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {restaurant.walkMinutes} min 🚶
                      </p>
                    </div>
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
