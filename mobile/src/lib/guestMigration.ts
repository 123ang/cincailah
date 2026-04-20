import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './api';
import {
  FAVORITE_SPOTS_KEY,
  FOOD_HISTORY_KEY,
  GUEST_MIGRATED_KEY,
  getJson,
} from './guestStorage';

export async function hasPendingGuestData() {
  const favorites = await getJson(FAVORITE_SPOTS_KEY, []);
  const history = await getJson(FOOD_HISTORY_KEY, []);
  const alreadyMigrated = await AsyncStorage.getItem(GUEST_MIGRATED_KEY);
  return alreadyMigrated !== 'true' && ((favorites?.length ?? 0) > 0 || (history?.length ?? 0) > 0);
}

export async function migrateGuestDataToServer() {
  const favorites = await getJson(FAVORITE_SPOTS_KEY, []);
  const history = await getJson(FOOD_HISTORY_KEY, []);

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
