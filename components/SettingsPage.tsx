'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InviteShare from '@/components/InviteShare';
import ImageUpload from '@/components/ImageUpload';

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
  coverUrl?: string | null;
  members: Member[];
}

export default function SettingsPage({
  group: initialGroup,
  isAdmin,
  currentUserId,
}: {
  group: Group;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [group, setGroup] = useState(initialGroup);

  // Rename state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [nameLoading, setNameLoading] = useState(false);

  // Rules edit state
  const [editingRules, setEditingRules] = useState(false);
  const [rulesForm, setRulesForm] = useState({
    noRepeatDays: group.noRepeatDays,
    maxReroll: group.maxReroll,
    decisionModeDefault: group.decisionModeDefault,
  });
  const [rulesLoading, setRulesLoading] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Transfer admin state
  const [transferTarget, setTransferTarget] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // Kick/leave state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState('');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCoverChange = async (url: string | null) => {
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverUrl: url }),
      });
      if (res.ok) setGroup(g => ({ ...g, coverUrl: url }));
    } catch { /* ignore */ }
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    setNameLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setGroup(g => ({ ...g, name: newName.trim() }));
      setEditingName(false);
    } finally {
      setNameLoading(false);
    }
  };

  const handleSaveRules = async () => {
    setRulesLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rulesForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setGroup(g => ({ ...g, ...rulesForm }));
      setEditingRules(false);
    } finally {
      setRulesLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    setDeleteLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/groups/${group.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/groups');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTransferAdmin = async () => {
    if (!transferTarget) return;
    setTransferLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/groups/${group.id}/transfer-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAdminUserId: transferTarget }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.refresh();
    } finally {
      setTransferLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string, isSelf: boolean) => {
    setActionLoading(userId);
    setError('');
    try {
      const res = await fetch(`/api/groups/${group.id}/members/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (isSelf) {
        router.push('/groups');
      } else {
        setGroup(g => ({ ...g, members: g.members.filter(m => m.user.id !== userId) }));
      }
    } finally {
      setActionLoading(null);
    }
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
    return colors[name.charCodeAt(0) % colors.length];
  };

  const otherMembers = group.members.filter(m => m.user.id !== currentUserId);

  return (
    <div className="max-w-md mx-auto px-4 pb-6">
      <div className="pt-4 pb-2 flex items-center justify-between">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="flex-1 text-xl font-extrabold border-b-2 border-sambal outline-none bg-transparent"
              autoFocus
            />
            <button
              onClick={handleRename}
              disabled={nameLoading}
              className="text-sm font-bold text-pandan hover:underline"
            >
              {nameLoading ? '…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditingName(false); setNewName(group.name); }}
              className="text-sm text-gray-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-extrabold">{group.name} 👥</h1>
              <p className="text-sm text-gray-400 mt-1">Group settings & members</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setEditingName(true)}
                className="text-xs text-sambal font-bold border border-sambal px-3 py-1 rounded-lg hover:bg-sambal hover:text-white transition"
              >
                Rename
              </button>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Group Cover Image */}
      {isAdmin ? (
        <div className="mt-4">
          <ImageUpload
            type="group_cover"
            value={group.coverUrl ?? null}
            onChange={handleCoverChange}
            label="Group cover"
            previewClassName="h-32 w-full"
            helpText="Auto-resized to 1600px WebP · max 5 MB"
          />
        </div>
      ) : group.coverUrl ? (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={group.coverUrl}
            alt={`${group.name} cover`}
            className="w-full h-32 object-cover rounded-xl border border-gray-200"
          />
        </div>
      ) : null}

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
          {group.members.map((member, index) => {
            const isSelf = member.user.id === currentUserId;
            const canKick = isAdmin && !isSelf;
            const canLeave = isSelf && !isAdmin;
            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 ${
                  index < group.members.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 ${getAvatarColor(
                    member.user.displayName
                  )} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                >
                  {member.user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {member.user.displayName}
                    {(member.role === 'admin' || member.role === 'owner') && (
                      <span className="text-xs bg-sambal/10 text-sambal px-1.5 py-0.5 rounded font-medium ml-1">
                        Admin
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-xs text-gray-400 ml-1">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString('en-MY')}
                  </p>
                </div>
                {canKick && (
                  <button
                    onClick={() => handleRemoveMember(member.user.id, false)}
                    disabled={actionLoading === member.user.id}
                    className="text-xs text-red-500 hover:underline font-medium"
                  >
                    {actionLoading === member.user.id ? '…' : 'Kick'}
                  </button>
                )}
                {canLeave && (
                  <button
                    onClick={() => handleRemoveMember(member.user.id, true)}
                    disabled={actionLoading === member.user.id}
                    className="text-xs text-red-500 hover:underline font-medium"
                  >
                    {actionLoading === member.user.id ? '…' : 'Leave'}
                  </button>
                )}
                {!canKick && !canLeave && <span className="w-2 h-2 rounded-full bg-pandan flex-shrink-0"></span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transfer Admin (admin only) */}
      {isAdmin && otherMembers.length > 0 && (
        <div className="mt-4">
          {!showTransfer ? (
            <button
              onClick={() => setShowTransfer(true)}
              className="text-xs text-gray-400 hover:text-sambal transition font-medium"
            >
              Transfer admin role →
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <p className="text-sm font-bold text-gray-700">Transfer Admin Role</p>
              <select
                value={transferTarget}
                onChange={e => setTransferTarget(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select new admin…</option>
                {otherMembers.map(m => (
                  <option key={m.id} value={m.user.id}>{m.user.displayName}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleTransferAdmin}
                  disabled={!transferTarget || transferLoading}
                  className="flex-1 bg-sambal text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50"
                >
                  {transferLoading ? '…' : 'Transfer'}
                </button>
                <button
                  onClick={() => { setShowTransfer(false); setTransferTarget(''); }}
                  className="flex-1 bg-gray-100 text-gray-700 text-sm font-bold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Group Rules */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Group Rules
          </h2>
          {isAdmin && !editingRules && (
            <button
              onClick={() => setEditingRules(true)}
              className="text-xs text-sambal font-bold border border-sambal px-3 py-1 rounded-lg hover:bg-sambal hover:text-white transition"
            >
              Edit
            </button>
          )}
        </div>
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">Anti-Repeat Days</p>
                <p className="text-xs text-gray-400">
                  How many days before a restaurant can be picked again
                </p>
              </div>
              {editingRules ? (
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={rulesForm.noRepeatDays}
                  onChange={e => setRulesForm(f => ({ ...f, noRepeatDays: Number(e.target.value) }))}
                  className="w-16 text-center border border-gray-200 rounded-lg text-lg font-black text-sambal"
                />
              ) : (
                <span className="text-lg font-black text-sambal">{group.noRepeatDays}</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">Max Rerolls</p>
                <p className="text-xs text-gray-400">
                  Prevent infinite &quot;don&apos;t want&quot; syndrome
                </p>
              </div>
              {editingRules ? (
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={rulesForm.maxReroll}
                  onChange={e => setRulesForm(f => ({ ...f, maxReroll: Number(e.target.value) }))}
                  className="w-16 text-center border border-gray-200 rounded-lg text-lg font-black text-sambal"
                />
              ) : (
                <span className="text-lg font-black text-sambal">{group.maxReroll}</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">Default Mode</p>
                <p className="text-xs text-gray-400">
                  What happens when you press &quot;Cincai lah!&quot;
                </p>
              </div>
              {editingRules ? (
                <select
                  value={rulesForm.decisionModeDefault}
                  onChange={e => setRulesForm(f => ({ ...f, decisionModeDefault: e.target.value }))}
                  className="border border-gray-200 rounded-lg text-sm px-2 py-1"
                >
                  <option value="you_pick">You Pick</option>
                  <option value="we_fight">We Fight</option>
                </select>
              ) : (
                <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                  {group.decisionModeDefault === 'you_pick' ? 'You Pick' : 'We Fight'}
                </span>
              )}
            </div>
          </div>
          {editingRules && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveRules}
                disabled={rulesLoading}
                className="flex-1 bg-sambal text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
              >
                {rulesLoading ? 'Saving…' : 'Save Rules'}
              </button>
              <button
                onClick={() => { setEditingRules(false); setRulesForm({ noRepeatDays: group.noRepeatDays, maxReroll: group.maxReroll, decisionModeDefault: group.decisionModeDefault }); }}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin danger zone */}
      {isAdmin && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">
            Danger Zone
          </h2>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full border-2 border-red-200 text-red-500 font-bold py-3 rounded-xl hover:bg-red-50 transition text-sm"
            >
              🗑 Delete Group
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-red-700">
                Are you sure? This will permanently delete &quot;{group.name}&quot; and all its data.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteGroup}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
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
