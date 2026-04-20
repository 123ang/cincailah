import AsyncStorage from '@react-native-async-storage/async-storage';

export const GUEST_FLAG_KEY = 'cincailah_guest';
export const FAVORITE_SPOTS_KEY = 'favorite_spots';
export const FOOD_HISTORY_KEY = 'food_history';
export const GUEST_REMINDER_KEY = 'cincailah_guest_reminder';
export const GUEST_MIGRATED_KEY = 'cincailah_guest_migrated';

export async function getJson(key, fallback = null) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function setJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
