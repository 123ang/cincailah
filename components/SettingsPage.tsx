'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InviteShare from '@/components/InviteShare';

interface Member {
  id: string;
  role: string;
  joinedAt: Date;
  user: {
    id: string;
    displayName: string;
  };
}

interface Group {
  id: string;
  name: string;
  makanCode: string;
  noRepeatDays: number;
  maxReroll: number;
  decisionModeDefault: string;
  members: Member[];
}

export default function SettingsPage({
  group,
  isAdmin,
  currentUserId,
}: {
  group: Group;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-sambal',
      'bg-blue-500',
      'bg-purple-500',
      'bg-amber-500',
      'bg-pink-500',
      'bg-green-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="max-w-md mx-auto px-4 pb-6">
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-extrabold">{group.name} 👥</h1>
        <p className="text-sm text-gray-400 mt-1">Group settings & members</p>
      </div>

      {/* Invite */}
      <div className="mt-4">
        <InviteShare makanCode={group.makanCode} groupName={group.name} />
      </div>

      {/* Members */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Members ({group.members.length})
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {group.members.map((member, index) => (
            <div
              key={member.id}
              className={`flex items-center gap-3 p-3 ${
                index < group.members.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div
                className={`w-10 h-10 ${getAvatarColor(
                  member.user.displayName
                )} rounded-full flex items-center justify-center text-white font-bold text-sm`}
              >
                {member.user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {member.user.displayName}
                  {member.role === 'admin' && (
                    <span className="text-xs bg-sambal/10 text-sambal px-1.5 py-0.5 rounded font-medium ml-1">
                      Admin
                    </span>
                  )}
                  {member.user.id === currentUserId && (
                    <span className="text-xs text-gray-400 ml-1">(You)</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  Joined {new Date(member.joinedAt).toLocaleDateString('en-MY')}
                </p>
              </div>
              <span className="w-2 h-2 rounded-full bg-pandan"></span>
            </div>
          ))}
        </div>
      </div>

      {/* Group Rules */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Group Rules
        </h2>
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">Anti-Repeat Days</p>
                <p className="text-xs text-gray-400">
                  How many days before a restaurant can be picked again
                </p>
              </div>
              <span className="text-lg font-black text-sambal">{group.noRepeatDays}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">Max Rerolls</p>
                <p className="text-xs text-gray-400">
                  Prevent infinite "don't want" syndrome
                </p>
              </div>
              <span className="text-lg font-black text-sambal">{group.maxReroll}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">Default Mode</p>
                <p className="text-xs text-gray-400">
                  What happens when you press "Cincai lah!"
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                {group.decisionModeDefault === 'you_pick' ? 'You Pick' : 'We Fight'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="mt-6 space-y-3">
        <button
          onClick={() => router.push('/groups')}
          className="w-full bg-white border-2 border-sambal text-sambal font-bold py-3 rounded-xl hover:bg-sambal hover:text-white transition"
        >
          ← Switch Group
        </button>
        <button
          onClick={handleLogout}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
