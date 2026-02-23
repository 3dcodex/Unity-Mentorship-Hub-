import React, { useEffect, useState } from 'react';
import { db } from '../src/firebase';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface Session {
  id: string;
  mentorId: string;
  menteeId: string;
  slot: string;
  date: number;
  slotDate?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  rating?: number;
  createdAt: any;
}

const SessionHistory: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentors, setMentors] = useState<{[id: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [userPlan, setUserPlan] = useState<'free' | 'basic' | 'premium'>('free');
  const [sessionCount, setSessionCount] = useState({ used: 0, total: 0 });
  const [showReschedule, setShowReschedule] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const [showRating, setShowRating] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (user) {
      loadSessions();
      loadUserPlan();
    }
  }, [user]);

  const loadUserPlan = async () => {
    if (!user) return;
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
      if (!userDoc.empty) {
        const plan = userDoc.docs[0].data()?.subscriptionPlan || 'free';
        setUserPlan(plan);
      }
    } catch (err) {
      console.error('Error loading plan:', err);
    }
  };

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const bookingsQuery = query(collection(db, 'bookings'), where('menteeId', '==', user.uid));
      const snapshot = await getDocs(bookingsQuery);
      const userSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Session[];
      
      setSessions(userSessions);
      
      // Calculate session usage
      const now = new Date();
      const thisMonth = userSessions.filter(s => {
        const sessionDate = new Date(s.slotDate || s.createdAt?.toDate?.() || now);
        return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
      });
      
      const limits = { free: 1, basic: 5, premium: 999 };
      setSessionCount({ used: thisMonth.length, total: limits[userPlan] });
      
      // Load mentor data
      const mentorIds = [...new Set(userSessions.map(s => s.mentorId))];
      if (mentorIds.length > 0) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const mentorMap: {[id: string]: any} = {};
        usersSnapshot.docs.forEach(doc => {
          if (mentorIds.includes(doc.id)) mentorMap[doc.id] = doc.data();
        });
        setMentors(mentorMap);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    try {
      await updateDoc(doc(db, 'bookings', sessionId), { status: 'cancelled' });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'cancelled' as const } : s));
      
      // Create notification
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        await addDoc(collection(db, 'notifications'), {
          userId: session.mentorId,
          type: 'booking',
          title: 'Session Cancelled',
          message: 'A student has cancelled their session with you',
          read: false,
          createdAt: Timestamp.now(),
          actionUrl: '/mentorship/history',
        });
      }
    } catch (err) {
      console.error('Error cancelling session:', err);
      alert('Failed to cancel session');
    }
  };

  const handleSaveNotes = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', sessionId), { notes: noteText });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: noteText } : s));
      setShowNotes(null);
      setNoteText('');
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  const handleSaveRating = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', sessionId), { rating });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, rating } : s));
      setShowRating(null);
      setRating(0);
    } catch (err) {
      console.error('Error saving rating:', err);
    }
  };

  const now = new Date();
  const filteredSessions = sessions.filter(s => {
    const sessionDate = new Date(s.slotDate || s.createdAt?.toDate?.() || now);
    const isUpcoming = sessionDate >= now && s.status !== 'cancelled';
    const isCompleted = sessionDate < now || s.status === 'completed';
    
    if (filter === 'upcoming') return isUpcoming;
    if (filter === 'completed') return isCompleted;
    return true;
  });

  const upcomingCount = sessions.filter(s => {
    const sessionDate = new Date(s.slotDate || s.createdAt?.toDate?.() || now);
    return sessionDate >= now && s.status !== 'cancelled';
  }).length;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center space-y-4">
          <div className="size-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className={`rounded-3xl p-6 backdrop-blur-sm border ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'} shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="size-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="material-symbols-outlined text-white text-2xl">event</span>
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Sessions</p>
                <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{sessions.length}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl p-6 backdrop-blur-sm border ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'} shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="size-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="material-symbols-outlined text-white text-2xl">schedule</span>
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Upcoming</p>
                <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{upcomingCount}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl p-6 backdrop-blur-sm border ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'} shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="size-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="material-symbols-outlined text-white text-2xl">workspace_premium</span>
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This Month</p>
                <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {sessionCount.used}/{sessionCount.total === 999 ? '∞' : sessionCount.total}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-3xl p-6 backdrop-blur-sm border ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'} shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>My Sessions</h1>
            <button
              onClick={() => navigate('/mentorship/book')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Book Session
            </button>
          </div>

          <div className="flex gap-2">
            {['all', 'upcoming', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-xl font-bold text-sm capitalize transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isDark
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className={`rounded-3xl p-12 text-center backdrop-blur-sm border ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'} shadow-xl`}>
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">event_busy</span>
              <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No sessions found</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const mentor = mentors[session.mentorId] || {};
              const sessionDate = new Date(session.slotDate || session.createdAt?.toDate?.() || now);
              const isUpcoming = sessionDate >= now && session.status !== 'cancelled';

              return (
                <div
                  key={session.id}
                  className={`rounded-3xl p-6 backdrop-blur-sm border shadow-xl transition-all hover:scale-[1.01] ${
                    isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Mentor Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="size-16 rounded-2xl overflow-hidden border-2 border-blue-500/20 cursor-pointer hover:scale-110 transition-all"
                        onClick={() => navigate(`/profile-view/${session.mentorId}`)}>
                        <img src={mentor.photoURL || 'https://i.pravatar.cc/100'} className="w-full h-full object-cover" alt="Mentor" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {mentor.displayName || mentor.name || 'Mentor'}
                        </h3>
                        <p className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {mentor.mentorExpertise || mentor.role || 'Expert Mentor'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            📅 {sessionDate.toLocaleDateString()}
                          </span>
                          <span className={`text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            🕐 {session.slot}
                          </span>
                          {session.status === 'cancelled' && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black rounded-full">
                              CANCELLED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {isUpcoming ? (
                        <>
                          <button
                            onClick={() => navigate(`/quick-chat?user=${session.mentorId}`)}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">videocam</span>
                            Join
                          </button>
                          <button
                            onClick={() => setShowReschedule(session.id)}
                            className={`px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-all ${
                              isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelSession(session.id)}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold hover:scale-105 transition-all"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setShowNotes(session.id);
                              setNoteText(session.notes || '');
                            }}
                            className={`px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-all ${
                              isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {session.notes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                          {!session.rating && (
                            <button
                              onClick={() => setShowRating(session.id)}
                              className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl font-bold hover:scale-105 transition-all"
                            >
                              Rate Session
                            </button>
                          )}
                          {session.rating && (
                            <div className="flex items-center gap-1 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-symbols-outlined text-sm ${i < session.rating! ? 'text-yellow-500' : 'text-gray-300'}`}>
                                  star
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes Display */}
                  {session.notes && showNotes !== session.id && (
                    <div className={`mt-4 p-4 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{session.notes}</p>
                    </div>
                  )}

                  {/* Notes Modal */}
                  {showNotes === session.id && (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add your session notes..."
                        className={`w-full p-4 rounded-2xl font-medium outline-none ${
                          isDark ? 'bg-slate-700 text-gray-300 border border-gray-600' : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveNotes(session.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                        >
                          Save Notes
                        </button>
                        <button
                          onClick={() => setShowNotes(null)}
                          className={`px-4 py-2 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rating Modal */}
                  {showRating === session.id && (
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-all hover:scale-110"
                          >
                            <span className={`material-symbols-outlined text-3xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                              star
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveRating(session.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                        >
                          Submit Rating
                        </button>
                        <button
                          onClick={() => setShowRating(null)}
                          className={`px-4 py-2 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;
