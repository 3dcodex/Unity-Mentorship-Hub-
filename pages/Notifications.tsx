import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../src/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';

interface Notification {
  id: string;
  type: 'message' | 'booking' | 'mentor_request' | 'session_reminder' | 'payment' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  actionUrl?: string;
  fromUser?: string;
  fromUserName?: string;
  fromUserPhoto?: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(notifs);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifs.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return 'chat';
      case 'booking': return 'event';
      case 'mentor_request': return 'person_add';
      case 'session_reminder': return 'alarm';
      case 'payment': return 'payments';
      case 'system': return 'info';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message': return 'from-blue-500 to-indigo-500';
      case 'booking': return 'from-green-500 to-emerald-500';
      case 'mentor_request': return 'from-purple-500 to-pink-500';
      case 'session_reminder': return 'from-orange-500 to-red-500';
      case 'payment': return 'from-yellow-500 to-amber-500';
      case 'system': return 'from-gray-500 to-slate-500';
      default: return 'from-blue-500 to-indigo-500';
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center space-y-4">
          <div className="size-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className={`rounded-3xl p-8 shadow-xl backdrop-blur-sm border ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="size-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="material-symbols-outlined text-white text-3xl">notifications</span>
              </div>
              <div>
                <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h1>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up! 🎉'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all hover:scale-105"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : isDark
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : isDark
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className={`rounded-3xl p-12 text-center shadow-xl backdrop-blur-sm border ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">notifications_off</span>
              <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`rounded-2xl p-6 shadow-lg backdrop-blur-sm border cursor-pointer transition-all hover:scale-[1.02] ${
                  notif.read
                    ? isDark
                      ? 'bg-slate-800/50 border-gray-700/50'
                      : 'bg-white/50 border-gray-200/50'
                    : isDark
                    ? 'bg-slate-800/80 border-blue-500/30'
                    : 'bg-white/80 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`size-12 bg-gradient-to-br ${getNotificationColor(notif.type)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="material-symbols-outlined text-white text-xl">{getNotificationIcon(notif.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{notif.title}</h3>
                      {!notif.read && (
                        <span className="size-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                      )}
                    </div>
                    <p className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notif.message}
                    </p>
                    
                    {notif.fromUserName && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="size-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                          {notif.fromUserPhoto ? (
                            <img src={notif.fromUserPhoto} alt={notif.fromUserName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                              {notif.fromUserName[0]}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {notif.fromUserName}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {notif.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                      </span>
                      {notif.actionUrl && (
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          View <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
