import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 503 });
  }

  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('key', key);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to query places' }, { status: 502 });
  }

  const data = await res.json();
  const results = (data.results ?? []).slice(0, 8).map((p: any) => ({
    placeId: p.place_id,
    name: p.name,
    address: p.formatted_address,
    latitude: p.geometry?.location?.lat ?? null,
    longitude: p.geometry?.location?.lng ?? null,
    photoRef: p.photos?.[0]?.photo_reference ?? null,
    rating: p.rating ?? null,
  }));

  return NextResponse.json({ results });
}
