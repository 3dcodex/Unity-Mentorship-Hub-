import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';

const DashboardByRole: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [userRole, setUserRole] = useState<string>('');
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
        setUserRole(userData.role || localStorage.getItem('unity_user_role') || 'Domestic Student');
      }
    } catch (err) {
      console.error('Error loading user role:', err);
      setUserRole(localStorage.getItem('unity_user_role') || 'Domestic Student');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className=\"text-center space-y-4\">
          <div className=\"size-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto\"></div>
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  switch (userRole) {
    case 'International Student':
      return <InternationalStudentDashboard />;
    case 'Domestic Student':
      return <DomesticStudentDashboard />;
    case 'Alumni':
      return <AlumniDashboard />;
    case 'Professional':
      return <ProfessionalDashboard />;
    default:
      return <DomesticStudentDashboard />;
  }
};

// International Student Dashboard
const InternationalStudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className=\"max-w-7xl mx-auto space-y-8\">
        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          International Student Dashboard 🌍
        </h1>
        <div className=\"grid md:grid-cols-3 gap-6\">
          <DashboardCard title=\"Visa Support\" icon=\"flight\" onClick={() => navigate('/resources/visa')} isDark={isDark} />
          <DashboardCard title=\"Cultural Integration\" icon=\"public\" onClick={() => navigate('/resources/cultural')} isDark={isDark} />
          <DashboardCard title=\"Find Mentors\" icon=\"diversity_3\" onClick={() => navigate('/mentorship/match')} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

// Domestic Student Dashboard
const DomesticStudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className=\"max-w-7xl mx-auto space-y-8\">
        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Student Dashboard 📚
        </h1>
        <div className=\"grid md:grid-cols-3 gap-6\">
          <DashboardCard title=\"Campus Resources\" icon=\"school\" onClick={() => navigate('/resources/campus')} isDark={isDark} />
          <DashboardCard title=\"Career Tools\" icon=\"work\" onClick={() => navigate('/career/resume')} isDark={isDark} />
          <DashboardCard title=\"Find Mentors\" icon=\"diversity_3\" onClick={() => navigate('/mentorship/match')} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

// Alumni Dashboard
const AlumniDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className=\"max-w-7xl mx-auto space-y-8\">
        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Alumni Dashboard 🎓
        </h1>
        <div className=\"grid md:grid-cols-3 gap-6\">
          <DashboardCard title=\"My Mentees\" icon=\"group\" onClick={() => navigate('/mentorship/mentees')} isDark={isDark} />
          <DashboardCard title=\"Post Jobs\" icon=\"work\" onClick={() => navigate('/jobs/post')} isDark={isDark} />
          <DashboardCard title=\"Network\" icon=\"handshake\" onClick={() => navigate('/community')} isDark={isDark} />
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
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className=\"max-w-7xl mx-auto space-y-8\">
        <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Professional Mentor Dashboard 💼
        </h1>
        <div className=\"grid md:grid-cols-3 gap-6\">
          <DashboardCard title=\"My Mentees\" icon=\"group\" onClick={() => navigate('/mentorship/mentees')} isDark={isDark} />
          <DashboardCard title=\"Schedule Sessions\" icon=\"event\" onClick={() => navigate('/mentorship/schedule')} isDark={isDark} />
          <DashboardCard title=\"Post Opportunities\" icon=\"business_center\" onClick={() => navigate('/jobs/post')} isDark={isDark} />
          <DashboardCard title=\"Host Webinars\" icon=\"mic\" onClick={() => navigate('/webinars/host')} isDark={isDark} />
          <DashboardCard title=\"Company Profile\" icon=\"corporate_fare\" onClick={() => navigate('/profile')} isDark={isDark} />
          <DashboardCard title=\"Analytics\" icon=\"analytics\" onClick={() => navigate('/analytics')} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

const DashboardCard: React.FC<{ title: string; icon: string; onClick: () => void; isDark: boolean }> = ({ title, icon, onClick, isDark }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl p-6 border shadow-xl cursor-pointer hover:scale-105 transition-all ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-100'}`}
  >
    <div className=\"flex items-center gap-4\">
      <div className=\"size-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center\">
        <span className=\"material-symbols-outlined text-white text-2xl\">{icon}</span>
      </div>
      <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
    </div>
  </div>
);

export default DashboardByRole;
