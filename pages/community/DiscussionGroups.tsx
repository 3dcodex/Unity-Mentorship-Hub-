import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { getAllGroups, createGroup, joinGroup, leaveGroup, getUserGroups, type Group } from '../../services/groupService';

const DiscussionGroups: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = localStorage.getItem('unity_user_role') || 'Domestic Student';
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Cultural' as const,
    visibility: 'Public' as const,
    rules: '',
    tags: '',
    location: '',
  });

  const categories = ['Cultural', 'Campus', 'Career', 'Study', 'Mentorship', 'Event', 'Company'];
  const visibilityOptions = ['Public', 'Private', 'Invite Only'];

  useEffect(() => {
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const [allData, myData] = await Promise.all([
        getAllGroups(),
        user ? getUserGroups(user.uid) : Promise.resolve([])
      ]);
      setGroups(allData);
      setMyGroups(myData);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const userName = localStorage.getItem('unity_user_name') || 'User';
      const profilePic = `https://api.dicebear.com/7.x/shapes/svg?seed=${formData.name}`;
      
      await createGroup({
        ...formData,
        profilePic,
        createdBy: user.uid,
        creatorName: userName,
        creatorRole: userRole,
        members: [user.uid],
        moderators: [user.uid],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      });

      setShowCreateModal(false);
      setFormData({ name: '', description: '', category: 'Cultural', visibility: 'Public', rules: '', tags: '', location: '' });
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    try {
      await joinGroup(groupId, user.uid);
      loadGroups();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    try {
      await leaveGroup(groupId, user.uid);
      loadGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const filteredGroups = activeTab === 'my' ? myGroups : 
    selectedCategory === 'All' ? groups : groups.filter(g => g.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Discussion Groups</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Structured communities for shared goals and identities</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Create Group
        </button>
      </header>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-bold ${activeTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          All Groups ({groups.length})
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 font-bold ${activeTab === 'my' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          My Groups ({myGroups.length})
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            onClick={() => navigate(`/community/groups/${group.id}`)}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
          >
            <div className="h-32 overflow-hidden relative bg-gradient-to-br from-blue-500 to-purple-600">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-6xl font-black opacity-20">{group.name[0]}</span>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-black text-white uppercase">
                  {group.category}
                </span>
              </div>
              {group.visibility !== 'Public' && (
                <div className="absolute top-3 right-3">
                  <span className="material-symbols-outlined text-white bg-black/50 backdrop-blur p-2 rounded-lg text-sm">
                    {group.visibility === 'Private' ? 'lock' : 'mail'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-5 space-y-3">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white line-clamp-1">{group.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{group.description}</p>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">group</span>
                  {group.memberCount} members
                </span>
                {group.location && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {group.location}
                  </span>
                )}
              </div>

              {user && group.members.includes(user.uid) ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveGroup(group.id!);
                  }}
                  className="w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  Leave Group
                </button>
              ) : (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinGroup(group.id!);
                  }}
                  className="w-full py-2 bg-primary/10 text-primary font-bold rounded-lg text-sm hover:bg-primary hover:text-white transition-all"
                >
                  Join Group
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">groups</span>
          <p className="text-gray-600 dark:text-gray-400 mt-4">No groups found. Create one!</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Create New Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Group Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Cameroonian Students in Canada"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary h-24 resize-none"
                  placeholder="What is this group about?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                    className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                  >
                    {visibilityOptions.map(vis => (
                      <option key={vis} value={vis}>{vis}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Location (Optional)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Toronto, Canada"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                  placeholder="e.g., networking, career, support"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionGroups;
