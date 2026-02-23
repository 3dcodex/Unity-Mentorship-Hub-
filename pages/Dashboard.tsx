import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [stats, setStats] = useState({ totalSessions: 0, completedSessions: 0, activeMentors: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load user profile
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setUserName(userData.displayName || userData.name || 'User');
        setUserPhoto(userData.photoURL || null);
      }

      // Load upcoming sessions
      const sessionsQuery = query(
        collection(db, 'bookings'),
        where('menteeId', '==', user.uid),
        where('status', '!=', 'cancelled'),
        orderBy('status'),
        limit(3)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      const sessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingSessions(sessions);

      // Load stats
      const allSessionsSnap = await getDocs(query(collection(db, 'bookings'), where('menteeId', '==', user.uid)));
      const totalSessions = allSessionsSnap.size;
      const completedSessions = allSessionsSnap.docs.filter(doc => doc.data().status === 'completed').length;

      // Load mentors
      const mentorsQuery = query(collection(db, 'users'), where('isMentor', '==', true), limit(6));
      const mentorsSnap = await getDocs(mentorsQuery);
      const mentorsList = mentorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMentors(mentorsList);

      setStats({ totalSessions, completedSessions, activeMentors: mentorsList.length });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor =>
    (mentor.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    mentor.name?.toLowerCase().includes(search.toLowerCase()) ||
    mentor.mentorExpertise?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center space-y-4">
          <div className="size-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-4 sm:py-8 px-3 sm:px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Welcome Header */}
        <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-8 backdrop-blur-sm border shadow-xl relative overflow-hidden ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
              <div className="size-14 sm:size-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-blue-500/20 shadow-xl flex-shrink-0">
                {userPhoto ? (
                  <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-2xl font-black">
                    {userName[0] || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                  Welcome, {userName}! 👋
                </h1>
                <p className={`text-sm sm:text-lg font-medium mt-1 sm:mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Ready to continue your journey?
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/mentorship/match')}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-2xl shadow-blue-500/50 hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base flex-shrink-0"
            >
              <span className="material-symbols-outlined text-xl">auto_awesome</span>
              Quick Match
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <StatCard
            icon="event"
            label="Total Sessions"
            value={stats.totalSessions}
            color="from-blue-600 to-indigo-600"
            isDark={isDark}
          />
          <StatCard
            icon="check_circle"
            label="Completed"
            value={stats.completedSessions}
            color="from-green-600 to-emerald-600"
            isDark={isDark}
          />
          <StatCard
            icon="diversity_3"
            label="Active Mentors"
            value={stats.activeMentors}
            color="from-purple-600 to-pink-600"
            isDark={isDark}
          />
          <StatCard
            icon="chat"
            label="Unread Messages"
            value={unreadMessages}
            color="from-orange-600 to-red-600"
            isDark={isDark}
            onClick={() => navigate('/quick-chat')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Upcoming Sessions */}
          <div className={`lg:col-span-2 rounded-2xl sm:rounded-3xl p-4 sm:p-8 backdrop-blur-sm border shadow-xl ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Upcoming Sessions
              </h2>
              <Link to="/mentorship/history" className="text-blue-600 dark:text-blue-400 font-bold hover:underline text-xs sm:text-sm">
                View All
              </Link>
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <span className="material-symbols-outlined text-4xl sm:text-6xl text-gray-300 dark:text-gray-600 mb-3 sm:mb-4">event_busy</span>
                <p className={`font-medium text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No upcoming sessions</p>
                <button
                  onClick={() => navigate('/mentorship/book')}
                  className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm sm:text-base"
                >
                  Book a Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session.id} session={session} isDark={isDark} navigate={navigate} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4 sm:space-y-6">
            <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-sm border shadow-xl ${isDark ? 'bg-gradient-to-br from-blue-900 to-indigo-900' : 'bg-gradient-to-br from-blue-600 to-indigo-600'} text-white`}>
              <h3 className="text-lg sm:text-xl font-black mb-3 sm:mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <QuickActionButton icon="admin_panel_settings" label="Admin Dashboard" onClick={() => navigate('/admin')} />
                <QuickActionButton icon="event" label="Book Session" onClick={() => navigate('/mentorship/book')} />
                <QuickActionButton icon="chat" label="Messages" onClick={() => navigate('/quick-chat')} />
                <QuickActionButton icon="description" label="Resume Builder" onClick={() => navigate('/career/resume')} />
                <QuickActionButton icon="mic" label="Mock Interview" onClick={() => navigate('/career/mock-interview')} />
                <QuickActionButton icon="school" label="Become a Mentor" onClick={() => navigate('/become-mentor')} />
              </div>
            </div>

            <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-sm border shadow-xl ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
              <h3 className={`text-base sm:text-lg font-black mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Resources</h3>
              <div className="space-y-2">
                <ResourceLink icon="payments" label="Financial Aid" to="/resources/financial-aid" isDark={isDark} />
                <ResourceLink icon="school" label="Academic Support" to="/resources/academics" isDark={isDark} />
                <ResourceLink icon="verified_user" label="DEI Guides" to="/resources/dei-guides" isDark={isDark} />
              </div>
            </div>
          </div>
        </div>

        {/* Featured Mentors */}
        <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-8 backdrop-blur-sm border shadow-xl ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className={`text-lg sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Featured Mentors
            </h2>
            <Link to="/mentorship/match" className="text-blue-600 dark:text-blue-400 font-bold hover:underline text-xs sm:text-sm">
              View All
            </Link>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mentors..."
            className={`w-full mb-4 sm:mb-6 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base ${isDark ? 'bg-slate-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200'} border focus:ring-2 focus:ring-blue-500 outline-none`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredMentors.length === 0 ? (
              <p className={`col-span-full text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No mentors found
              </p>
            ) : (
              filteredMentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} isDark={isDark} navigate={navigate} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: number; color: string; isDark: boolean; onClick?: () => void }> = ({ icon, label, value, color, isDark, onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl sm:rounded-3xl p-3 sm:p-6 backdrop-blur-sm border shadow-xl transition-all hover:scale-105 ${onClick ? 'cursor-pointer' : ''} ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}
  >
    <div className={`size-10 sm:size-14 bg-gradient-to-br ${color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 shadow-lg`}>
      <span className="material-symbols-outlined text-white text-lg sm:text-2xl">{icon}</span>
    </div>
    <p className={`text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1 sm:mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
    <p className={`text-2xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
  </div>
);

const SessionCard: React.FC<{ session: any; isDark: boolean; navigate: any }> = ({ session, isDark, navigate }) => (
  <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border ${isDark ? 'bg-slate-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="size-10 sm:size-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-white text-lg sm:text-xl">event</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>Session with Mentor</p>
          <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{session.slot || 'TBD'}</p>
        </div>
      </div>
      <button
        onClick={() => navigate('/mentorship/history')}
        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm flex-shrink-0"
      >
        View
      </button>
    </div>
  </div>
);

const QuickActionButton: React.FC<{ icon: string; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl transition-all"
  >
    <span className="material-symbols-outlined text-lg sm:text-xl">{icon}</span>
    <span className="font-bold text-sm sm:text-base">{label}</span>
  </button>
);

const ResourceLink: React.FC<{ icon: string; label: string; to: string; isDark: boolean }> = ({ icon, label, to, isDark }) => (
  <Link
    to={to}
    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
  >
    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg sm:text-xl">{icon}</span>
    <span className={`font-bold text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
  </Link>
);

const MentorCard: React.FC<{ mentor: any; isDark: boolean; navigate: any }> = ({ mentor, isDark, navigate }) => (
  <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border transition-all hover:scale-105 cursor-pointer ${isDark ? 'bg-slate-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
    onClick={() => navigate(`/profile-view/${mentor.id}`)}>
    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
      <div className="size-12 sm:size-14 rounded-full overflow-hidden border-2 border-blue-500/20 flex-shrink-0">
        <img src={mentor.photoURL || 'https://i.pravatar.cc/100'} alt={mentor.displayName} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-black text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{mentor.displayName || mentor.name || 'Mentor'}</p>
        <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{mentor.mentorExpertise || 'General Mentoring'}</p>
      </div>
    </div>
    <p className={`text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
      {mentor.mentorBio || 'Experienced mentor ready to help you succeed.'}
    </p>
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/mentorship/book?mentor=${mentor.id}`);
      }}
      className="w-full px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm"
    >
      Book Session
    </button>
  </div>
);

export default Dashboard;
