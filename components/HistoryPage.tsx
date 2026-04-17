'use client';

import { formatDate } from '@/lib/utils';

interface Restaurant {
  id: string;
  name: string;
}

interface Decision {
  id: string;
  decisionDate: Date;
  modeUsed: string;
  createdAt: Date;
  chosenRestaurant: Restaurant | null;
  creator: {
    displayName: string;
  };
}

interface TopRestaurant extends Restaurant {
  count: number;
}

export default function HistoryPage({
  decisions,
  totalDecisions,
  restaurantsCount,
  topRestaurants,
}: {
  decisions: Decision[];
  totalDecisions: number;
  restaurantsCount: number;
  topRestaurants: TopRestaurant[];
}) {
  const getDayLabel = (date: Date) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date(date).getDay()];
  };

  const getDayColor = (date: Date) => {
    const day = new Date(date).getDay();
    const colors = [
      'bg-red-100 text-red-600',
      'bg-amber-100 text-amber-600',
      'bg-green-100 text-green-600',
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-sambal/10 text-sambal',
      'bg-pink-100 text-pink-600',
    ];
    return colors[day];
  };

  const getEmoji = (index: number) => {
    const emojis = ['🍛', '🍜', '🍱'];
    return emojis[index] || '🍽️';
  };

  return (
    <div className="max-w-md mx-auto px-4 pb-6">
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-extrabold">Makan History 📊</h1>
        <p className="text-sm text-gray-400 mt-1">Past decisions for your group</p>
      </div>

      {/* Stats Cards */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-black text-sambal">{totalDecisions}</p>
          <p className="text-xs text-gray-400 mt-1">Total Picks</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-black text-mamak-dark">{restaurantsCount}</p>
          <p className="text-xs text-gray-400 mt-1">Restaurants</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-black text-pandan">&lt;30s</p>
          <p className="text-xs text-gray-400 mt-1">Avg Decision</p>
        </div>
      </div>

      {/* Top Picked */}
      {topRestaurants.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            🏆 Most Picked
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {topRestaurants.map((restaurant, index) => (
              <div
                key={restaurant.id}
                className={`flex items-center gap-3 p-3 ${
                  index < topRestaurants.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <span
                  className={`text-sm font-black w-6 text-center ${
                    index === 0 ? 'text-mamak-dark' : 'text-gray-400'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-xl">{getEmoji(index)}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{restaurant.name}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    index === 0
                      ? 'bg-sambal/10 text-sambal'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {restaurant.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {decisions.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            📅 Recent Picks
          </h2>
          <div className="space-y-2">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDayColor(
                        decision.decisionDate
                      )}`}
                    >
                      <span className="text-xs font-black">
                        {getDayLabel(decision.decisionDate)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {decision.chosenRestaurant?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {decision.modeUsed === 'you_pick' ? 'You Pick' : 'We Fight'} · by{' '}
                        {decision.creator.displayName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(decision.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center py-12">
          <span className="text-5xl block mb-4">📊</span>
          <p className="text-gray-500 font-semibold">No history yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Make your first decision to see it here!
          </p>
        </div>
      )}
    </div>
  );
}
