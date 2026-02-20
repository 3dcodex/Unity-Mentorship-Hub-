
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const PublicHeader: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="h-8 sm:h-10 transition-transform group-hover:scale-105">
            <img 
              src="/logo.png" 
              alt="Unity Mentorship Hub" 
              className="h-full object-contain filter brightness-90 contrast-125 rounded-lg"
            />
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-lg sm:text-xl font-black tracking-tight text-[#001f3f]">UNITY</span>
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em]">Mentorship Hub</span>
          </div>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-6 md:gap-8">
          <HeaderLink to="/welcome" label="Home" />
          <HeaderLink to="/accessible-resources" label="Resources" />
          <HeaderLink to="/who-we-serve" label="Who We Serve" />
          <HeaderLink to="/mentorship-info" label="Mentorship" />
          <HeaderLink to="/about" label="About Us" />
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={toggleTheme} className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center" title="Toggle dark mode">
            {isDark ? (
              <span className="material-symbols-outlined">light_mode</span>
            ) : (
              <span className="material-symbols-outlined">dark_mode</span>
            )}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden size-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          <Link to="/login" className="hidden sm:block text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">Log In</Link>
          <Link to="/signup" className="bg-primary dark:bg-blue-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-2xl text-xs sm:text-sm font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            Join Now
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-200">
          <nav className="max-w-7xl mx-auto flex flex-col px-4 sm:px-6 py-4 gap-2">
            <MobileHeaderLink to="/accessible-resources" label="Resources" onClick={closeMobileMenu} />
            <MobileHeaderLink to="/who-we-serve" label="Who We Serve" onClick={closeMobileMenu} />
            <MobileHeaderLink to="/mentorship-info" label="Mentorship" onClick={closeMobileMenu} />
            <MobileHeaderLink to="/about" label="About Us" onClick={closeMobileMenu} />
            <Link to="/login" className="block sm:hidden px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              Log In
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

const HeaderLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link to={to} className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors relative group py-2">
    {label}
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary dark:bg-blue-400 transition-all group-hover:w-full"></span>
  </Link>
);

const MobileHeaderLink: React.FC<{ to: string; label: string; onClick: () => void }> = ({ to, label, onClick }) => (
  <Link to={to} onClick={onClick} className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
    {label}
  </Link>
);

export default PublicHeader;
