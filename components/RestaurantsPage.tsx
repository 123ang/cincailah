'use client';

import { useState } from 'react';
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
  isActive: boolean;
  mapsUrl: string | null;
}

export default function RestaurantsPage({
  groupId,
  restaurants,
}: {
  groupId: string;
  restaurants: Restaurant[];
}) {
  const [search, setSearch] = useState('');

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
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition ${
                !restaurant.isActive ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                      restaurant.isActive ? 'bg-red-100' : 'bg-gray-100'
                    }`}
                  >
                    {getEmoji(restaurant.name, restaurant.cuisineTags)}
                  </div>
                  <div>
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
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-sambal">
                    {formatPrice(restaurant.priceMin, restaurant.priceMax)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {restaurant.walkMinutes} min 🚶
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
