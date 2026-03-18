import React, { useEffect, useState, useRef } from 'react';
import { db } from '../src/firebase';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { presenceService } from '../services/presenceService';
import { errorService } from '../services/errorService';
import { useToast } from '../components/AdminToast';

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
  createdAt: Timestamp | Date;
  archivedBy?: Record<string, boolean>;
  bookmarkedBy?: Record<string, boolean>;
  hiddenBy?: Record<string, boolean>;
}

const SessionHistory: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mentors, setMentors] = useState<{[id: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled' | 'bookmarked' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [userPlan, setUserPlan] = useState<'free' | 'basic' | 'premium'>('free');
  const [sessionCount, setSessionCount] = useState({ used: 0, total: 0 });
  const [showReschedule, setShowReschedule] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const [showRating, setShowRating] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [rating, setRating] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice'>('video');
  const [callMentorId, setCallMentorId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{[userId: string]: boolean}>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary';
  } | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { showToast, ToastComponent } = useToast();

  const openConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = 'Confirm',
    confirmVariant: 'danger' | 'primary' = 'primary'
  ) => {
    setConfirmDialog({ title, message, onConfirm, confirmLabel, confirmVariant });
  };

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
      errorService.handleError(err, 'Error loading plan');
    }
  };

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load sessions where user is the student
      const studentQuery = query(
        collection(db, 'bookings'),
        where('studentId', '==', user.uid)
      );
      const studentSnapshot = await getDocs(studentQuery);
      const studentSessions = studentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        menteeId: doc.data().studentId,
        slot: doc.data().scheduledTime,
        date: new Date(doc.data().scheduledDate).getDate(),
        slotDate: doc.data().scheduledDate,
      })) as Session[];
      
      // Load sessions where user is the mentor
      const mentorQuery = query(
        collection(db, 'bookings'),
        where('mentorId', '==', user.uid)
      );
      const mentorSnapshot = await getDocs(mentorQuery);
      const mentorSessions = mentorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        menteeId: doc.data().studentId,
        slot: doc.data().scheduledTime,
        date: new Date(doc.data().scheduledDate).getDate(),
        slotDate: doc.data().scheduledDate,
      })) as Session[];
      
      // Also load old bookings for backward compatibility
      const oldStudentQuery = query(collection(db, 'bookings'), where('menteeId', '==', user.uid));
      const oldStudentSnapshot = await getDocs(oldStudentQuery);
      const oldStudentSessions = oldStudentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Session[];
      
      const oldMentorQuery = query(collection(db, 'bookings'), where('mentorId', '==', user.uid));
      const oldMentorSnapshot = await getDocs(oldMentorQuery);
      const oldMentorSessions = oldMentorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Session[];
      
      const allSessions = [...studentSessions, ...mentorSessions, ...oldStudentSessions, ...oldMentorSessions];
      // Remove duplicates based on id
      const uniqueSessions = allSessions.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      );
      setSessions(uniqueSessions);
      
      // Calculate session usage
      const now = new Date();
      const thisMonth = uniqueSessions.filter(s => {
        const sessionDate = new Date(s.slotDate || s.createdAt?.toDate?.() || now);
        return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
      });
      
      const limits = { free: 1, basic: 5, premium: 999 };
      setSessionCount({ used: thisMonth.length, total: limits[userPlan] });
      
      // Load mentor/student data and track their online status
      const userIds = [...new Set([
        ...uniqueSessions.map(s => s.mentorId),
        ...uniqueSessions.map(s => s.menteeId)
      ].filter(Boolean))];
      
      if (userIds.length > 0) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userMap: {[id: string]: any} = {};
        usersSnapshot.docs.forEach(doc => {
          if (userIds.includes(doc.id)) userMap[doc.id] = doc.data();
        });
        setMentors(userMap);
        
        // Listen to presence for all users
        userIds.forEach(userId => {
          if (userId !== user.uid) {
            presenceService.listenToUserStatus(userId, (isOnline) => {
              setOnlineUsers(prev => ({ ...prev, [userId]: isOnline }));
            });
          }
        });
      }
    } catch (err) {
      errorService.handleError(err, 'Error loading sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    openConfirmDialog(
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      async () => {
        try {
          await updateDoc(doc(db, 'bookings', sessionId), { status: 'cancelled' });
          setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'cancelled' as const } : s));

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
          showToast('Session cancelled successfully', 'success');
        } catch (err) {
          errorService.handleError(err, 'Error cancelling session');
          showToast('Failed to cancel session', 'error');
        }
      },
      'Cancel Session',
      'danger'
    );
  };

  const isHiddenForUser = (session: Session) => {
    if (!user) return false;
    return Boolean(session.hiddenBy?.[user.uid]);
  };

  const isArchivedForUser = (session: Session) => {
    if (!user) return false;
    return Boolean(session.archivedBy?.[user.uid]);
  };

  const isBookmarkedForUser = (session: Session) => {
    if (!user) return false;
    return Boolean(session.bookmarkedBy?.[user.uid]);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    openConfirmDialog(
      'Delete From History',
      'Delete this session from your history view?',
      async () => {
        try {
          await updateDoc(doc(db, 'bookings', sessionId), {
            [`hiddenBy.${user.uid}`]: true,
            updatedAt: Timestamp.now(),
          });
          setSessions(prev => prev.map(s => s.id === sessionId
            ? { ...s, hiddenBy: { ...(s.hiddenBy || {}), [user.uid]: true } }
            : s
          ));
          showToast('Session removed from your history', 'success');
        } catch (err) {
          errorService.handleError(err, 'Error deleting session from history');
          showToast('Failed to remove session from your history', 'error');
        }
      },
      'Delete',
      'danger'
    );
  };

  const toggleBookmark = async (sessionId: string) => {
    if (!user) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const nextValue = !isBookmarkedForUser(session);
    try {
      await updateDoc(doc(db, 'bookings', sessionId), {
        [`bookmarkedBy.${user.uid}`]: nextValue,
        updatedAt: Timestamp.now(),
      });
      setSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, bookmarkedBy: { ...(s.bookmarkedBy || {}), [user.uid]: nextValue } }
        : s
      ));
    } catch (err) {
      errorService.handleError(err, 'Error updating bookmark');
      showToast('Failed to update bookmark', 'error');
    }
  };

  const toggleArchive = async (sessionId: string) => {
    if (!user) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const nextValue = !isArchivedForUser(session);
    try {
      await updateDoc(doc(db, 'bookings', sessionId), {
        [`archivedBy.${user.uid}`]: nextValue,
        updatedAt: Timestamp.now(),
      });
      setSessions(prev => prev.map(s => s.id === sessionId
        ? { ...s, archivedBy: { ...(s.archivedBy || {}), [user.uid]: nextValue } }
        : s
      ));
    } catch (err) {
      errorService.handleError(err, 'Error updating archive');
      showToast('Failed to update archive status', 'error');
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    if (filteredSessions.length === 0) return;
    openConfirmDialog(
      'Clear History View',
      `Clear ${filteredSessions.length} session(s) from your current history view?`,
      async () => {
        try {
          const batch = writeBatch(db);
          filteredSessions.forEach((session) => {
            batch.update(doc(db, 'bookings', session.id), {
              [`hiddenBy.${user.uid}`]: true,
              updatedAt: Timestamp.now(),
            });
          });
          await batch.commit();

          const ids = new Set(filteredSessions.map(s => s.id));
          setSessions(prev => prev.map(s => ids.has(s.id)
            ? { ...s, hiddenBy: { ...(s.hiddenBy || {}), [user.uid]: true } }
            : s
          ));
          showToast('History cleared for current view', 'success');
        } catch (err) {
          errorService.handleError(err, 'Error clearing history');
          showToast('Failed to clear history', 'error');
        }
      },
      'Clear',
      'danger'
    );
  };

  const handleRescheduleSession = async (sessionId: string) => {
    if (!rescheduleDate || !rescheduleTime) {
      showToast('Please select both date and time', 'warning');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'bookings', sessionId), {
        scheduledDate: rescheduleDate,
        scheduledTime: rescheduleTime,
        slotDate: rescheduleDate,
        slot: rescheduleTime,
        updatedAt: Timestamp.now()
      });
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, scheduledDate: rescheduleDate, scheduledTime: rescheduleTime, slotDate: rescheduleDate, slot: rescheduleTime }
          : s
      ));
      
      // Notify mentor
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        await addDoc(collection(db, 'notifications'), {
          userId: session.mentorId,
          type: 'booking',
          title: 'Session Rescheduled',
          message: `A student has rescheduled their session to ${rescheduleDate} at ${rescheduleTime}`,
          read: false,
          createdAt: Timestamp.now(),
          actionUrl: '/mentorship/history',
        });
      }
      
      setShowReschedule(null);
      setRescheduleDate('');
      setRescheduleTime('');
      showToast('Session rescheduled successfully', 'success');
    } catch (err) {
      errorService.handleError(err, 'Error rescheduling session');
      showToast('Failed to reschedule session', 'error');
    }
  };

  const handleSaveNotes = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', sessionId), { notes: noteText });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: noteText } : s));
      setShowNotes(null);
      setNoteText('');
    } catch (err) {
      errorService.handleError(err, 'Error saving notes');
    }
  };

  const handleSaveRating = async (sessionId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', sessionId), { rating });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, rating } : s));
      setShowRating(null);
      setRating(0);
    } catch (err) {
      errorService.handleError(err, 'Error saving rating');
    }
  };

  const startCall = async (type: 'video' | 'voice', mentorId: string) => {
    // Check if mentor is online
    const isOnline = onlineUsers[mentorId];
    if (!isOnline) {
      const mentorName = mentors[mentorId]?.displayName || mentors[mentorId]?.name || 'Mentor';
      showToast(`${mentorName} is currently offline. They will receive a call notification.`, 'info');
      
      // Send offline call notification
      await addDoc(collection(db, 'notifications'), {
        userId: mentorId,
        type: 'missed_call',
        title: `Missed ${type} call`,
        message: `${user?.displayName || user?.email} tried to call you for a mentorship session while you were offline`,
        read: false,
        createdAt: Timestamp.now(),
        callerId: user?.uid,
        callType: type
      });
      return;
    }
    
    try {
      setCallType(type);
      setCallMentorId(mentorId);
      
      // Get user media
      const constraints = {
        video: type === 'video',
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Send call notification to mentor
      await addDoc(collection(db, 'notifications'), {
        userId: mentorId,
        type: 'call',
        title: `Incoming ${type} call`,
        message: `${user?.displayName || user?.email} is calling you for a mentorship session`,
        read: false,
        createdAt: Timestamp.now(),
        callerId: user?.uid,
        callType: type
      });
      
      setShowCallModal(true);
    } catch (err) {
      errorService.handleError(err, 'Error starting call');
      showToast('Failed to start call. Check camera/microphone permissions.', 'error');
      endCall();
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setShowCallModal(false);
    setCallMentorId(null);
  };

  const now = new Date();
  const visibleSessions = sessions.filter(s => !isHiddenForUser(s));
  const filteredSessions = visibleSessions.filter(s => {
    const sessionDate = new Date(s.slotDate || s.createdAt?.toDate?.() || now);
    const isUpcoming = sessionDate >= now && s.status !== 'cancelled';
    const isCompleted = sessionDate < now || s.status === 'completed';
    const isCancelled = s.status === 'cancelled';
    const isArchived = isArchivedForUser(s);
    const isBookmarked = isBookmarkedForUser(s);

    if (filter === 'upcoming') return isUpcoming;
    if (filter === 'completed') return isCompleted;
    if (filter === 'cancelled') return isCancelled;
    if (filter === 'bookmarked') return isBookmarked;
    if (filter === 'archived') return isArchived;
    return true;
  }).filter((s) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const isUserMentor = user?.uid === s.mentorId;
    const otherUser = isUserMentor ? mentors[s.menteeId] || {} : mentors[s.mentorId] || {};
    const name = (otherUser.displayName || otherUser.name || '').toLowerCase();
    const expertise = (otherUser.mentorExpertise || '').toLowerCase();
    const status = (s.status || '').toLowerCase();
    return name.includes(term) || expertise.includes(term) || status.includes(term);
  }).sort((a, b) => {
    const timeA = new Date(a.slotDate || a.createdAt?.toDate?.() || now).getTime();
    const timeB = new Date(b.slotDate || b.createdAt?.toDate?.() || now).getTime();
    return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const upcomingCount = visibleSessions.filter(s => {
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
                <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{visibleSessions.length}</p>
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

          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 flex flex-wrap gap-2">
              {['all', 'upcoming', 'completed', 'cancelled', 'bookmarked', 'archived'].map((f) => (
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

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by mentor, expertise, status"
                className={`w-full px-4 py-2 rounded-xl text-sm font-medium outline-none ${
                  isDark ? 'bg-slate-700 text-gray-200 border border-gray-600' : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              />
              <button
                onClick={() => setSortBy(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className={`px-4 py-2 rounded-xl font-bold text-sm ${
                  isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
              </button>
              <button
                onClick={handleClearHistory}
                disabled={filteredSessions.length === 0}
                className="px-4 py-2 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear View
              </button>
            </div>
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
              const isUserMentor = user?.uid === session.mentorId;
              const otherUser = isUserMentor 
                ? mentors[session.menteeId] || {}
                : mentors[session.mentorId] || {};
              const otherUserId = isUserMentor ? session.menteeId : session.mentorId;
              const sessionDate = new Date(session.slotDate || session.createdAt?.toDate?.() || now);
              const isUpcoming = sessionDate >= now && session.status !== 'cancelled';
              const isArchived = isArchivedForUser(session);
              const isBookmarked = isBookmarkedForUser(session);
              const isActionableUpcoming = isUpcoming && !isArchived;

              return (
                <div
                  key={session.id}
                  className={`rounded-2xl sm:rounded-3xl p-3 sm:p-6 backdrop-blur-sm border shadow-xl transition-all ${
                    isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:gap-6">
                    {/* User Info */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      <div className="size-10 sm:size-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-blue-500/20 cursor-pointer transition-all bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0"
                        onClick={() => navigate(`/profile-view/${otherUserId}`)}>
                        {otherUser.photoURL ? (
                          <img src={otherUser.photoURL} className="w-full h-full object-cover" alt={isUserMentor ? 'Student' : 'Mentor'} />
                        ) : (
                          <span className="text-base sm:text-2xl">
                            {(otherUser.displayName || otherUser.name || (isUserMentor ? 'Student' : 'Mentor'))[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-sm sm:text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {otherUser.displayName || otherUser.name || (isUserMentor ? 'Student' : 'Mentor')}
                        </h3>
                        <p className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {isUserMentor ? 'Your Student' : (otherUser.mentorExpertise || otherUser.role || 'Expert Mentor')}
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
                          {isArchived && (
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-black rounded-full">
                              ARCHIVED
                            </span>
                          )}
                          {isBookmarked && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-black rounded-full">
                              BOOKMARKED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {isActionableUpcoming ? (
                        <>
                          <button
                            onClick={() => startCall('video', otherUserId)}
                            className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">videocam</span>
                            <span className="hidden sm:inline">Video</span>
                          </button>
                          <button
                            onClick={() => startCall('voice', otherUserId)}
                            className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">call</span>
                            <span className="hidden sm:inline">Voice</span>
                          </button>
                          <button
                            onClick={() => navigate(`/quick-chat?user=${otherUserId}`)}
                            className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">chat</span>
                            <span className="hidden sm:inline">Msg</span>
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
                            className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm"
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

                      <button
                        onClick={() => toggleBookmark(session.id)}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${
                          isBookmarked
                            ? 'bg-blue-600 text-white'
                            : isDark
                            ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                      </button>

                      <button
                        onClick={() => toggleArchive(session.id)}
                        className={`px-4 py-2 rounded-xl font-bold transition-all ${
                          isArchived
                            ? 'bg-amber-600 text-white'
                            : isDark
                            ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isArchived ? 'Unarchive' : 'Archive'}
                      </button>

                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Reschedule Modal */}
                  {showReschedule === session.id && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            New Date
                          </label>
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={`w-full p-3 rounded-xl font-medium outline-none ${
                              isDark ? 'bg-slate-700 text-gray-300 border border-gray-600' : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            New Time
                          </label>
                          <select
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className={`w-full p-3 rounded-xl font-medium outline-none ${
                              isDark ? 'bg-slate-700 text-gray-300 border border-gray-600' : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                          >
                            <option value="">Select time</option>
                            {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRescheduleSession(session.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => {
                            setShowReschedule(null);
                            setRescheduleDate('');
                            setRescheduleTime('');
                          }}
                          className={`px-4 py-2 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

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
      
      {/* Call Modal */}
      {showCallModal && callMentorId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className={`w-full max-w-4xl h-3/4 rounded-2xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {mentors[callMentorId]?.photoURL ? (
                    <img src={mentors[callMentorId].photoURL} alt={mentors[callMentorId]?.displayName} className="w-full h-full object-cover" />
                  ) : (
                    (mentors[callMentorId]?.displayName || mentors[callMentorId]?.name || 'M')[0]
                  )}
                </div>
                <div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {mentors[callMentorId]?.displayName || mentors[callMentorId]?.name || 'Mentor'}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {callType === 'video' ? 'Video Call' : 'Voice Call'} - Mentorship Session
                  </p>
                </div>
              </div>
              <button
                onClick={endCall}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">call_end</span>
              </button>
            </div>
            
            <div className="flex-1 p-4 h-full">
              {callType === 'video' ? (
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 text-white text-sm font-bold bg-black/50 px-2 py-1 rounded">
                      You
                    </div>
                  </div>
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 text-white text-sm font-bold bg-black/50 px-2 py-1 rounded">
                      {mentors[callMentorId]?.displayName || mentors[callMentorId]?.name || 'Mentor'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="size-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 overflow-hidden">
                      {mentors[callMentorId]?.photoURL ? (
                        <img src={mentors[callMentorId].photoURL} alt={mentors[callMentorId]?.displayName} className="w-full h-full object-cover" />
                      ) : (
                        (mentors[callMentorId]?.displayName || mentors[callMentorId]?.name || 'M')[0]
                      )}
                    </div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {mentors[callMentorId]?.displayName || mentors[callMentorId]?.name || 'Mentor'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Voice call in progress...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className={`p-4 border-t flex justify-center gap-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={endCall}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined">call_end</span>
                End Call
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{confirmDialog.title}</h3>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{confirmDialog.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className={`px-4 py-2 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                className={`px-4 py-2 rounded-xl font-bold text-white ${confirmDialog.confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastComponent}
    </div>
  );
};

export default SessionHistory;
