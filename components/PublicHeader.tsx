
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const PublicHeader: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  return (
    <header className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${scrolled ? 'top-2 w-[95%] max-w-6xl' : 'top-1 w-[98%] max-w-7xl'}`}>
      <div className={`${scrolled ? 'bg-white/70 dark:bg-slate-900/70' : 'bg-white/80 dark:bg-slate-900/80'} backdrop-blur-3xl border border-gray-200/80 dark:border-gray-700/80 shadow-lg rounded-2xl px-4 sm:px-6 transition-all duration-500`}>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-all duration-500"></div>
              <img 
                src="/logo.png" 
                alt="Unity" 
                className="size-11 rounded-2xl object-contain"
              />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">UNITY</span>
              <span className="text-[9px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">Mentorship Hub</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <HeaderLink to="/" label="Home" />
            <HeaderLink to="/about" label="About" />
            <HeaderLink to="/who-we-serve" label="Who We Serve" />
            <HeaderLink to="/mentorship-info" label="Mentorship" />
            <HeaderLink to="/resources" label="Resources" />
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme} 
              className="size-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-200 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all flex items-center justify-center group shadow-sm" 
              title="Toggle dark mode"
            >
              {isDark ? (
                <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">light_mode</span>
              ) : (
                <span className="material-symbols-outlined text-lg group-hover:-rotate-180 transition-transform duration-500">dark_mode</span>
              )}
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden size-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-200 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all flex items-center justify-center shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link 
                to="/login" 
                className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                className="relative px-5 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200 shadow-lg">
          <nav className="max-w-7xl mx-auto flex flex-col px-4 py-3 gap-0.5">
            <MobileHeaderLink to="/" label="Home" onClick={closeMobileMenu} />
            <MobileHeaderLink to="/about" label="About" onClick={closeMobileMenu} />
            <MobileHeaderLink to="/who-we-serve" label="Who We Serve" onClick={closeMobileMenu} />
            <MobileHeaderLink to="/mentorship-info" label="Mentorship" onClick={closeMobileMenu} />
            <MobileHeaderLink to="/resources" label="Resources" onClick={closeMobileMenu} />
            <div className="flex sm:hidden flex-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
              <Link to="/login" onClick={closeMobileMenu} className="px-4 py-2.5 text-center text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                Log In
              </Link>
              <Link to="/signup" onClick={closeMobileMenu} className="px-4 py-2.5 text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-lg">
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

const HeaderLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link 
    to={to} 
    className="relative px-3.5 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 group"
  >
    {label}
    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 group-hover:w-3/4 transition-all duration-300 rounded-full"></span>
  </Link>
);

const MobileHeaderLink: React.FC<{ to: string; label: string; onClick: () => void }> = ({ to, label, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick} 
    className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all"
  >
    {label}
  </Link>
);

export default PublicHeader;
