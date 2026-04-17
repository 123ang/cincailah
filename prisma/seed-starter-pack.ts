/**
 * Starter pack seeder — call this via:
 *   npx ts-node prisma/seed-starter-pack.ts <groupId>
 *
 * Adds 25 real KL/PJ restaurants to the specified group.
 * Run after creating your first group to hit the ground running.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STARTER_RESTAURANTS = [
  { name: 'Nasi Lemak Antarabangsa', cuisineTags: ['Mamak', 'Malaysian'], vibeTags: ['Cheap', 'Parking'], priceMin: 5, priceMax: 12, halal: true, vegOptions: false, walkMinutes: 10, mapsUrl: 'https://maps.google.com/?q=Nasi+Lemak+Antarabangsa+KL' },
  { name: 'Restoran Pelita Nasi Kandar', cuisineTags: ['Mamak', 'Indian'], vibeTags: ['24hrs', 'Cheap'], priceMin: 6, priceMax: 15, halal: true, vegOptions: true, walkMinutes: 5, mapsUrl: null },
  { name: 'Old Town White Coffee', cuisineTags: ['Cafe', 'Malaysian'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 10, priceMax: 20, halal: true, vegOptions: true, walkMinutes: 8, mapsUrl: null },
  { name: 'Sushi King', cuisineTags: ['Japanese'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 20, priceMax: 50, halal: false, vegOptions: true, walkMinutes: 12, mapsUrl: null },
  { name: 'Madam Kwan\'s', cuisineTags: ['Malaysian'], vibeTags: ['Atas', 'Aircond'], priceMin: 25, priceMax: 60, halal: false, vegOptions: true, walkMinutes: 15, mapsUrl: null },
  { name: 'Nando\'s', cuisineTags: ['Western', 'Chicken'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 20, priceMax: 40, halal: true, vegOptions: false, walkMinutes: 10, mapsUrl: null },
  { name: 'Secret Recipe', cuisineTags: ['Western', 'Cafe'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 18, priceMax: 35, halal: true, vegOptions: true, walkMinutes: 8, mapsUrl: null },
  { name: 'Fatty Crab', cuisineTags: ['Chinese', 'Seafood'], vibeTags: ['Group Friendly', 'Parking'], priceMin: 30, priceMax: 80, halal: false, vegOptions: false, walkMinutes: 20, mapsUrl: null },
  { name: 'Jom Makan (Stall)', cuisineTags: ['Mamak', 'Malaysian'], vibeTags: ['Cheap', '24hrs'], priceMin: 4, priceMax: 10, halal: true, vegOptions: false, walkMinutes: 3, mapsUrl: null },
  { name: 'Wondermama', cuisineTags: ['Malaysian'], vibeTags: ['Aircond', 'Atas', 'Group Friendly'], priceMin: 20, priceMax: 45, halal: false, vegOptions: true, walkMinutes: 12, mapsUrl: null },
  { name: 'Pak Li Kopitiam', cuisineTags: ['Cafe', 'Malaysian'], vibeTags: ['Aircond', 'Cheap'], priceMin: 8, priceMax: 18, halal: true, vegOptions: true, walkMinutes: 7, mapsUrl: null },
  { name: 'Kim Gary Restaurant', cuisineTags: ['Chinese', 'Western'], vibeTags: ['Aircond'], priceMin: 15, priceMax: 35, halal: false, vegOptions: false, walkMinutes: 10, mapsUrl: null },
  { name: 'Restaurant Oversea', cuisineTags: ['Chinese'], vibeTags: ['Group Friendly', 'Parking', 'Atas'], priceMin: 25, priceMax: 70, halal: false, vegOptions: true, walkMinutes: 18, mapsUrl: null },
  { name: 'Subway', cuisineTags: ['Western', 'Fast Food'], vibeTags: ['Aircond', 'Cheap'], priceMin: 10, priceMax: 20, halal: true, vegOptions: true, walkMinutes: 5, mapsUrl: null },
  { name: 'Mc Donald\'s', cuisineTags: ['Fast Food'], vibeTags: ['24hrs', 'Aircond', 'Cheap'], priceMin: 8, priceMax: 18, halal: true, vegOptions: false, walkMinutes: 5, mapsUrl: null },
  { name: 'Burger Lab', cuisineTags: ['Western', 'Burgers'], vibeTags: ['Atas', 'Aircond'], priceMin: 20, priceMax: 40, halal: true, vegOptions: false, walkMinutes: 12, mapsUrl: null },
  { name: 'Ichiran Ramen', cuisineTags: ['Japanese'], vibeTags: ['Aircond', 'Atas'], priceMin: 25, priceMax: 45, halal: false, vegOptions: false, walkMinutes: 15, mapsUrl: null },
  { name: 'Bijan Bar & Restaurant', cuisineTags: ['Malaysian'], vibeTags: ['Atas', 'Aircond', 'Group Friendly'], priceMin: 40, priceMax: 100, halal: false, vegOptions: true, walkMinutes: 20, mapsUrl: null },
  { name: 'Village Park Restaurant', cuisineTags: ['Malaysian', 'Mamak'], vibeTags: ['Cheap', 'Group Friendly'], priceMin: 8, priceMax: 20, halal: true, vegOptions: false, walkMinutes: 10, mapsUrl: null },
  { name: 'Dragon-I', cuisineTags: ['Chinese'], vibeTags: ['Aircond', 'Group Friendly', 'Atas'], priceMin: 20, priceMax: 50, halal: false, vegOptions: true, walkMinutes: 12, mapsUrl: null },
  { name: 'Pasta Zanmai', cuisineTags: ['Japanese', 'Western'], vibeTags: ['Aircond', 'Group Friendly'], priceMin: 20, priceMax: 40, halal: false, vegOptions: true, walkMinutes: 10, mapsUrl: null },
  { name: 'Sangkaya', cuisineTags: ['Malaysian', 'Desserts'], vibeTags: ['Aircond', 'Cheap'], priceMin: 5, priceMax: 15, halal: true, vegOptions: true, walkMinutes: 5, mapsUrl: null },
  { name: 'Wantan Mee (SS2)', cuisineTags: ['Chinese'], vibeTags: ['Cheap'], priceMin: 5, priceMax: 12, halal: false, vegOptions: false, walkMinutes: 8, mapsUrl: null },
  { name: 'Noodle Station', cuisineTags: ['Thai'], vibeTags: ['Cheap', 'Group Friendly'], priceMin: 12, priceMax: 25, halal: true, vegOptions: true, walkMinutes: 10, mapsUrl: null },
  { name: 'The Tarik Place', cuisineTags: ['Mamak', 'Malaysian'], vibeTags: ['24hrs', 'Cheap', 'Group Friendly'], priceMin: 5, priceMax: 15, halal: true, vegOptions: false, walkMinutes: 3, mapsUrl: null },
];

async function main() {
  const groupId = process.argv[2];
  if (!groupId) {
    console.error('Usage: npx ts-node prisma/seed-starter-pack.ts <groupId>');
    process.exit(1);
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    console.error(`Group ${groupId} not found.`);
    process.exit(1);
  }

  console.log(`Seeding starter pack for group: ${group.name} (${groupId})`);

  let added = 0;
  for (const r of STARTER_RESTAURANTS) {
    await prisma.restaurant.create({
      data: {
        ...r,
        groupId,
        createdBy: group.createdBy,
      },
    });
    added++;
    process.stdout.write(`  ✓ ${r.name}\n`);
  }

  console.log(`\nDone! Added ${added} starter restaurants.`);
}

main()
  .catch(console.error)
  .finally(() => void prisma.$disconnect());
