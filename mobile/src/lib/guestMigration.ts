import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api';
import {
  FAVORITE_SPOTS_KEY,
  FOOD_HISTORY_KEY,
  GUEST_MIGRATED_KEY,
  getJson,
} from './guestStorage';

type FavoriteSpot = { name?: string; note?: string };
type HistoryEntry = { name?: string; category?: string };

export async function hasPendingGuestData() {
  const favorites = ((await getJson(FAVORITE_SPOTS_KEY)) ?? []) as FavoriteSpot[];
  const history = ((await getJson(FOOD_HISTORY_KEY)) ?? []) as HistoryEntry[];
  const alreadyMigrated = await AsyncStorage.getItem(GUEST_MIGRATED_KEY);
  return alreadyMigrated !== 'true' && ((favorites?.length ?? 0) > 0 || (history?.length ?? 0) > 0);
}

export async function migrateGuestDataToServer() {
  const favorites = ((await getJson(FAVORITE_SPOTS_KEY)) ?? []) as FavoriteSpot[];
  const history = ((await getJson(FOOD_HISTORY_KEY)) ?? []) as HistoryEntry[];

  for (const favorite of favorites ?? []) {
    if (!favorite?.name) continue;
    await apiFetch('/api/favorites', {
      method: 'POST',
      body: { name: favorite.name, note: favorite.note ?? '' },
    });
  }

  for (const entry of history ?? []) {
    if (!entry?.name) continue;
    await apiFetch('/api/decisions', {
      method: 'POST',
      body: {
        mode: 'solo',
        soloName: entry.name,
        category: entry.category ?? null,
      },
    });
  }

  await AsyncStorage.setItem(GUEST_MIGRATED_KEY, 'true');
}

export async function clearGuestDataAfterMigration() {
  await AsyncStorage.multiRemove([FAVORITE_SPOTS_KEY, FOOD_HISTORY_KEY]);
}
