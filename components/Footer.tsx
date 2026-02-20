import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface FooterProps {
  variant?: 'full' | 'simple';
}

const Footer: React.FC<FooterProps> = ({ variant = 'full' }) => {
  const currentYear = new Date().getFullYear();
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'simple') {
    return (
      <footer className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg text-white">
              <span className="material-symbols-outlined text-lg font-black">diversity_1</span>
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white">UnityMentor Hub</span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
            © {currentYear} UnityMentor Hub. Empowering student success everywhere.
          </p>
          <div className="flex gap-4 sm:gap-6 text-gray-400 dark:text-gray-500">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" title="Twitter">
              <span className="material-symbols-outlined">share</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" title="LinkedIn">
              <span className="material-symbols-outlined">work</span>
            </a>
            <a href="mailto:support@unityhub.com" className="hover:text-primary transition-colors" title="Email">
              <span className="material-symbols-outlined">alternate_email</span>
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg text-white">
                <span className="material-symbols-outlined text-lg font-black">diversity_1</span>
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white">UnityMentor Hub</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Empowering students to reach their full potential through mentorship, resources, and community support.
            </p>
            <div className="flex gap-3 text-gray-400 dark:text-gray-500 pt-2">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" title="Twitter">
                <span className="material-symbols-outlined text-lg">share</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" title="LinkedIn">
                <span className="material-symbols-outlined text-lg">work</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" title="Instagram">
                <span className="material-symbols-outlined text-lg">image</span>
              </a>
              <a href="mailto:support@unityhub.com" className="hover:text-primary transition-colors" title="Email">
                <span className="material-symbols-outlined text-lg">alternate_email</span>
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Platform</h3>
            <nav className="space-y-2.5 flex flex-col">
              <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Home</Link>
              <Link to="/dashboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Dashboard</Link>
              <Link to="/mentorship" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Mentorship</Link>
              <Link to="/career" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Career Tools</Link>
              <Link to="/resources" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Resources</Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Resources</h3>
            <nav className="space-y-2.5 flex flex-col">
              <Link to="/help" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Help Center</Link>
              <Link to="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">About Us</Link>
              <Link to="/who-we-serve" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Who We Serve</Link>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Blog</a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">FAQs</a>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Legal</h3>
            <nav className="space-y-2.5 flex flex-col">
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Terms of Service</a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Contact Support</a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Accessibility</a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium">Cookie Policy</a>
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          <p className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            © {currentYear} UnityMentor Hub. All rights reserved. Empowering student success everywhere.
          </p>
          
          <div className="flex gap-6 text-gray-400 dark:text-gray-500 text-sm font-medium">
            <button className="hover:text-primary transition-colors">🌐 English</button>
            <button onClick={toggleTheme} className="hover:text-primary transition-colors">
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        {/* Newsletter CTA Optional */}
        <div className="rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 p-6 sm:p-8 text-center space-y-4">
          <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">Stay Updated</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">Subscribe to get the latest mentorship tips and career resources.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="your@email.com" 
              className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-white rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <button className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:scale-105 transition-all text-sm">Subscribe</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
