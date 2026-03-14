import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { db } from '../../src/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { Group, GroupPost, createGroupPost, deletePost, removeMember, addModerator, removeModerator, updateGroup } from '../../services/groupService';
import { errorService } from '../../services/errorService';

const GroupDetail: React.FC = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = localStorage.getItem('unity_user_role') || 'Student';
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [activeTab, setActiveTab] = useState<'discussion' | 'about' | 'members'>('discussion');
  const [postText, setPostText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', rules: '' });

  useEffect(() => {
    if (groupId) {
      loadGroup();
      loadPosts();
      loadMembers();
    }
  }, [groupId]);

  const loadGroup = async () => {
    if (!groupId) return;
    try {
      const docSnap = await getDoc(doc(db, 'groups', groupId));
      if (docSnap.exists()) {
        const groupData = { id: docSnap.id, ...docSnap.data() } as Group;
        setGroup(groupData);
        setEditForm({ name: groupData.name, description: groupData.description, rules: groupData.rules || '' });
      }
    } catch (err) {
      errorService.handleError(err, 'Error loading group');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = () => {
    if (!groupId) return;
    const q = query(collection(db, 'groups', groupId, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as GroupPost[];
      setPosts(postsData);
    });
  };

  const loadMembers = async () => {
    if (!groupId) return;
    const docSnap = await getDoc(doc(db, 'groups', groupId));
    if (docSnap.exists()) {
      const groupData = docSnap.data() as Group;
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const groupMembers = allUsers.filter(u => groupData.members.includes(u.id));
      setMembers(groupMembers);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !groupId || !postText.trim()) return;
    try {
      const userName = localStorage.getItem('unity_user_name') || 'User';
      await createGroupPost({
        groupId,
        content: postText,
        authorId: user.uid,
        authorName: isAnonymous ? 'Anonymous' : userName,
        authorRole: userRole,
        isAnonymous,
        isPinned: false,
      });
      setPostText('');
      setIsAnonymous(false);
    } catch (err) {
      errorService.handleError(err, 'Error creating post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!groupId || !confirm('Delete this post?')) return;
    try {
      await deletePost(groupId, postId);
    } catch (err) {
      errorService.handleError(err, 'Error deleting post');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!groupId || !confirm('Remove this member from the group?')) return;
    try {
      await removeMember(groupId, userId);
      loadGroup();
      loadMembers();
    } catch (err) {
      errorService.handleError(err, 'Error removing member');
      alert('Failed to remove member');
    }
  };

  const handleToggleModerator = async (userId: string, isMod: boolean) => {
    if (!groupId) return;
    try {
      if (isMod) {
        await removeModerator(groupId, userId);
      } else {
        await addModerator(groupId, userId);
      }
      loadGroup();
      loadMembers();
    } catch (err) {
      errorService.handleError(err, 'Error toggling moderator');
    }
  };

  const handleUpdateGroup = async () => {
    if (!groupId) return;
    try {
      await updateGroup(groupId, editForm);
      setShowEditModal(false);
      loadGroup();
    } catch (err) {
      errorService.handleError(err, 'Error updating group');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Group not found</p>
          <button onClick={() => navigate('/community/groups')} className="mt-4 text-primary">
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const isMember = user && group.members.includes(user.uid);
  const isModerator = user && group.moderators?.includes(user.uid);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <button onClick={() => navigate('/community/groups')} className="text-primary mb-4 flex items-center gap-1 font-bold">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Groups
        </button>
        
        <div className="flex items-start gap-4">
          <div className="size-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black">
            {group.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">{group.name}</h1>
              {group.visibility !== 'Public' && (
                <span className="material-symbols-outlined text-gray-400">{group.visibility === 'Private' ? 'lock' : 'mail'}</span>
              )}
              {isModerator && (
                <button onClick={() => setShowEditModal(true)} className="ml-auto text-primary hover:bg-primary/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{group.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">group</span>
                {group.memberCount} members
              </span>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg font-bold">{group.category}</span>
              {group.location && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {group.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('discussion')}
          className={`px-4 py-2 font-bold ${activeTab === 'discussion' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          Discussion
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 font-bold ${activeTab === 'about' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          About
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 font-bold ${activeTab === 'members' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
        >
          Members ({group.memberCount})
        </button>
      </div>

      {activeTab === 'discussion' && (
        <div className="space-y-6">
          {isMember ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="Share your thoughts with the group..."
                className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary h-24 resize-none"
              />
              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  Post anonymously
                </label>
                <button
                  onClick={handleCreatePost}
                  disabled={!postText.trim()}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-bold disabled:opacity-50 hover:bg-primary/90 transition-all"
                >
                  Post
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-center">
              <p className="text-yellow-800 dark:text-yellow-400 font-bold">Join this group to participate in discussions</p>
            </div>
          )}

          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {post.isAnonymous ? '?' : post.authorName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-900 dark:text-white">{post.authorName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{post.authorRole}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {post.createdAt?.toDate?.()?.toLocaleDateString()}
                      </span>
                      {isModerator && (
                        <button onClick={() => handleDeletePost(post.id!)} className="ml-auto text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-6xl mb-4">forum</span>
                <p>No posts yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-400">{group.description}</p>
          </div>
          {group.rules && (
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Group Rules</h3>
              <p className="text-gray-600 dark:text-gray-400">{group.rules}</p>
            </div>
          )}
          {group.tags && group.tags.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {group.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Created By</h3>
            <p className="text-gray-600 dark:text-gray-400">{group.creatorName} • {group.creatorRole}</p>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {members.map(member => {
              const isMod = group?.moderators?.includes(member.id);
              const isCreator = group?.createdBy === member.id;
              return (
                <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                    {member.photoURL ? <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" /> : member.name?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">{member.name || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isCreator ? 'Creator' : isMod ? 'Moderator' : 'Member'}
                    </p>
                  </div>
                  {(isModerator || group?.createdBy === user?.uid) && !isCreator && member.id !== user?.uid && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleModerator(member.id, isMod)}
                        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        {isMod ? 'Remove Mod' : 'Make Mod'}
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Edit Group</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Group Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-3 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-3 text-gray-900 dark:text-white h-24 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Rules</label>
                <textarea
                  value={editForm.rules}
                  onChange={e => setEditForm({ ...editForm, rules: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl p-3 text-gray-900 dark:text-white h-24 resize-none"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button onClick={handleUpdateGroup} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
