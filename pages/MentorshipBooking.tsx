import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../src/firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';

const MentorshipBooking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(25);
  const [selectedTime, setSelectedTime] = useState('01:00 PM');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [endDate, setEndDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<'free' | 'basic' | 'premium' | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryParams = new URLSearchParams(location.search);
  const mentorId = queryParams.get('mentor') || '';
  const [mentor, setMentor] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkAccess();
    }
  }, [user]);

  useEffect(() => {
    if (mentorId && hasAccess) {
      getDoc(doc(db, 'users', mentorId)).then(docSnap => {
        if (docSnap.exists()) setMentor(docSnap.data());
      });
    }
  }, [mentorId, hasAccess]);

  const checkAccess = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Check if user has completed billing and has a plan
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const plan = userData?.subscriptionPlan || 'free';
      setUserPlan(plan);

      // Check if user has any paid transactions
      const txnQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        where('status', '==', 'paid')
      );
      const txnSnapshot = await getDocs(txnQuery);
      const hasPaidTransactions = !txnSnapshot.empty;

      // Grant access if user has basic/premium plan OR has paid transactions
      setHasAccess(plan !== 'free' || hasPaidTransactions);
    } catch (err) {
      console.error('Error checking access:', err);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const dates = [
    { day: 'MON', date: 21 },
    { day: 'TUE', date: 22 },
    { day: 'WED', date: 23 },
    { day: 'THU', date: 24 },
    { day: 'FRI', date: 25 },
    { day: 'SAT', date: 26 },
    { day: 'SUN', date: 27 },
  ];

  const timeSlots = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

  const handleConfirm = async () => {
    if (!user || !mentorId) return;
    try {
      const sessionDoc = await addDoc(collection(db, 'bookings'), {
        menteeId: user.uid,
        mentorId,
        slot: selectedTime,
        date: selectedDate,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        endDate: isRecurring ? endDate : null,
        status: 'confirmed',
        createdAt: new Date(),
      });
      
      // Create connection and conversation
      const { createConnection, createConversation } = await import('../services/messagingService');
      await createConnection(user.uid, mentorId, sessionDoc.id);
      await createConversation(user.uid, mentorId, sessionDoc.id);
      
      // Create notification for mentor
      try {
        const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
        const menteeDoc = await getDoc(firestoreDoc(db, 'users', user.uid));
        const menteeName = menteeDoc.data()?.displayName || menteeDoc.data()?.name || 'A student';
        const menteePhoto = menteeDoc.data()?.photoURL || '';
        
        await addDoc(collection(db, 'notifications'), {
          userId: mentorId,
          type: 'booking',
          title: 'New Session Booked',
          message: `${menteeName} has booked a session with you on Oct ${selectedDate} at ${selectedTime}`,
          read: false,
          createdAt: new Date(),
          actionUrl: `/mentorship/history`,
          fromUser: user.uid,
          fromUserName: menteeName,
          fromUserPhoto: menteePhoto,
        });
        
        // Create confirmation notification for mentee
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          type: 'booking',
          title: 'Session Confirmed',
          message: `Your session with ${mentor?.displayName || 'your mentor'} on Oct ${selectedDate} at ${selectedTime} has been confirmed`,
          read: false,
          createdAt: new Date(),
          actionUrl: `/mentorship/history`,
          fromUser: mentorId,
          fromUserName: mentor?.displayName || 'Mentor',
          fromUserPhoto: mentor?.photoURL || '',
        });
      } catch (err) {
        console.error('Error creating notifications:', err);
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/quick-chat?user=${mentorId}`);
      }, 2000);
    } catch (err) {
      console.error('Booking error:', err);
      alert('Failed to book session. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center space-y-4">
          <div className="size-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className={`max-w-2xl w-full rounded-3xl p-12 text-center space-y-6 shadow-2xl backdrop-blur-xl relative z-10 border animate-in zoom-in duration-500 ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
          <div className="size-24 bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/50 animate-bounce">
            <span className="material-symbols-outlined text-white text-5xl">lock</span>
          </div>
          <h1 className={`text-4xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent`}>Access Restricted</h1>
          <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            You need to complete billing and select a payment plan to book mentorship sessions.
          </p>
          <div className={`rounded-2xl p-6 backdrop-blur-sm ${isDark ? 'bg-slate-700/50 border border-slate-600' : 'bg-blue-50/50 border border-blue-100'}`}>
            <p className={`text-sm font-bold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>To get access:</p>
            <ul className={`space-y-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li className="flex items-center gap-3 animate-in slide-in-from-left-4" style={{animationDelay: '100ms'}}>
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>Complete your billing information</span>
              </li>
              <li className="flex items-center gap-3 animate-in slide-in-from-left-4" style={{animationDelay: '200ms'}}>
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>Select a subscription plan (Basic or Premium)</span>
              </li>
              <li className="flex items-center gap-3 animate-in slide-in-from-left-4" style={{animationDelay: '300ms'}}>
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>Or make a session payment</span>
              </li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/billing')}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-blue-500/50 hover:scale-105 hover:shadow-blue-500/70 transition-all flex items-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="material-symbols-outlined relative z-10">payments</span>
              <span className="relative z-10">Go to Billing</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-8 py-4 rounded-2xl font-black border-2 transition-all hover:scale-105 ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-slate-700 hover:border-gray-500'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
              }`}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 relative overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border animate-pulse ${
            isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'
          }`}>
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl animate-bounce">event</span>
            <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${userPlan === 'premium' ? 'from-purple-600 to-pink-600' : 'from-blue-600 to-indigo-600'} bg-clip-text text-transparent`}>
              {userPlan === 'premium' ? '✨ Premium Member' : userPlan === 'basic' ? '⭐ Basic Member' : '🎯 Active User'}
            </span>
          </div>
          <h1 className={`text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent`}>Book Your Session</h1>
          <p className={`font-medium max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose a time that works for you and your mentor ✨
          </p>
        </div>

        {showSuccess && (
          <div className={`rounded-3xl p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-500 border relative overflow-hidden ${
            isDark ? 'bg-slate-800/90 border-gray-700' : 'bg-white/90 border-white/50'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 animate-pulse"></div>
            <div className="size-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-green-500/50 animate-bounce relative z-10">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <h3 className={`text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent relative z-10`}>Booking Confirmed! 🎉</h3>
            <p className={`font-medium relative z-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your session has been scheduled. Redirecting to chat...
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Booking Area */}
          <div className={`lg:col-span-2 rounded-3xl p-8 shadow-2xl backdrop-blur-sm border animate-in fade-in slide-in-from-left-8 duration-700 ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
            {/* Mentor Info */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700 group">
              <div
                className="size-16 rounded-2xl overflow-hidden border-2 border-blue-500/20 cursor-pointer hover:border-blue-500 transition-all hover:scale-110 hover:rotate-3 hover:shadow-xl hover:shadow-blue-500/50"
                onClick={() => mentorId && navigate(`/profile-view/${mentorId}`)}
              >
                <img src={mentor?.photoURL || 'https://i.pravatar.cc/100'} className="w-full h-full object-cover" alt="Mentor" />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}>
                  {mentor?.displayName || 'Mentor'}
                </h3>
                <p className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  ⭐ {mentor?.mentorExpertise || mentor?.role || 'Expert Mentor'}
                </p>
              </div>
            </div>

            {/* Date Selection */}
            <div className="mb-8">
              <h4 className={`text-sm font-black mb-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>Select Date</h4>
              <div className="grid grid-cols-7 gap-2">
                {dates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={`flex flex-col items-center py-4 rounded-xl transition-all hover:scale-110 ${
                      selectedDate === d.date
                        ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-blue-500/50 scale-105 animate-pulse'
                        : isDark
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:shadow-lg'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:shadow-lg'
                    }`}
                  >
                    <span className="text-xs font-black mb-1">{d.day}</span>
                    <span className="text-lg font-black">{d.date}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div className="mb-8">
              <h4 className={`text-sm font-black mb-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>Available Times</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-4 rounded-xl font-bold transition-all hover:scale-105 relative overflow-hidden group ${
                      selectedTime === time
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/50'
                        : isDark
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:shadow-lg'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:shadow-lg'
                    }`}
                  >
                    {selectedTime === time && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    )}
                    <span className="relative z-10">{time}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recurring Options */}
            <div className={`pt-8 border-t space-y-4 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`size-6 rounded flex items-center justify-center transition-all ${
                    isRecurring ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700' : 'bg-gray-100'
                  }`}
                >
                  {isRecurring && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
                <label className={`font-bold cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-900'}`} onClick={() => setIsRecurring(!isRecurring)}>
                  Make this a recurring session
                </label>
              </div>

              {isRecurring && (
                <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                  <div>
                    <label className={`text-xs font-black mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Frequency</label>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setRecurrenceType(type)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                            recurrenceType === type
                              ? 'bg-blue-600 text-white'
                              : isDark
                              ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-black mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full py-2 px-4 rounded-lg font-bold outline-none ${
                        isDark
                          ? 'bg-slate-700 text-gray-300 border border-gray-600'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleConfirm}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-5 rounded-2xl font-black shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="material-symbols-outlined relative z-10">event_available</span>
              <span className="relative z-10">Confirm Booking ✨</span>
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className={`rounded-3xl p-6 relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900' : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'} text-white shadow-2xl`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
              <div className="size-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 animate-pulse relative z-10">
                <span className="material-symbols-outlined text-2xl">info</span>
              </div>
              <h3 className="text-xl font-black mb-2 relative z-10">Session Details ✨</h3>
              <div className="space-y-3 text-sm relative z-10">
                <div className="flex justify-between">
                  <span className="opacity-80">Date:</span>
                  <span className="font-bold">Oct {selectedDate}, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Time:</span>
                  <span className="font-bold">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Duration:</span>
                  <span className="font-bold">60 minutes</span>
                </div>
                {isRecurring && (
                  <div className="flex justify-between">
                    <span className="opacity-80">Recurring:</span>
                    <span className="font-bold capitalize">{recurrenceType}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-3xl p-6 backdrop-blur-sm border ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50 shadow-xl'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-green-500 text-2xl animate-pulse">verified</span>
                <h3 className={`font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent`}>Your Plan</h3>
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {userPlan === 'premium'
                  ? 'Unlimited sessions with Premium'
                  : userPlan === 'basic'
                  ? '5 sessions/month with Basic'
                  : 'Pay per session'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorshipBooking;
