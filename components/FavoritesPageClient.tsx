'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FavoriteRestaurant {
  id: string;
  createdAt: Date;
  restaurant: {
    id: string;
    name: string;
    cuisineTags: unknown;
    vibeTags: unknown;
    priceMin: number;
    priceMax: number;
    halal: boolean;
    vegOptions: boolean;
    mapsUrl: string | null;
    group: {
      id: string;
      name: string;
    };
  };
}

export default function FavoritesPageClient({
  favorites: initialFavorites,
}: {
  favorites: FavoriteRestaurant[];
}) {
  const router = useRouter();
  const [favorites, setFavorites] = useState(initialFavorites);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleUnfavorite = async (restaurantId: string) => {
    setRemoving(restaurantId);
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });
      setFavorites(prev => prev.filter(f => f.restaurant.id !== restaurantId));
    } finally {
      setRemoving(null);
    }
  };

  const getPriceLabel = (min: number, max: number) => {
    const avg = (min + max) / 2;
    if (avg < 15) return '$ Budget';
    if (avg < 30) return '$$ Mid-range';
    return '$$$ Splurge';
  };

  const getTags = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw as string[];
    return [];
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate">❤️ My Favourites</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {favorites.length} restaurant{favorites.length !== 1 ? 's' : ''} across all groups
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-slate transition"
        >
          ← Back
        </button>
      </div>

      {favorites.length === 0 && (
        <div className="mt-16 text-center">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-xl font-black text-slate mb-2">No favourites yet</h2>
          <p className="text-gray-500 mb-6">
            Tap the ❤️ on any restaurant in your groups to add it here.
          </p>
          <Link
            href="/groups"
            className="btn-cincai text-white font-bold px-8 py-3 rounded-xl inline-block"
          >
            Go to My Groups
          </Link>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="space-y-4 mt-2">
          {favorites.map(fav => {
            const r = fav.restaurant;
            const cuisineTags = getTags(r.cuisineTags);
            const vibeTags = getTags(r.vibeTags);
            const allTags = [...cuisineTags, ...vibeTags];
            return (
              <div
                key={fav.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate text-base">{r.name}</h3>
                      {r.halal && (
                        <span className="text-xs bg-green-100 text-green-700 font-medium px-1.5 py-0.5 rounded-full">
                          Halal
                        </span>
                      )}
                      {r.vegOptions && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-1.5 py-0.5 rounded-full">
                          Veg
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-0.5">
                      {getPriceLabel(r.priceMin, r.priceMax)} &middot;{' '}
                      <Link
                        href={`/group/${r.group.id}/restaurants`}
                        className="hover:text-sambal transition"
                      >
                        {r.group.name}
                      </Link>
                    </p>

                    {allTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {allTags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleUnfavorite(r.id)}
                      disabled={removing === r.id}
                      title="Remove from favourites"
                      className="text-xl text-red-400 hover:text-gray-300 transition disabled:opacity-50"
                    >
                      {removing === r.id ? '…' : '❤️'}
                    </button>
                    {r.mapsUrl && (
                      <a
                        href={r.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Maps →
                      </a>
                    )}
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
