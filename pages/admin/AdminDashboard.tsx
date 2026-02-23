import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';
import { usePermissions } from '../../src/hooks/usePermissions';

interface DashboardStats {
  totalUsers: number;
  activeMentors: number;
  totalSessions: number;
  monthlyRevenue: number;
  pendingApprovals: number;
  activeReports: number;
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
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const sessionsSnap = await getDocs(collection(db, 'sessions'));
      const mentorAppsSnap = await getDocs(query(collection(db, 'mentorApplications'), where('status', '==', 'pending')));
      const reportsSnap = await getDocs(query(collection(db, 'reports'), where('status', '==', 'open')));

      setStats({
        totalUsers: usersSnap.size,
        activeMentors: usersSnap.docs.filter(d => d.data().role === 'mentor' && d.data().status === 'active').length,
        totalSessions: sessionsSnap.size,
        monthlyRevenue: 0,
        pendingApprovals: mentorAppsSnap.size,
        activeReports: reportsSnap.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const menuItems = [
    { icon: 'group', label: 'User Management', path: '/admin/users', gradient: 'from-blue-500 to-blue-600', badge: 0, permission: 'canManageUsers' },
    { icon: 'verified_user', label: 'Mentor Approvals', path: '/admin/mentor-approvals', gradient: 'from-green-500 to-emerald-600', badge: stats.pendingApprovals, permission: 'canManageMentors' },
    { icon: 'event', label: 'Session Management', path: '/admin/sessions', gradient: 'from-purple-500 to-purple-600', badge: 0, permission: 'canManageSessions' },
    { icon: 'payments', label: 'Payments & Billing', path: '/admin/payments', gradient: 'from-yellow-500 to-orange-600', badge: 0, permission: 'canManagePayments' },
    { icon: 'account_balance_wallet', label: 'Payouts', path: '/admin/payouts', gradient: 'from-teal-500 to-cyan-600', badge: 0, permission: 'canManagePayouts' },
    { icon: 'report', label: 'Reports & Disputes', path: '/admin/reports', gradient: 'from-red-500 to-pink-600', badge: stats.activeReports, permission: 'canManageReports' },
    { icon: 'support_agent', label: 'Support Tickets', path: '/admin/support', gradient: 'from-blue-500 to-indigo-600', badge: 0, permission: 'canAccessAdminPanel' },
    { icon: 'analytics', label: 'Analytics', path: '/admin/analytics', gradient: 'from-indigo-500 to-purple-600', badge: 0, permission: 'canViewAnalytics' },
    { icon: 'star', label: 'Reviews & Ratings', path: '/admin/reviews', gradient: 'from-orange-500 to-red-600', badge: 0, permission: 'canManageReviews' },
    { icon: 'category', label: 'Categories', path: '/admin/categories', gradient: 'from-pink-500 to-rose-600', badge: 0, permission: 'canManageCategories' },
    { icon: 'notifications', label: 'Notifications', path: '/admin/notifications', gradient: 'from-cyan-500 to-blue-600', badge: 0, permission: 'canAccessAdminPanel' },
    { icon: 'security', label: 'Security & Logs', path: '/admin/security', gradient: 'from-gray-600 to-gray-700', badge: 0, permission: 'canViewSecurityLogs' },
    { icon: 'settings', label: 'Platform Settings', path: '/admin/settings', gradient: 'from-slate-600 to-slate-700', badge: 0, permission: 'canManageSettings' },
  ];

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: 'group', gradient: 'from-blue-500 to-blue-600', change: '+12%' },
    { label: 'Active Mentors', value: stats.activeMentors, icon: 'school', gradient: 'from-green-500 to-emerald-600', change: '+8%' },
    { label: 'Total Sessions', value: stats.totalSessions, icon: 'event', gradient: 'from-purple-500 to-purple-600', change: '+23%' },
    { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue}`, icon: 'attach_money', gradient: 'from-yellow-500 to-orange-600', change: '+15%' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Admin Command Center
            </h1>
            <p className="text-gray-600 font-medium">Manage your Unity Mentorship Hub platform</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full uppercase">
                {role.replace('_', ' ')}
              </span>
              <span className="text-gray-500 text-sm">• {permissions.maxRoleLevel > 0 ? `Level ${permissions.maxRoleLevel}` : 'Standard Access'}</span>
            </div>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-green-500/30">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">download</span>
              Export Report
            </span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 border border-white/50">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-2xl">{stat.icon}</span>
                </div>
                <span className="text-green-600 text-sm font-bold bg-green-100 px-2 py-1 rounded-lg">{stat.change}</span>
              </div>
              <p className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">{stat.label}</p>
              <p className="text-4xl font-black text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/admin/mentor-approvals')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-2xl p-4 font-bold transition-all hover:scale-105 flex flex-col items-center gap-2"
            >
              <span className="material-symbols-outlined text-3xl">verified_user</span>
              <span className="text-sm">Approve Mentors</span>
              {stats.pendingApprovals > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{stats.pendingApprovals}</span>
              )}
            </button>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-2xl p-4 font-bold transition-all hover:scale-105 flex flex-col items-center gap-2"
            >
              <span className="material-symbols-outlined text-3xl">report</span>
              <span className="text-sm">Review Reports</span>
              {stats.activeReports > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{stats.activeReports}</span>
              )}
            </button>
            <button 
              onClick={() => navigate('/admin/users')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-2xl p-4 font-bold transition-all hover:scale-105 flex flex-col items-center gap-2"
            >
              <span className="material-symbols-outlined text-3xl">group</span>
              <span className="text-sm">Manage Users</span>
            </button>
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-2xl p-4 font-bold transition-all hover:scale-105 flex flex-col items-center gap-2"
            >
              <span className="material-symbols-outlined text-3xl">analytics</span>
              <span className="text-sm">View Analytics</span>
            </button>
          </div>
        </div>

        {/* Management Grid */}
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-6">Platform Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.filter(item => permissions[item.permission as keyof typeof permissions]).map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigate(item.path)}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden border border-white/50"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                {item.badge > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                    {item.badge}
                  </div>
                )}
                <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all">
                  {item.label}
                </h3>
                <div className="mt-2 flex items-center text-gray-500 group-hover:text-purple-600 transition-colors">
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
