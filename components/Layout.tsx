
import React, { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const userName = localStorage.getItem('unity_user_name') || 'User';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  // Load user photo from Firestore and refresh periodically
  useEffect(() => {
    const loadUserPhoto = () => {
      if (user) {
        getDoc(doc(db, 'users', user.uid)).then(docSnap => {
          if (docSnap.exists()) {
            setUserPhoto(docSnap.data().photoURL || null);
          }
        }).catch(err => console.error('Error loading user photo:', err));
      }
    };
    
    loadUserPhoto();
    
    // Refresh photo every 5 seconds to catch updates
    const interval = setInterval(loadUserPhoto, 5000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Load notification count
  useEffect(() => {
    const loadNotificationCount = async () => {
      if (!user) return;
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('read', '==', false)
        );
        const snapshot = await getDocs(q);
        setNotificationCount(snapshot.size);
      } catch (err) {
        console.error('Error loading notification count:', err);
      }
    };

    loadNotificationCount();
    const interval = setInterval(loadNotificationCount, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownOpen && !target.closest('.profile-dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('unity_onboarding_complete');
      localStorage.removeItem('unity_user_name');
      localStorage.removeItem('unity_user_role');
      setDropdownOpen(false);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark font-sans text-gray-900 dark:text-gray-100">
      <header className="h-14 sm:h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-50 transition-all">
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8 lg:gap-12 flex-1 min-w-0">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 md:gap-3 group flex-shrink-0">
             <div className="h-7 sm:h-8 md:h-10">
              <img 
                src="/logo.png" 
                alt="Unity logo" 
                className="h-full object-contain rounded-lg"
              />
            </div>
            <div className="flex flex-col -space-y-1 hidden xs:flex">
              <span className="text-sm sm:text-base md:text-lg font-black tracking-tighter text-[#001f3f]">UNITY</span>
              <span className="text-[6px] sm:text-[7px] md:text-[8px] font-bold text-gray-400 uppercase tracking-[0.1em]">Mentorship Hub</span>
            </div>
          </Link>

          <div className="relative max-w-sm w-full hidden lg:block">
            <span className="material-symbols-outlined absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm sm:text-base md:text-lg">search</span>
            <input 
              type="text" 
              placeholder="Search mentors, resources..." 
              className="w-full bg-gray-50/50 dark:bg-gray-800/50 border-none rounded-xl sm:rounded-2xl py-1.5 sm:py-2 md:py-2.5 pl-7 sm:pl-8 md:pl-10 pr-2 sm:pr-3 md:pr-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <nav className="flex items-center gap-4 sm:gap-6 md:gap-8 mr-6 sm:mr-8 md:mr-12 hidden md:flex">
          <TopNavItem to="/dashboard" label="Dashboard" />
          <TopNavItem to="/mentorship" label="Mentorship" />
          <TopNavItem to="/resources" label="Resources" />
          <TopNavItem to="/community" label="Community" />
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <button 
            onClick={() => navigate('/notifications')}
            className="size-8 sm:size-9 md:size-10 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">notifications</span>
            {notificationCount > 0 && (
              <>
                <span className="absolute top-2 right-2.5 sm:top-2.5 sm:right-3 size-1.5 sm:size-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-black rounded-full size-4 sm:size-5 flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              </>
            )}
          </button>
          <button onClick={toggleTheme} className="size-8 sm:size-9 md:size-10 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center" title="Toggle dark mode">
            {isDark ? (
              <span className="material-symbols-outlined text-lg sm:text-xl">light_mode</span>
            ) : (
              <span className="material-symbols-outlined text-lg sm:text-xl">dark_mode</span>
            )}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden size-8 sm:size-9 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-lg sm:text-xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          <div className="relative profile-dropdown-container">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="size-8 sm:size-9 md:size-10 rounded-lg sm:rounded-xl bg-primary/10 dark:bg-blue-900/30 border-2 border-primary/20 dark:border-blue-500/30 flex items-center justify-center text-primary dark:text-blue-400 font-bold overflow-hidden cursor-pointer hover:scale-105 transition-transform text-xs sm:text-sm">
              {userPhoto ? (
                <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                <Link 
                  to="/profile" 
                  onClick={() => setDropdownOpen(false)}
                  className="block px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm mr-2 align-middle">person</span>Profile
                </Link>
                <button onClick={handleLogout} className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center">
                  <span className="material-symbols-outlined text-sm mr-2">logout</span>Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-200">
          <nav className="max-w-7xl mx-auto flex flex-col px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-1.5 sm:gap-2">
            <MobileNavItem to="/dashboard" label="Dashboard" onClick={closeMobileMenu} />
            <MobileNavItem to="/mentorship" label="Mentorship" onClick={closeMobileMenu} />
            <MobileNavItem to="/resources" label="Resources" onClick={closeMobileMenu} />
            <MobileNavItem to="/community" label="Community" onClick={closeMobileMenu} />
            <Link to="/profile" className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person</span> Profile
            </Link>
          </nav>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 sm:w-60 md:w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-gray-700 hidden md:flex flex-col p-4 sm:p-5 md:p-6 overflow-y-auto">
          <div className="mb-8 sm:mb-10">
            <h3 className="text-[9px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 sm:mb-4 px-2 sm:px-3">Student Hub</h3>
            <div className="space-y-1">
              <SidebarItem to="/dashboard" icon="grid_view" label="Overview" />
              <SidebarItem to="/quick-chat" icon="chat" label="Quick Chat" />
              <SidebarItem to="/mentorship/history" icon="calendar_today" label="My Sessions" />
              <SidebarItem to="/mentorship/book" icon="person_search" label="Book a Mentor" />
              <SidebarItem to="/analytics" icon="insights" label="Analytics" />
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <h3 className="text-[9px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 sm:mb-4 px-2 sm:px-3">Career tools</h3>
            <div className="space-y-1">
              <SidebarItem to="/career/resume" icon="description" label="Resume Builder" />
              <SidebarItem to="/career/mock-interview" icon="mic" label="Mock Interview" />
            </div>
          </div>

          <div className="mb-5 sm:mb-6">
            <h3 className="text-[9px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 sm:mb-4 px-2 sm:px-3">Support</h3>
            <div className="space-y-1">
              <SidebarItem to="/help" icon="help" label="Help Center" />
            </div>
          </div>
          
          <div className="mb-auto pt-4 sm:pt-6 border-t border-gray-50 dark:border-gray-700">
            <div className="bg-primary/5 dark:bg-blue-900/20 rounded-2xl sm:rounded-[24px] p-4 sm:p-5 border border-primary/10 dark:border-blue-500/20">
              <p className="text-[9px] sm:text-[10px] font-black text-primary dark:text-blue-400 uppercase tracking-[0.2em] mb-1.5 sm:mb-2">Pro Tip</p>
              <p className="text-[10px] sm:text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-bold">Book your week ahead for 20% more session availability.</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const TopNavItem: React.FC<{ to: string, label: string }> = ({ to, label }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `text-xs sm:text-sm font-bold transition-all border-b-2 py-2 ${isActive ? 'text-primary dark:text-blue-400 border-primary dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-300'}`}
  >
    {label}
  </NavLink>
);

const SidebarItem: React.FC<{ to: string, icon: string, label: string }> = ({ to, icon, label }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all ${isActive ? 'bg-primary dark:bg-blue-600 text-white font-black shadow-lg shadow-primary/20 dark:shadow-blue-600/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
  >
    <span className="material-symbols-outlined text-lg sm:text-[22px]">{icon}</span>
    <span className="text-xs sm:text-sm">{label}</span>
  </NavLink>
);

const MobileNavItem: React.FC<{ to: string, label: string, onClick: () => void }> = ({ to, label, onClick }) => (
  <NavLink 
    to={to} 
    onClick={onClick}
    className={({ isActive }) => `px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
  >
    {label}
  </NavLink>
);

export default Layout;
