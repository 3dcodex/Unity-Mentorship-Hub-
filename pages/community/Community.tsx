import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../src/firebase';
import { collection, getDocs, query, where, limit, orderBy, Timestamp } from 'firebase/firestore';
import { errorService } from '../../services/errorService';

interface CommunityStats {
  totalMembers: number;
  activeGroups: number;
  weeklyGrowth: number;
}

interface CommunityActivity {
  id: string;
  icon: string;
  title: string;
  desc: string;
  time: string;
}

const Community: React.FC = () => {
  const navigate = useNavigate();
  const [darkMode] = useState(localStorage.getItem('unity_dark_mode') === 'true');
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    totalMembers: 0,
    activeGroups: 0,
    weeklyGrowth: 0,
  });
  const [recentActivity, setRecentActivity] = useState<CommunityActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(1000)));
      const groupsSnap = await getDocs(query(collection(db, 'groups'), limit(1000)));

      const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const allGroups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setMembers(allUsers.slice(0, 6));
      setGroups(allGroups.slice(0, 6));

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyGrowth = allUsers.filter((u: any) => {
        const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : null;
        return createdAt ? createdAt >= sevenDaysAgo : false;
      }).length;

      setStats({
        totalMembers: allUsers.length,
        activeGroups: allGroups.length,
        weeklyGrowth,
      });

      // Build recent activity from real collections accessible to authenticated users.
      const [recentUsersSnap, recentGroupsSnap, recentPostsSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(3))),
        getDocs(query(collection(db, 'groups'), orderBy('createdAt', 'desc'), limit(3))),
        getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(3))),
      ]);

      const formatRelative = (value: any) => {
        const date = value?.toDate ? value.toDate() : null;
        if (!date) return 'recently';
        const diffMs = Date.now() - date.getTime();
        const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
      };

      const userActivities: CommunityActivity[] = recentUsersSnap.docs.map((snap) => {
        const userData = snap.data() as any;
        const name = userData.displayName || userData.name || 'A member';
        return {
          id: `user-${snap.id}`,
          icon: 'group_add',
          title: 'New Member',
          desc: `${name} joined the community`,
          time: formatRelative(userData.createdAt),
        };
      });

      const groupActivities: CommunityActivity[] = recentGroupsSnap.docs.map((snap) => {
        const groupData = snap.data() as any;
        return {
          id: `group-${snap.id}`,
          icon: 'forum',
          title: 'New Group',
          desc: `${groupData.name || 'A group'} is now active`,
          time: formatRelative(groupData.createdAt),
        };
      });

      const postActivities: CommunityActivity[] = recentPostsSnap.docs.map((snap) => {
        const postData = snap.data() as any;
        const title = postData.title || postData.content?.slice(0, 40) || 'New community post';
        return {
          id: `post-${snap.id}`,
          icon: 'celebration',
          title: 'New Discussion',
          desc: title,
          time: formatRelative(postData.createdAt),
        };
      });

      setRecentActivity([...userActivities, ...groupActivities, ...postActivities].slice(0, 3));
    } catch (error) {
      errorService.handleError(error, 'Error loading community data');
      setStats({ totalMembers: 0, activeGroups: 0, weeklyGrowth: 0 });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m =>
    m.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-600/10 blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                Unity Community
              </h1>
              <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Connect, collaborate, and grow together
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/community/groups')}
                className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">group_add</span>
                Join Community
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members, groups, or topics..."
              className={`w-full pl-12 pr-4 py-4 ${darkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'} backdrop-blur-xl border rounded-2xl font-medium focus:ring-2 focus:ring-primary outline-none`}
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          <ActionCard
            icon="rss_feed"
            title="Community Feed"
            desc="Latest updates and discussions"
            gradient="from-blue-600 to-indigo-600"
            onClick={() => navigate('/community/feed')}
          />
          <ActionCard
            icon="group"
            title="Member Directory"
            desc="Browse and connect with members"
            gradient="from-purple-600 to-pink-600"
            onClick={() => navigate('/community/directory')}
          />
          <ActionCard
            icon="forum"
            title="Discussion Groups"
            desc="Join topic-based communities"
            gradient="from-green-600 to-teal-600"
            onClick={() => navigate('/community/groups')}
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Left Column - Members & Groups */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Members */}
            <div className={`${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Featured Members</h2>
                <Link to="/community/directory" className="text-primary font-bold hover:underline">View All</Link>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredMembers.slice(0, 4).map((member) => (
                    <MemberCard key={member.id} member={member} darkMode={darkMode} navigate={navigate} />
                  ))}
                </div>
              )}
            </div>

            {/* Active Groups */}
            <div className={`${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Groups</h2>
                <Link to="/community/groups" className="text-primary font-bold hover:underline">View All</Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {groups.slice(0, 4).map((group) => (
                  <GroupCard key={group.id} group={group} darkMode={darkMode} navigate={navigate} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Highlights */}
          <div className="space-y-8">
            {/* Community Stats */}
            <div className={`${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-gradient-to-br from-primary to-purple-600'} rounded-3xl p-8 border shadow-xl text-white`}>
              <h3 className="text-xl font-black mb-6">Community Stats</h3>
              <div className="space-y-4">
                <StatItem label="Total Members" value={stats.totalMembers.toLocaleString()} icon="group" />
                <StatItem label="Active Groups" value={stats.activeGroups.toLocaleString()} icon="forum" />
                <StatItem label="This Week" value={`+${stats.weeklyGrowth.toLocaleString()}`} icon="trending_up" />
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl`}>
              <h3 className={`text-xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((item) => (
                  <ActivityItem
                    key={item.id}
                    icon={item.icon}
                    title={item.title}
                    desc={item.desc}
                    time={item.time}
                    darkMode={darkMode}
                  />
                )) : (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No recent activity found.</p>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className={`${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'} backdrop-blur-xl rounded-3xl p-8 border shadow-xl`}>
              <h3 className={`text-xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Links</h3>
              <div className="space-y-3">
                <QuickLink icon="event" label="Upcoming Events" onClick={() => navigate('/community/live')} darkMode={darkMode} />
                <QuickLink icon="analytics" label="Community Analytics" onClick={() => navigate('/analytics')} darkMode={darkMode} />
                <QuickLink icon="help" label="Community Guidelines" onClick={() => navigate('/help')} darkMode={darkMode} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ActionCard: React.FC<{ icon: string; title: string; desc: string; gradient: string; onClick: () => void }> = ({ icon, title, desc, gradient, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-8 text-white cursor-pointer hover:scale-105 transition-all shadow-xl`}
  >
    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h3 className="text-xl font-black mb-2">{title}</h3>
    <p className="text-white/80">{desc}</p>
  </div>
);

const MemberCard: React.FC<{ member: any; darkMode: boolean; navigate: any }> = ({ member, darkMode, navigate }) => (
  <div
    onClick={() => navigate(`/profile-view/${member.id}`)}
    className={`${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'} rounded-xl p-4 border cursor-pointer hover:scale-105 transition-all`}
  >
    <div className="flex items-center gap-3">
      <img
        src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`}
        alt={member.displayName || member.name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className={`font-black truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{member.displayName || member.name || 'Member'}</p>
        <p className="text-sm text-primary font-bold">{member.isMentor ? 'Mentor' : 'Student'}</p>
      </div>
    </div>
  </div>
);

const GroupCard: React.FC<{ group: any; darkMode: boolean; navigate: any }> = ({ group, darkMode, navigate }) => (
  <div
    onClick={() => navigate('/community/groups')}
    className={`${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'} rounded-xl p-4 border cursor-pointer hover:scale-105 transition-all`}
  >
    <div className="flex items-center gap-3 mb-3">
      <img
        src={group.profilePic || `https://api.dicebear.com/7.x/shapes/svg?seed=${group.id}`}
        alt={group.name}
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1 min-w-0">
        <p className={`font-black truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{group.name}</p>
        <p className="text-sm text-gray-500">{group.memberCount || 0} members</p>
      </div>
    </div>
    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>{group.description}</p>
  </div>
);

const StatItem: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/10">
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-white/60">{icon}</span>
      <span className="font-medium text-white/80">{label}</span>
    </div>
    <span className="text-2xl font-black">{value}</span>
  </div>
);

const ActivityItem: React.FC<{ icon: string; title: string; desc: string; time: string; darkMode: boolean }> = ({ icon, title, desc, time, darkMode }) => (
  <div className="flex gap-3">
    <div className={`w-10 h-10 ${darkMode ? 'bg-slate-800' : 'bg-gray-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <span className="material-symbols-outlined text-primary">{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <p className={`font-black text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
    </div>
  </div>
);

const QuickLink: React.FC<{ icon: string; label: string; onClick: () => void; darkMode: boolean }> = ({ icon, label, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'} rounded-xl transition-all`}
  >
    <span className="material-symbols-outlined text-primary">{icon}</span>
    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</span>
  </button>
);

export default Community;
