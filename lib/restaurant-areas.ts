import { prisma } from '@/lib/prisma';

/** Areas already used by this group's spots, for the Add Spot suggestions. */
export async function getGroupAreas(groupId: string): Promise<string[]> {
  const rows = await prisma.restaurant.findMany({
    where: { groupId, NOT: { area: '' } },
    select: { area: true },
    distinct: ['area'],
    orderBy: { area: 'asc' },
    take: 50,
  });
  return rows.map((row) => row.area);
}
