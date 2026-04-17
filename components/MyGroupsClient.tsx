'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  makanCode: string;
  isOwner: boolean;
  role: string;
  memberCount: number;
  restaurantCount: number;
  createdAt: string;
}

interface MyGroupsClientProps {
  groups: Group[];
  activeGroupId: string | null;
  userEmail: string;
  displayName: string;
}

export default function MyGroupsClient({
  groups,
  activeGroupId,
  userEmail,
  displayName,
}: MyGroupsClientProps) {
  const router = useRouter();

  const handleSelectGroup = async (groupId: string) => {
    try {
      const res = await fetch('/api/groups/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      if (!res.ok) throw new Error('Failed to switch group');

      router.push(`/group/${groupId}`);
    } catch (error) {
      console.error('Switch group error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <span className="text-5xl block mb-3">🍛</span>
          <h1 className="text-3xl font-black text-slate mb-2">My Makan Groups</h1>
          <p className="text-gray-500 text-sm">
            Logged in as <span className="font-semibold">{displayName}</span> ({userEmail})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Link
            href="/groups/create"
            className="flex-1 btn-cincai text-white font-bold py-3.5 rounded-xl text-sm text-center"
          >
            + Create New Group
          </Link>
          <Link
            href="/groups/join"
            className="flex-1 bg-white border-2 border-sambal text-sambal font-bold py-3.5 rounded-xl text-sm text-center hover:bg-sambal hover:text-white transition"
          >
            Join Existing Group
          </Link>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-4">You haven't joined any groups yet</p>
            <p className="text-sm text-gray-400">
              Create a new group or join an existing one using a Makan Code
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`bg-white rounded-2xl border-2 p-5 transition cursor-pointer ${
                  activeGroupId === group.id
                    ? 'border-pandan shadow-md'
                    : 'border-gray-200 hover:border-sambal/30'
                }`}
                onClick={() => handleSelectGroup(group.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-slate">{group.name}</h3>
                      {activeGroupId === group.id && (
                        <span className="text-xs bg-pandan text-white px-2 py-0.5 rounded-full font-bold">
                          Active
                        </span>
                      )}
                      {group.isOwner && (
                        <span className="text-xs bg-mamak text-slate px-2 py-0.5 rounded-full font-bold">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Makan Code: <span className="font-mono font-bold text-sambal">{group.makanCode}</span>
                    </p>
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>{group.memberCount} members</span>
                      <span>{group.restaurantCount} restaurants</span>
                      <span>Joined {new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectGroup(group.id);
                    }}
                    className="btn-cincai text-white font-bold px-6 py-2 rounded-xl text-sm"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logout */}
        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-sambal font-semibold transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
