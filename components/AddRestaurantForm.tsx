'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
