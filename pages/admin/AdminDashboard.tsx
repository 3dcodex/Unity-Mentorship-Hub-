import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';
import { usePermissions } from '../../src/hooks/usePermissions';
import { formatRole, formatNumber } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import { errorService } from '../../services/errorService';

interface DashboardStats {
  totalUsers: number;
  activeMentors: number;
  totalSessions: number;
  monthlyRevenue: number;
  pendingApprovals: number;
  activeReports: number;
  openTickets: number;
  activeGroups: number;
  publishedPosts: number;
  completedBookingsThisMonth: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, permissions, loading } = usePermissions(user?.uid);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeMentors: 0,
    totalSessions: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
    activeReports: 0,
    openTickets: 0,
    activeGroups: 0,
    publishedPosts: 0,
    completedBookingsThisMonth: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (!loading) {
      loadDashboardStats();
      
      // Set up real-time listeners for key metrics
      const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setStats(prev => ({
          ...prev,
          totalUsers: snapshot.size,
          activeMentors: snapshot.docs.filter(d => 
            (d.data().role === 'mentor' || d.data().role === 'professional') && 
            d.data().status === 'active'
          ).length
        }));
        setLastUpdated(new Date());
      });

      const unsubscribeMentorApps = onSnapshot(
        query(collection(db, 'mentorApplications'), where('status', '==', 'pending')),
        (snapshot) => {
          setStats(prev => ({ ...prev, pendingApprovals: snapshot.size }));
          setLastUpdated(new Date());
        }
      );

      const unsubscribeReports = onSnapshot(
        query(collection(db, 'reports'), where('status', 'in', ['open', 'pending', 'in_progress'])),
        (snapshot) => {
          setStats(prev => ({ ...prev, activeReports: snapshot.size }));
          setLastUpdated(new Date());
        }
      );

      const unsubscribeSupportTickets = onSnapshot(
        query(collection(db, 'supportTickets'), where('status', 'in', ['open', 'pending', 'in_progress'])),
        (snapshot) => {
          setStats(prev => ({ ...prev, openTickets: snapshot.size }));
          setLastUpdated(new Date());
        }
      );

      const unsubscribeGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
        setStats(prev => ({ ...prev, activeGroups: snapshot.size }));
        setLastUpdated(new Date());
      });

      const unsubscribePosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
        setStats(prev => ({ ...prev, publishedPosts: snapshot.size }));
        setLastUpdated(new Date());
      });

      const unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedThisMonth = snapshot.docs.filter(doc => {
          const booking = doc.data() as Record<string, any>;
          const status = String(booking.status || '').toLowerCase();
          const timestamp = booking.completedAt?.toDate?.() || booking.updatedAt?.toDate?.() || booking.createdAt?.toDate?.();
          return status === 'completed' && timestamp && timestamp >= monthStart;
        }).length;

        setStats(prev => ({
          ...prev,
          totalSessions: snapshot.size,
          completedBookingsThisMonth: completedThisMonth,
        }));
        setLastUpdated(new Date());
      });

      return () => {
        unsubscribeUsers();
        unsubscribeMentorApps();
        unsubscribeReports();
        unsubscribeSupportTickets();
        unsubscribeGroups();
        unsubscribePosts();
        unsubscribeBookings();
      };
    }
  }, [loading]);

  const loadDashboardStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const mentorAppsSnap = await getDocs(query(collection(db, 'mentorApplications'), where('status', '==', 'pending')));
      const reportsSnap = await getDocs(query(collection(db, 'reports'), where('status', 'in', ['open', 'pending', 'in_progress'])));
      const supportTicketsSnap = await getDocs(query(collection(db, 'supportTickets'), where('status', 'in', ['open', 'pending', 'in_progress'])));
      const groupsSnap = await getDocs(collection(db, 'groups'));
      const postsSnap = await getDocs(collection(db, 'posts'));

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const completedBookingsThisMonth = bookingsSnap.docs.filter(doc => {
        const booking = doc.data() as Record<string, any>;
        const status = String(booking.status || '').toLowerCase();
        const timestamp = booking.completedAt?.toDate?.() || booking.updatedAt?.toDate?.() || booking.createdAt?.toDate?.();
        return status === 'completed' && timestamp && timestamp >= monthStart;
      }).length;

      setStats({
        totalUsers: usersSnap.size,
        activeMentors: usersSnap.docs.filter(d => 
          (String(d.data().role || '').toLowerCase() === 'professional') &&
          d.data().status === 'active'
        ).length,
        totalSessions: bookingsSnap.size,
        monthlyRevenue: 0,
        pendingApprovals: mentorAppsSnap.size,
        activeReports: reportsSnap.size,
        openTickets: supportTicketsSnap.size,
        activeGroups: groupsSnap.size,
        publishedPosts: postsSnap.size,
        completedBookingsThisMonth,
      });
      setLastUpdated(new Date());
    } catch (error) {
      errorService.handleError(error, 'Error loading stats');
      setStats({
        totalUsers: 0,
        activeMentors: 0,
        totalSessions: 0,
        monthlyRevenue: 0,
        pendingApprovals: 0,
        activeReports: 0,
        openTickets: 0,
        activeGroups: 0,
        publishedPosts: 0,
        completedBookingsThisMonth: 0,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-bold mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: 'group', label: 'User Management', path: '/admin/users', gradient: 'from-blue-500 to-blue-600', badge: 0, permission: 'canManageUsers' },
    { icon: 'manage_accounts', label: 'Enhanced User Mgmt', path: '/admin/users-enhanced', gradient: 'from-blue-600 to-indigo-600', badge: 0, permission: 'canManageUsers' },
    { icon: 'support_agent', label: 'User Helper', path: '/admin/user-helper', gradient: 'from-cyan-500 to-blue-600', badge: 0, permission: 'canManageUsers' },
    { icon: 'verified_user', label: 'Mentor Approvals', path: '/admin/mentor-approvals', gradient: 'from-green-500 to-emerald-600', badge: stats.pendingApprovals, permission: 'canManageMentors' },
    { icon: 'event', label: 'Session Management', path: '/admin/sessions', gradient: 'from-purple-500 to-purple-600', badge: 0, permission: 'canManageSessions' },
    { icon: 'payments', label: 'Payments & Billing', path: '/admin/payments', gradient: 'from-yellow-500 to-orange-600', badge: 0, permission: 'canManagePayments' },
    { icon: 'account_balance_wallet', label: 'Payouts', path: '/admin/payouts', gradient: 'from-teal-500 to-cyan-600', badge: 0, permission: 'canManagePayouts' },
    { icon: 'report', label: 'Reports & Disputes', path: '/admin/reports', gradient: 'from-red-500 to-pink-600', badge: stats.activeReports, permission: 'canManageReports' },
    { icon: 'support_agent', label: 'Support Tickets', path: '/admin/support', gradient: 'from-blue-500 to-indigo-600', badge: stats.openTickets, permission: 'canAccessAdminPanel' },
    { icon: 'analytics', label: 'Analytics', path: '/admin/analytics', gradient: 'from-indigo-500 to-purple-600', badge: 0, permission: 'canViewAnalytics' },
    { icon: 'insights', label: 'Advanced Analytics', path: '/admin/advanced-analytics', gradient: 'from-purple-600 to-pink-600', badge: 0, permission: 'canViewAnalytics' },
    { icon: 'history', label: 'Activity Log', path: '/admin/activity-log', gradient: 'from-gray-600 to-gray-700', badge: 0, permission: 'canAccessAdminPanel' },
    { icon: 'star', label: 'Reviews & Ratings', path: '/admin/reviews', gradient: 'from-orange-500 to-red-600', badge: 0, permission: 'canManageReviews' },
    { icon: 'category', label: 'Categories', path: '/admin/categories', gradient: 'from-pink-500 to-rose-600', badge: 0, permission: 'canManageCategories' },
    { icon: 'notifications', label: 'Notifications', path: '/admin/notifications', gradient: 'from-cyan-500 to-blue-600', badge: 0, permission: 'canAccessAdminPanel' },
    { icon: 'email', label: 'Communication Center', path: '/admin/communication', gradient: 'from-green-500 to-teal-600', badge: 0, permission: 'canAccessAdminPanel' },
    { icon: 'mail', label: 'Newsletter', path: '/admin/newsletter', gradient: 'from-purple-500 to-pink-600', badge: 0, permission: 'canAccessAdminPanel' },
    { icon: 'gavel', label: 'Content Moderation', path: '/admin/moderation', gradient: 'from-red-600 to-orange-600', badge: 0, permission: 'canAccessAdminPanel' },
    { icon: 'monitor_heart', label: 'System Health', path: '/admin/system-health', gradient: 'from-emerald-500 to-green-600', badge: 0, permission: 'canAccessAdminPanel' },
    { icon: 'security', label: 'Security & Logs', path: '/admin/security', gradient: 'from-gray-600 to-gray-700', badge: 0, permission: 'canViewSecurityLogs' },
    { icon: 'settings', label: 'Platform Settings', path: '/admin/settings', gradient: 'from-slate-600 to-slate-700', badge: 0, permission: 'canManageSettings' },
  ];

  const statCards = [
    {
      label: 'Total Users',
      value: formatNumber(stats.totalUsers),
      icon: 'group',
      gradient: 'from-blue-500 to-blue-600',
      hint: `${formatNumber(stats.activeMentors)} active professionals`,
      path: '/admin/users',
    },
    {
      label: 'Total Bookings',
      value: formatNumber(stats.totalSessions),
      icon: 'event',
      gradient: 'from-purple-500 to-purple-600',
      hint: `${formatNumber(stats.completedBookingsThisMonth)} completed this month`,
      path: '/admin/sessions',
    },
    {
      label: 'Open Reviews',
      value: formatNumber(stats.pendingApprovals + stats.activeReports + stats.openTickets),
      icon: 'rule',
      gradient: 'from-red-500 to-pink-600',
      hint: `${stats.pendingApprovals} mentor + ${stats.activeReports} reports + ${stats.openTickets} tickets`,
      path: '/admin/reports',
    },
    {
      label: 'Community Health',
      value: formatNumber(stats.activeGroups + stats.publishedPosts),
      icon: 'forum',
      gradient: 'from-emerald-500 to-green-600',
      hint: `${formatNumber(stats.activeGroups)} groups, ${formatNumber(stats.publishedPosts)} posts`,
      path: '/admin/moderation',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              Admin Command Center
            </h1>
            <p className="text-sm sm:text-base text-gray-600 font-medium">Manage your Unity Mentorship Hub platform</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] sm:text-xs font-bold rounded-full uppercase">
                {formatRole(String(role))}
              </span>
              <span className="text-gray-500 text-xs sm:text-sm">• {permissions.maxRoleLevel > 0 ? `Level ${permissions.maxRoleLevel}` : 'Standard Access'}</span>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <button className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl sm:rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-green-500/30 text-sm sm:text-base flex-shrink-0">
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg sm:text-xl">download</span>
              Export Report
            </span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((stat, idx) => (
            <div 
              key={idx} 
              onClick={() => navigate(stat.path)}
              className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl hover:shadow-2xl transition-all active:scale-95 sm:hover:scale-105 border border-white/50 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className={`size-9 sm:size-14 bg-gradient-to-br ${stat.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-base sm:text-2xl">{stat.icon}</span>
                </div>
                <span className="text-slate-600 text-[9px] sm:text-xs font-semibold bg-slate-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">Live</span>
              </div>
              <p className="text-gray-500 text-[10px] sm:text-sm font-bold mb-0.5 sm:mb-1 uppercase tracking-wider truncate">{stat.label}</p>
              <p className="text-xl sm:text-4xl font-black text-gray-900">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2 line-clamp-2">{stat.hint}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-6 sm:mb-8 shadow-2xl">
          <h2 className="text-lg sm:text-2xl font-black text-white mb-3 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <button 
              onClick={() => navigate('/admin/mentor-approvals')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 active:bg-white/40 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold transition-all active:scale-95 sm:hover:scale-105 flex flex-col items-center gap-1.5 sm:gap-2 relative"
            >
              <span className="material-symbols-outlined text-xl sm:text-3xl">verified_user</span>
              <span className="text-xs sm:text-sm">Approve Mentors</span>
              {stats.pendingApprovals > 0 && (
                <span className="absolute -top-1 -right-1 sm:static bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full min-w-[20px] text-center">{stats.pendingApprovals}</span>
              )}
            </button>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 active:bg-white/40 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold transition-all active:scale-95 sm:hover:scale-105 flex flex-col items-center gap-1.5 sm:gap-2 relative"
            >
              <span className="material-symbols-outlined text-xl sm:text-3xl">report</span>
              <span className="text-xs sm:text-sm">Review Reports</span>
              {stats.activeReports > 0 && (
                <span className="absolute -top-1 -right-1 sm:static bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full min-w-[20px] text-center">{stats.activeReports}</span>
              )}
            </button>
            <button 
              onClick={() => navigate('/admin/users')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 active:bg-white/40 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold transition-all active:scale-95 sm:hover:scale-105 flex flex-col items-center gap-1.5 sm:gap-2"
            >
              <span className="material-symbols-outlined text-xl sm:text-3xl">group</span>
              <span className="text-xs sm:text-sm">Manage Users</span>
            </button>
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 active:bg-white/40 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 font-bold transition-all active:scale-95 sm:hover:scale-105 flex flex-col items-center gap-1.5 sm:gap-2"
            >
              <span className="material-symbols-outlined text-xl sm:text-3xl">analytics</span>
              <span className="text-xs sm:text-sm">View Analytics</span>
            </button>
          </div>
        </div>

        {/* Management Grid */}
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6">Platform Management</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {menuItems.filter(item => permissions[item.permission as keyof typeof permissions]).map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigate(item.path)}
                className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-3xl p-3 sm:p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden border border-white/50 active:scale-95 sm:hover:scale-[1.02]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                {item.badge > 0 && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg animate-pulse min-w-[20px] text-center">
                    {item.badge}
                  </div>
                )}
                <div className={`size-10 sm:size-16 bg-gradient-to-br ${item.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-lg sm:text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-xs sm:text-xl font-black text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all leading-tight">
                  {item.label}
                </h3>
                <div className="mt-1 sm:mt-2 hidden sm:flex items-center text-gray-500 group-hover:text-purple-600 transition-colors">
                  <span className="text-sm font-bold">Manage</span>
                  <span className="material-symbols-outlined text-sm ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
