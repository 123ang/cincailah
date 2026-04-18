'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

const CUISINE_TAGS = ['Mamak', 'Japanese', 'Western', 'Chinese', 'Thai', 'Fast Food', 'Cafe', 'Indian'];
const VIBE_TAGS = ['Aircond', 'Cheap', 'Atas', 'Group Friendly', 'Parking', '24hrs', 'Delivery'];

export default function AddRestaurantForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [cuisineTags, setCuisineTags] = useState<string[]>([]);
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState('5');
  const [priceMax, setPriceMax] = useState('15');
  const [halal, setHalal] = useState(false);
  const [vegOptions, setVegOptions] = useState(false);
  const [walkMinutes, setWalkMinutes] = useState('5');
  const [mapsUrl, setMapsUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [placesQuery, setPlacesQuery] = useState('');
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placesResults, setPlacesResults] = useState<Array<{
    placeId: string;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  }>>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [popularResults, setPopularResults] = useState<Array<{
    placeId: string;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    rating: number | null;
    userRatingsTotal: number | null;
  }>>([]);

  const toggleTag = (tag: string, type: 'cuisine' | 'vibe') => {
    if (type === 'cuisine') {
      setCuisineTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    } else {
      setVibeTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Restaurant name is required');
      return;
    }

    if (Number(priceMin) >= Number(priceMax)) {
      setError('Price max must be greater than price min');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          name: name.trim(),
          cuisineTags,
          vibeTags,
          priceMin: Number(priceMin),
          priceMax: Number(priceMax),
          halal,
          vegOptions,
          walkMinutes: Number(walkMinutes),
          mapsUrl: mapsUrl.trim() || null,
          photoUrl: photoUrl.trim() || null,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add restaurant');
      }

      router.push(`/group/${groupId}/restaurants`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const searchPlaces = async () => {
    if (!placesQuery.trim()) return;
    setPlaceLoading(true);
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(placesQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Places search failed');
      setPlacesResults(data.results ?? []);
    } catch (err: any) {
      setError(err.message || 'Places search failed');
    } finally {
      setPlaceLoading(false);
    }
  };

  const applyPlace = (place: {
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  }) => {
    setName(place.name);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    if (place.latitude != null && place.longitude != null) {
      setMapsUrl(`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`);
    } else if (place.address) {
      setMapsUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`);
    }
    setPlacesResults([]);
  };

  const loadPopularNearby = async () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('Geolocation is not supported in this browser');
      return;
    }
    setPopularLoading(true);
    setError('');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const res = await fetch(`/api/places/popular?lat=${lat}&lng=${lng}&radius=2500`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load popular nearby places');
      setPopularResults(data.results ?? []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load popular nearby places');
    } finally {
      setPopularLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pb-6">
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-extrabold">Add Restaurant ➕</h1>
        <p className="text-sm text-gray-400 mt-1">Add your favourite makan spot</p>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <label className="text-sm font-bold text-gray-600 mb-1.5 block">
            Search Google Places (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Village Park Restaurant"
              value={placesQuery}
              onChange={(e) => setPlacesQuery(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={searchPlaces}
              disabled={placeLoading || !placesQuery.trim()}
              className="text-xs font-bold bg-slate text-white px-3 py-2 rounded-xl disabled:opacity-50"
            >
              {placeLoading ? '...' : 'Search'}
            </button>
          </div>
          {placesResults.length > 0 && (
            <div className="mt-2 border border-gray-100 rounded-lg divide-y">
              {placesResults.map((place) => (
                <button
                  key={place.placeId}
                  type="button"
                  onClick={() => applyPlace(place)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                >
                  <p className="text-sm font-semibold text-slate">{place.name}</p>
                  <p className="text-xs text-gray-500">{place.address}</p>
                </button>
              ))}
            </div>
          )}
          <div className="mt-3">
            <button
              type="button"
              onClick={loadPopularNearby}
              disabled={popularLoading}
              className="text-xs font-bold bg-pandan text-white px-3 py-2 rounded-xl disabled:opacity-50"
            >
              {popularLoading ? 'Locating...' : 'Popular in your area'}
            </button>
            {popularResults.length > 0 && (
              <div className="mt-2 border border-green-100 rounded-lg divide-y">
                {popularResults.map((place) => (
                  <button
                    key={place.placeId}
                    type="button"
                    onClick={() => applyPlace(place)}
                    className="w-full text-left px-3 py-2 hover:bg-green-50"
                  >
                    <p className="text-sm font-semibold text-slate">{place.name}</p>
                    <p className="text-xs text-gray-500">{place.address}</p>
                    {place.rating != null && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        ⭐ {place.rating} ({place.userRatingsTotal ?? 0} reviews)
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-1.5 block">
            Restaurant Name
          </label>
          <input
            type="text"
            placeholder="e.g. Restoran Mahbub"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-1.5 block">
            Cuisine Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {CUISINE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag, 'cuisine')}
                disabled={loading}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition disabled:opacity-50 ${
                  cuisineTags.includes(tag)
                    ? 'bg-sambal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-1.5 block">
            Vibe Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {VIBE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag, 'vibe')}
                disabled={loading}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition disabled:opacity-50 ${
                  vibeTags.includes(tag)
                    ? 'bg-sambal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1.5 block">
              Price Min (RM)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              disabled={loading}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1.5 block">
              Price Max (RM)
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              disabled={loading}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3 cursor-pointer hover:border-sambal/30 transition">
            <input
              type="checkbox"
              checked={halal}
              onChange={(e) => setHalal(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 rounded accent-sambal disabled:opacity-50"
            />
            <span className="text-sm font-semibold text-gray-700">Halal</span>
          </label>
          <label className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3 cursor-pointer hover:border-sambal/30 transition">
            <input
              type="checkbox"
              checked={vegOptions}
              onChange={(e) => setVegOptions(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 rounded accent-pandan disabled:opacity-50"
            />
            <span className="text-sm font-semibold text-gray-700">Veg Options</span>
          </label>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-1.5 block">
            Walk Time (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={walkMinutes}
            onChange={(e) => setWalkMinutes(e.target.value)}
            disabled={loading}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-gray-600 mb-1.5 block">
            Google Maps URL{' '}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://maps.google.com/..."
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            disabled={loading}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
          />
        </div>

        <ImageUpload
          type="restaurant"
          value={photoUrl || null}
          onChange={(url) => setPhotoUrl(url ?? '')}
          label="Photo (optional)"
          previewClassName="h-40 w-full"
          helpText="JPEG, PNG, or WebP — max 50 MB. Auto-resized to 1200px JPEG."
        />

        <details className="text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-600 font-semibold select-none">
            Or paste an image URL instead
          </summary>
          <input
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={photoUrl.startsWith('/uploads/') ? '' : photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            disabled={loading}
            className="mt-2 w-full bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50"
          />
        </details>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm mt-2 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Restaurant 🍽️'}
        </button>
      </form>

      <Link
        href={`/group/${groupId}/restaurants`}
        className="mt-4 block w-full text-sm text-gray-400 hover:text-gray-600 font-medium transition text-center"
      >
        ← Cancel
      </Link>
    </div>
  );
}
