import React, { useState, useEffect } from 'react';
import { getAllGroups, deleteGroup, updateGroup, removeMember, type Group } from '../../services/groupService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { errorService } from '../../services/errorService';

const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await getAllGroups();
      setGroups(data);
    } catch (err) {
      errorService.handleError(err, 'Error loading groups');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (group: Group) => {
    setSelectedGroup(group);
    const usersSnap = await getDocs(collection(db, 'users'));
    const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const groupMembers = allUsers.filter(u => group.members.includes(u.id));
    setMembers(groupMembers);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group permanently?')) return;
    try {
      await deleteGroup(groupId);
      loadGroups();
      setSelectedGroup(null);
    } catch (err) {
      errorService.handleError(err, 'Error deleting group');
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await removeMember(groupId, userId);
      loadGroups();
      if (selectedGroup) loadGroupMembers(selectedGroup);
    } catch (err) {
      errorService.handleError(err, 'Error removing member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white">Group Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all discussion groups and members</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">All Groups ({groups.length})</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => loadGroupMembers(group)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGroup?.id === group.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-gray-600 hover:border-primary'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">{group.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded font-bold">{group.category}</span>
                      <span className="text-gray-500 dark:text-gray-400">{group.memberCount} members</span>
                      <span className="text-gray-500 dark:text-gray-400">{group.visibility}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.id!);
                    }}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {selectedGroup ? (
            <>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
                {selectedGroup.name} - Members ({members.length})
              </h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {members.map(member => {
                  const isMod = selectedGroup.moderators?.includes(member.id);
                  const isCreator = selectedGroup.createdBy === member.id;
                  return (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                      <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                        {member.photoURL ? <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" /> : member.name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{member.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isCreator ? 'Creator' : isMod ? 'Moderator' : 'Member'}
                        </p>
                      </div>
                      {!isCreator && (
                        <button
                          onClick={() => handleRemoveMember(selectedGroup.id!, member.id)}
                          className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-4">groups</span>
                <p>Select a group to view members</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagement;
