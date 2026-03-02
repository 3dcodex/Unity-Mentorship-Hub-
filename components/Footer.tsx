import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../src/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface FooterProps {
  variant?: 'full' | 'simple';
}

const Footer: React.FC<FooterProps> = ({ variant = 'full' }) => {
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email,
        subscribedAt: Timestamp.now(),
        status: 'active'
      });
      
      setMessage('✓ Subscribed!');
      setEmail('');
    } catch (error) {
      setMessage('Failed. Try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (variant === 'simple') {
    return (
      <footer className="py-12 px-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Unity" className="size-10 rounded-xl object-contain" />
            <span className="text-lg font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">UNITY</span>
          </div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 text-center">
            © 2024 Unity Mentorship Hub. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="size-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all">
              <span className="material-symbols-outlined text-lg">share</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="size-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all">
              <span className="material-symbols-outlined text-lg">work</span>
            </a>
            <a href="mailto:support@unityhub.com" className="size-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all">
              <span className="material-symbols-outlined text-lg">mail</span>
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 border-t border-gray-200 dark:border-gray-700">
      {/* Newsletter Section */}
      <div className="py-12 sm:py-16 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <span className="material-symbols-outlined text-white text-lg sm:text-xl">mail</span>
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">Newsletter</span>
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white px-2">Stay in the Loop</h3>
          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto px-2">Get the latest mentorship tips, success stories, and exclusive resources delivered to your inbox.</p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-lg mx-auto">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" 
              required
              disabled={loading}
              className="flex-1 px-4 sm:px-5 py-3 sm:py-4 bg-white dark:bg-slate-800 border-2 border-white/20 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm sm:text-base font-medium focus:ring-4 focus:ring-white/30 outline-none transition-all disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={loading}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-purple-600 font-black rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl text-sm sm:text-base"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          {message && (
            <p className={`text-sm font-bold ${message.includes('✓') ? 'text-green-300' : 'text-red-300'}`}>
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="Unity" className="size-11 rounded-2xl object-contain" />
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">UNITY</span>
                <span className="text-[9px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">Mentorship Hub</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Empowering students through inclusive mentorship and community support.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">share</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">work</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="size-10 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">image</span>
              </a>
              <a href="mailto:support@unityhub.com" className="size-10 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Platform</h4>
            <nav className="space-y-2 sm:space-y-2.5 flex flex-col">
              <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Home</Link>
              <Link to="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">About Us</Link>
              <Link to="/who-we-serve" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Who We Serve</Link>
              <Link to="/mentorship-info" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Mentorship</Link>
              <Link to="/ourimpact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Our Impact</Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Resources</h4>
            <nav className="space-y-2 sm:space-y-2.5 flex flex-col">
              <Link to="/resources" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">All Resources</Link>
              <Link to="/career" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Career Tools</Link>
              <Link to="/community" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Community</Link>
              <Link to="/help" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Help Center</Link>
              <Link to="/blog" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Blog</Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Support</h4>
            <nav className="space-y-2 sm:space-y-2.5 flex flex-col">
              <Link to="/help/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Contact Us</Link>
              <Link to="/help/faq" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">FAQs</Link>
              <Link to="/signup" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Sign Up</Link>
              <Link to="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium">Login</Link>
              <button onClick={toggleTheme} className="text-sm text-gray-600 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all font-medium text-left">
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 text-center">
            © 2024 Unity Mentorship Hub. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs font-medium">
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all">Privacy Policy</a>
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all">Terms of Service</a>
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
