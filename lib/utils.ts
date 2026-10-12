export function generateMakanCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MAKAN-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

type Translate = (text: string, vars?: Record<string, string | number>) => string;

const englishOnly: Translate = (text, vars) =>
  text.replace(/\{(\w+)\}/g, (match, key: string) => (vars && key in vars ? String(vars[key]) : match));

export function formatDate(date: Date, t: Translate = englishOnly): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('Today');
  if (diffDays === 1) return t('Yesterday');
  if (diffDays < 7) return t('{count} days ago', { count: diffDays });
  if (diffDays < 30) return t('{count} weeks ago', { count: Math.floor(diffDays / 7) });

  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatPrice(min: number, max: number): string {
  return `RM${min}-${max}`;
}

/** Haversine distance in km between two lat/lng points */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
