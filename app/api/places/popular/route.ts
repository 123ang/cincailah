import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * GET /api/places/popular?lat=3.139&lng=101.6869&radius=2000
 * Returns popular nearby restaurants from Google Places Nearby Search.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'GOOGLE_PLACES_API_KEY not configured' },
      { status: 503 }
    );
  }

  const lat = Number(request.nextUrl.searchParams.get('lat'));
  const lng = Number(request.nextUrl.searchParams.get('lng'));
  const radius = Math.min(
    Number(request.nextUrl.searchParams.get('radius') || 2000),
    5000
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('type', 'restaurant');
  url.searchParams.set('key', key);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to query places' }, { status: 502 });
  }

  const data = await res.json();
  const results = (data.results ?? []).slice(0, 12).map((p: any) => ({
    placeId: p.place_id,
    name: p.name,
    address: p.vicinity ?? p.formatted_address ?? '',
    latitude: p.geometry?.location?.lat ?? null,
    longitude: p.geometry?.location?.lng ?? null,
    rating: p.rating ?? null,
    userRatingsTotal: p.user_ratings_total ?? null,
    priceLevel: p.price_level ?? null,
  }));

  return NextResponse.json({ results });
}

