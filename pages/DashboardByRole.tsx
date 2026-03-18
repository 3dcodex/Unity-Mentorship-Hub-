import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { errorService } from '../services/errorService';
import type { Role } from '../types';

const normalizeRole = (role: unknown): Role => {
  if (role === 'Student' || role === 'Professional' || role === 'admin' || role === 'super_admin' || role === 'moderator') {
    return role;
  }
  return 'Student';
};

const DashboardByRole: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [userRole, setUserRole] = useState<Role>('Student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserRole();
    }
  }, [user]);

  const loadUserRole = async () => {
    if (!user) return;
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setUserRole(normalizeRole(userData.role || localStorage.getItem('unity_user_role')));
      }
    } catch (err) {
      errorService.handleError(err, 'Error loading user role');
      setUserRole(normalizeRole(localStorage.getItem('unity_user_role')));
    } finally {
      setLoading(false);
    }
  };

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

  // Render role-specific dashboard
  switch (userRole) {
    case 'Student':
      return <StudentDashboard />;
    case 'Professional':
      return <ProfessionalDashboard />;
    case 'admin':
    case 'super_admin':
      return <AdminDashboard />;
    case 'moderator':
      return <ModeratorDashboard />;
    default:
      return <StudentDashboard />;
  }
};

// Student Dashboard
const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen py-4 sm:py-8 px-3 sm:px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        <h1 className={`text-2xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Student Dashboard 📚
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          <DashboardCard title="Campus Resources" icon="school" onClick={() => navigate('/resources/campus')} isDark={isDark} />
          <DashboardCard title="Career Tools" icon="work" onClick={() => navigate('/career/resume')} isDark={isDark} />
          <DashboardCard title="Find Mentors" icon="diversity_3" onClick={() => navigate('/mentorship/match')} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen py-4 sm:py-8 px-3 sm:px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        <h1 className={`text-2xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Admin Dashboard 🛡️
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          <DashboardCard title="User Management" icon="manage_accounts" onClick={() => navigate('/admin/users')} isDark={isDark} />
          <DashboardCard title="Mentor Approvals" icon="fact_check" onClick={() => navigate('/admin/mentor-approvals')} isDark={isDark} />
          <DashboardCard title="Analytics" icon="analytics" onClick={() => navigate('/analytics')} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

// Moderator Dashboard
const ModeratorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen py-4 sm:py-8 px-3 sm:px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        <h1 className={`text-2xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Moderator Dashboard 🧭
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          <DashboardCard title="Moderation Queue" icon="gavel" onClick={() => navigate('/moderator/queue')} isDark={isDark} />
          <DashboardCard title="Community" icon="groups" onClick={() => navigate('/community')} isDark={isDark} />
          <DashboardCard title="Reports" icon="flag" onClick={() => navigate('/moderator/reports')} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

// Professional Dashboard (Always Mentor)
const ProfessionalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen py-4 sm:py-8 px-3 sm:px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        <h1 className={`text-2xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Professional Mentor Dashboard 💼
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          <DashboardCard title="My Mentees" icon="group" onClick={() => navigate('/mentorship/mentees')} isDark={isDark} />
          <DashboardCard title="Schedule Sessions" icon="event" onClick={() => navigate('/mentorship/schedule')} isDark={isDark} />
          <DashboardCard title="Post Opportunities" icon="business_center" onClick={() => navigate('/jobs/post')} isDark={isDark} />
          <DashboardCard title="Host Webinars" icon="mic" onClick={() => navigate('/webinars/host')} isDark={isDark} />
          <DashboardCard title="Company Profile" icon="corporate_fare" onClick={() => navigate('/profile')} isDark={isDark} />
          <DashboardCard title="Analytics" icon="analytics" onClick={() => navigate('/analytics')} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

const DashboardCard: React.FC<{ title: string; icon: string; onClick: () => void; isDark: boolean }> = ({ title, icon, onClick, isDark }) => (
  <div
    onClick={onClick}
    className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border shadow-xl cursor-pointer active:scale-95 sm:hover:scale-105 transition-all ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-100'}`}
  >
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="size-10 sm:size-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-white text-lg sm:text-2xl">{icon}</span>
      </div>
      <h3 className={`text-sm sm:text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
    </div>
  </div>
);

export default DashboardByRole;
