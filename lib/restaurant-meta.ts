// Shared spot metadata used by the add-spot form, filters and result cards.

export const CUISINE_TAGS = ['Mamak', 'Japanese', 'Western', 'Chinese', 'Thai', 'Fast Food', 'Cafe', 'Indian'];

// Price is captured separately as Cheap / OK / Atas, so it is not a vibe tag.
export const VIBE_TAGS = ['Aircond', 'Group Friendly', 'Parking', '24hrs', 'Delivery'];

export const PRICE_LEVELS = ['cheap', 'ok', 'atas'] as const;
export type PriceLevel = (typeof PRICE_LEVELS)[number];

// Ranges line up with the budget filter in decision-service
// (kering: max <= 10, ok: 10-20, belanja: min >= 20).
export const PRICE_LEVEL_RANGE: Record<PriceLevel, { min: number; max: number }> = {
  cheap: { min: 1, max: 10 },
  ok: { min: 10, max: 20 },
  atas: { min: 20, max: 50 },
};

export const PRICE_LEVEL_LABEL: Record<PriceLevel, string> = {
  cheap: 'Cheap',
  ok: 'OK',
  atas: 'Atas',
};

export const PRICE_LEVEL_HINT: Record<PriceLevel, string> = {
  cheap: '< RM10',
  ok: 'RM10-20',
  atas: 'RM20+',
};

export function priceLevelFromRange(priceMin: number, priceMax: number): PriceLevel {
  if (priceMax <= 10) return 'cheap';
  if (priceMin >= 20) return 'atas';
  return 'ok';
}

export function tagsFromJson(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === 'string') : [];
}
