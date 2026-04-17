import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { logRequest } from '@/lib/logger';

const STARTER_RESTAURANTS = [
  { name: 'Nasi Lemak Antarabangsa', cuisineTags: ['Mamak', 'Malaysian'], vibeTags: ['Cheap', 'Parking'], priceMin: 5, priceMax: 12, halal: true, vegOptions: false, walkMinutes: 10 },
  { name: 'Restoran Pelita Nasi Kandar', cuisineTags: ['Mamak', 'Indian'], vibeTags: ['24hrs', 'Cheap'], priceMin: 6, priceMax: 15, halal: true, vegOptions: true, walkMinutes: 5 },
  { name: 'Old Town White Coffee', cuisineTags: ['Cafe', 'Malaysian'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 10, priceMax: 20, halal: true, vegOptions: true, walkMinutes: 8 },
  { name: 'Sushi King', cuisineTags: ['Japanese'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 20, priceMax: 50, halal: false, vegOptions: true, walkMinutes: 12 },
  { name: "Madam Kwan's", cuisineTags: ['Malaysian'], vibeTags: ['Atas', 'Aircond'], priceMin: 25, priceMax: 60, halal: false, vegOptions: true, walkMinutes: 15 },
  { name: "Nando's", cuisineTags: ['Western', 'Chicken'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 20, priceMax: 40, halal: true, vegOptions: false, walkMinutes: 10 },
  { name: 'Secret Recipe', cuisineTags: ['Western', 'Cafe'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 18, priceMax: 35, halal: true, vegOptions: true, walkMinutes: 8 },
  { name: 'Fatty Crab', cuisineTags: ['Chinese', 'Seafood'], vibeTags: ['Group Friendly', 'Parking'], priceMin: 30, priceMax: 80, halal: false, vegOptions: false, walkMinutes: 20 },
  { name: 'Jom Makan (Stall)', cuisineTags: ['Mamak', 'Malaysian'], vibeTags: ['Cheap', '24hrs'], priceMin: 4, priceMax: 10, halal: true, vegOptions: false, walkMinutes: 3 },
  { name: 'Wondermama', cuisineTags: ['Malaysian'], vibeTags: ['Aircond', 'Atas', 'Group Friendly'], priceMin: 20, priceMax: 45, halal: false, vegOptions: true, walkMinutes: 12 },
  { name: 'Pak Li Kopitiam', cuisineTags: ['Cafe', 'Malaysian'], vibeTags: ['Aircond', 'Cheap'], priceMin: 8, priceMax: 18, halal: true, vegOptions: true, walkMinutes: 7 },
  { name: 'Kim Gary Restaurant', cuisineTags: ['Chinese', 'Western'], vibeTags: ['Aircond'], priceMin: 15, priceMax: 35, halal: false, vegOptions: false, walkMinutes: 10 },
  { name: 'Restaurant Oversea', cuisineTags: ['Chinese'], vibeTags: ['Group Friendly', 'Parking', 'Atas'], priceMin: 25, priceMax: 70, halal: false, vegOptions: true, walkMinutes: 18 },
  { name: 'Subway', cuisineTags: ['Western', 'Fast Food'], vibeTags: ['Aircond', 'Cheap'], priceMin: 10, priceMax: 20, halal: true, vegOptions: true, walkMinutes: 5 },
  { name: "McDonald's", cuisineTags: ['Fast Food'], vibeTags: ['24hrs', 'Aircond', 'Cheap'], priceMin: 8, priceMax: 18, halal: true, vegOptions: false, walkMinutes: 5 },
  { name: 'Burger Lab', cuisineTags: ['Western', 'Burgers'], vibeTags: ['Atas', 'Aircond'], priceMin: 20, priceMax: 40, halal: true, vegOptions: false, walkMinutes: 12 },
  { name: 'Ichiran Ramen', cuisineTags: ['Japanese'], vibeTags: ['Aircond', 'Atas'], priceMin: 25, priceMax: 45, halal: false, vegOptions: false, walkMinutes: 15 },
  { name: 'Bijan Bar & Restaurant', cuisineTags: ['Malaysian'], vibeTags: ['Atas', 'Aircond', 'Group Friendly'], priceMin: 40, priceMax: 100, halal: false, vegOptions: true, walkMinutes: 20 },
  { name: 'Village Park Restaurant', cuisineTags: ['Malaysian', 'Mamak'], vibeTags: ['Cheap', 'Group Friendly'], priceMin: 8, priceMax: 20, halal: true, vegOptions: false, walkMinutes: 10 },
  { name: 'Dragon-I', cuisineTags: ['Chinese'], vibeTags: ['Aircond', 'Group Friendly', 'Atas'], priceMin: 20, priceMax: 50, halal: false, vegOptions: true, walkMinutes: 12 },
  { name: 'Pasta Zanmai', cuisineTags: ['Japanese', 'Western'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 20, priceMax: 40, halal: false, vegOptions: true, walkMinutes: 10 },
  { name: 'Sangkaya', cuisineTags: ['Malaysian', 'Desserts'], vibeTags: ['Aircond', 'Cheap'], priceMin: 5, priceMax: 15, halal: true, vegOptions: true, walkMinutes: 5 },
  { name: 'Wantan Mee (SS2)', cuisineTags: ['Chinese'], vibeTags: ['Cheap'], priceMin: 5, priceMax: 12, halal: false, vegOptions: false, walkMinutes: 8 },
  { name: 'Noodle Station', cuisineTags: ['Thai'], vibeTags: ['Cheap', 'Group Friendly'], priceMin: 12, priceMax: 25, halal: true, vegOptions: true, walkMinutes: 10 },
  { name: 'The Tarik Place', cuisineTags: ['Mamak', 'Malaysian'], vibeTags: ['24hrs', 'Cheap', 'Group Friendly'], priceMin: 5, priceMax: 15, halal: true, vegOptions: false, walkMinutes: 3 },
];

export async function POST(request: NextRequest) {
  logRequest(request);
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await request.json();
    if (!groupId) {
      return NextResponse.json({ error: 'groupId required' }, { status: 400 });
    }

    // Verify user is admin of this group
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: session.userId, role: 'admin' },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    // Don't seed if restaurants already exist
    const count = await prisma.restaurant.count({ where: { groupId } });
    if (count > 0) {
      return NextResponse.json({
        success: true,
        added: 0,
        message: 'Group already has restaurants',
      });
    }

    let added = 0;
    for (const r of STARTER_RESTAURANTS) {
      await prisma.restaurant.create({
        data: {
          groupId,
          createdBy: session.userId,
          isActive: true,
          mapsUrl: null,
          photoUrl: null,
          latitude: null,
          longitude: null,
          ...r,
        },
      });
      added++;
    }

    return NextResponse.json({ success: true, added });
  } catch (error) {
    console.error('Seed starter pack error:', error);
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
  }
}
