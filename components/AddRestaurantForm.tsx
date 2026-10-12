'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import { useT } from '@/components/LocaleProvider';
import {
  CUISINE_TAGS,
  PRICE_LEVELS,
  PRICE_LEVEL_HINT,
  PRICE_LEVEL_LABEL,
  PRICE_LEVEL_RANGE,
  PriceLevel,
  VIBE_TAGS,
  priceLevelFromRange,
  tagsFromJson,
} from '@/lib/restaurant-meta';

const EXAMPLE_AREAS = ['Shah Alam', 'Georgetown', 'Jelutong'];

/** Server-loaded restaurant for edit mode (`/group/.../restaurants/[id]/edit`). */
export type RestaurantFormInitial = {
  id: string;
  name: string;
  cuisineTags: unknown;
  vibeTags: unknown;
  priceMin: number;
  priceMax: number;
  halal: boolean;
  vegOptions: boolean;
  area?: string;
  mapsUrl: string | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const inputClass =
  'w-full bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none transition disabled:opacity-50';
const labelClass = 'text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block';

export default function AddRestaurantForm({
  groupId,
  initialRestaurant,
  areaSuggestions = [],
}: {
  groupId: string;
  initialRestaurant?: RestaurantFormInitial | null;
  areaSuggestions?: string[];
}) {
  const router = useRouter();
  const t = useT();
  const restaurantId = initialRestaurant?.id;
  const isEdit = Boolean(restaurantId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(initialRestaurant?.name ?? '');
  const [cuisineTags, setCuisineTags] = useState<string[]>(() =>
    tagsFromJson(initialRestaurant?.cuisineTags)
  );
  const [vibeTags, setVibeTags] = useState<string[]>(() =>
    tagsFromJson(initialRestaurant?.vibeTags).filter((tag) => VIBE_TAGS.includes(tag))
  );
  const [priceLevel, setPriceLevel] = useState<PriceLevel>(() =>
    initialRestaurant ? priceLevelFromRange(initialRestaurant.priceMin, initialRestaurant.priceMax) : 'ok'
  );
  const [halal, setHalal] = useState(initialRestaurant?.halal ?? false);
  const [vegOptions, setVegOptions] = useState(initialRestaurant?.vegOptions ?? false);
  const [area, setArea] = useState(initialRestaurant?.area ?? '');
  const [mapsUrl, setMapsUrl] = useState(initialRestaurant?.mapsUrl ?? '');
  const [photoUrl, setPhotoUrl] = useState(initialRestaurant?.photoUrl ?? '');
  const latitude = initialRestaurant?.latitude ?? null;
  const longitude = initialRestaurant?.longitude ?? null;

  const suggestions = Array.from(new Set([...areaSuggestions, ...EXAMPLE_AREAS]));

  const toggleTag = (tag: string, type: 'cuisine' | 'vibe') => {
    const update = (prev: string[]) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    if (type === 'cuisine') setCuisineTags(update);
    else setVibeTags(update);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t('Restaurant name is required'));
      return;
    }
    if (cuisineTags.length === 0) {
      setError(t('Choose at least one cuisine tag'));
      return;
    }
    if (vibeTags.length === 0) {
      setError(t('Choose at least one vibe tag'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const range = PRICE_LEVEL_RANGE[priceLevel];
      const payload = {
        name: name.trim(),
        cuisineTags,
        vibeTags,
        priceMin: range.min,
        priceMax: range.max,
        halal,
        vegOptions,
        area: area.trim(),
        mapsUrl: mapsUrl.trim() || null,
        photoUrl: photoUrl.trim() || null,
        latitude,
        longitude,
      };

      const res = await fetch(
        isEdit ? `/api/restaurants/${restaurantId}` : '/api/restaurants',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(isEdit ? payload : { ...payload, groupId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ? t(data.error) : isEdit ? t('Failed to update restaurant') : t('Failed to add restaurant')
        );
      }

      router.push(`/group/${groupId}/restaurants`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to add restaurant'));
      setLoading(false);
    }
  };

  const chip = (selected: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium transition disabled:opacity-50 ${
      selected
        ? 'bg-sambal text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
    }`;

  return (
    <div className="max-w-md mx-auto px-4 pb-6">
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-extrabold dark:text-white">
          {isEdit ? `${t('Edit spot')} ✏️` : `${t('Add Restaurant')} ➕`}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isEdit ? t('Update details for this makan spot') : t('Add your favourite makan spot')}
        </p>
      </div>

      {error && (
        <div role="alert" className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="spot-name" className={labelClass}>
            {t('Restaurant Name')}
          </label>
          <input
            id="spot-name"
            type="text"
            placeholder={t('e.g. Restoran Mahbub')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>

        <fieldset>
          <legend className={labelClass}>
            {t('Cuisine Tags')} <span className="font-normal text-red-500">({t('required')})</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {CUISINE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag, 'cuisine')}
                disabled={loading}
                aria-pressed={cuisineTags.includes(tag)}
                className={chip(cuisineTags.includes(tag))}
              >
                {t(tag)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={labelClass}>
            {t('Vibe Tags')} <span className="font-normal text-red-500">({t('required')})</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {VIBE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag, 'vibe')}
                disabled={loading}
                aria-pressed={vibeTags.includes(tag)}
                className={chip(vibeTags.includes(tag))}
              >
                {t(tag)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={labelClass}>{t('Price')}</legend>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('Price')}>
            {PRICE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={priceLevel === level}
                onClick={() => setPriceLevel(level)}
                disabled={loading}
                className={`rounded-xl px-2 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                  priceLevel === level
                    ? 'bg-sambal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {t(PRICE_LEVEL_LABEL[level])}
                <span className="block text-[10px] font-medium opacity-70">{PRICE_LEVEL_HINT[level]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 flex items-center gap-3 cursor-pointer hover:border-sambal/30 transition">
            <input
              type="checkbox"
              checked={halal}
              onChange={(e) => setHalal(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 rounded accent-sambal disabled:opacity-50"
            />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('Halal')}</span>
          </label>
          <label className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 flex items-center gap-3 cursor-pointer hover:border-sambal/30 transition">
            <input
              type="checkbox"
              checked={vegOptions}
              onChange={(e) => setVegOptions(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 rounded accent-pandan disabled:opacity-50"
            />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('Veg Options')}</span>
          </label>
        </div>

        <div>
          <label htmlFor="spot-area" className={labelClass}>
            {t('Area')}
          </label>
          <input
            id="spot-area"
            type="text"
            list="spot-area-suggestions"
            placeholder={t('e.g. Shah Alam, Georgetown, Jelutong')}
            value={area}
            maxLength={60}
            onChange={(e) => setArea(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
          <datalist id="spot-area-suggestions">
            {suggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="spot-maps" className={labelClass}>
            {t('Google Maps URL')}{' '}
            <span className="font-normal text-gray-400">({t('optional')})</span>
          </label>
          <input
            id="spot-maps"
            type="url"
            placeholder="https://maps.google.com/..."
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>

        <ImageUpload
          type="restaurant"
          value={photoUrl || null}
          onChange={(url) => setPhotoUrl(url ?? '')}
          label={t('Photo (optional)')}
          previewClassName="h-40 w-full"
          helpText={t('JPEG, PNG, or WebP — max 50 MB. Auto-resized to 1200px JPEG.')}
        />

        <details className="text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-semibold select-none">
            {t('Or paste an image URL instead')}
          </summary>
          <input
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={photoUrl.startsWith('/uploads/') ? '' : photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            disabled={loading}
            className={`mt-2 ${inputClass}`}
          />
        </details>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-cincai text-white font-bold py-3.5 rounded-xl text-sm mt-2 disabled:opacity-50"
        >
          {loading ? t('Saving...') : isEdit ? `${t('Save changes')} 🍽️` : `${t('Save Restaurant')} 🍽️`}
        </button>
      </form>

      <Link
        href={`/group/${groupId}/restaurants`}
        className="mt-4 block w-full text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-medium transition text-center"
      >
        ← {t('Cancel')}
      </Link>
    </div>
  );
}
