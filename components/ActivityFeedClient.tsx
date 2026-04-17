'use client';

import Link from 'next/link';

interface ActivityItem {
  id: string;
  type: 'decision' | 'restaurant' | 'member';
  emoji: string;
  title: string;
  subtitle: string;
  timestamp: Date;
}

function buildFeed(
  decisions: {
    id: string;
    createdAt: Date;
    modeUsed: string;
    chosenRestaurant: { id: string; name: string } | null;
    creator: { id: string; displayName: string };
  }[],
  restaurants: {
    id: string;
    name: string;
    createdAt: Date;
    creator: { id: string; displayName: string };
  }[],
  members: {
    id: string;
    joinedAt: Date;
    user: { id: string; displayName: string };
  }[]
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...decisions.map(d => ({
      id: `d-${d.id}`,
      type: 'decision' as const,
      emoji: d.modeUsed === 'we_fight' ? '⚔️' : '🎲',
      title: d.chosenRestaurant ? `Picked: ${d.chosenRestaurant.name}` : 'Decision recorded',
      subtitle: `by ${d.creator.displayName} · ${d.modeUsed === 'we_fight' ? 'We Fight' : 'You Pick'}`,
      timestamp: d.createdAt,
    })),
    ...restaurants.map(r => ({
      id: `r-${r.id}`,
      type: 'restaurant' as const,
      emoji: '📍',
      title: `Added: ${r.name}`,
      subtitle: `by ${r.creator.displayName}`,
      timestamp: r.createdAt,
    })),
    ...members.map(m => ({
      id: `m-${m.id}`,
      type: 'member' as const,
      emoji: '👋',
      title: `${m.user.displayName} joined`,
      subtitle: 'New member',
      timestamp: m.joinedAt,
    })),
  ];

  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-MY');
}

export default function ActivityFeedClient({
  groupId,
  groupName,
  decisions,
  restaurants,
  members,
}: {
  groupId: string;
  groupName: string;
  decisions: Parameters<typeof buildFeed>[0];
  restaurants: Parameters<typeof buildFeed>[1];
  members: Parameters<typeof buildFeed>[2];
}) {
  const feed = buildFeed(decisions, restaurants, members);

  return (
    <div className="max-w-md mx-auto px-4 pb-8">
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-extrabold">Activity Feed 📡</h1>
        <p className="text-sm text-gray-400 mt-1">What&apos;s been happening in {groupName}</p>
      </div>

      {feed.length === 0 && (
        <div className="mt-16 text-center">
          <div className="text-6xl mb-4">🌑</div>
          <p className="text-gray-500 font-semibold">No activity yet</p>
          <p className="text-sm text-gray-400 mt-1">Add restaurants and make decisions to see them here.</p>
        </div>
      )}

      {feed.length > 0 && (
        <div className="mt-4 space-y-2">
          {feed.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate truncate">{item.title}</p>
                <p className="text-xs text-gray-400">{item.subtitle}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(item.timestamp)}</span>
            </div>
          ))}
        </div>
      )}

      <Link
        href={`/group/${groupId}`}
        className="mt-6 block text-center text-sm text-gray-400 hover:text-slate transition font-medium"
      >
        ← Back to group
      </Link>
    </div>
  );
}
