import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useAuth } from '../App';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  views: number;
  helpful: number;
}

const HelpCenterNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: 'apps' },
    { id: 'getting-started', name: 'Getting Started', icon: 'rocket_launch' },
    { id: 'mentorship', name: 'Mentorship', icon: 'diversity_3' },
    { id: 'career', name: 'Career Tools', icon: 'work' },
    { id: 'account', name: 'Account', icon: 'person' },
    { id: 'safety', name: 'Safety', icon: 'shield' },
  ];

  const defaultArticles: HelpArticle[] = [
    {
      id: '1',
      title: 'How do I find a mentor?',
      category: 'getting-started',
      content: 'Navigate to the Mentorship page and use our AI-powered matching system to find mentors based on your interests and goals.',
      views: 245,
      helpful: 189,
    },
    {
      id: '2',
      title: 'Setting up your profile',
      category: 'getting-started',
      content: 'Go to Profile Settings to add your information, skills, and preferences. A complete profile helps mentors understand you better.',
      views: 198,
      helpful: 156,
    },
    {
      id: '3',
      title: 'Booking a mentorship session',
      category: 'mentorship',
      content: 'Click on a mentor\'s profile, view their available time slots, and click "Book Session" to schedule a meeting.',
      views: 312,
      helpful: 278,
    },
    {
      id: '4',
      title: 'Using the Resume Builder',
      category: 'career',
      content: 'Access the Resume Builder from Career Tools. Fill in your information, customize the design, and download as PDF.',
      views: 421,
      helpful: 389,
    },
    {
      id: '5',
      title: 'Changing your password',
      category: 'account',
      content: 'Go to Profile Settings > Account Overview > Change Password. Enter your current password and new password.',
      views: 167,
      helpful: 142,
    },
    {
      id: '6',
      title: 'Reporting inappropriate behavior',
      category: 'safety',
      content: 'Click the report button on any message or profile. Our team reviews all reports within 24 hours.',
      views: 89,
      helpful: 76,
    },
  ];

  useEffect(() => {
    setArticles(defaultArticles);
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularArticles = [...articles].sort((a, b) => b.views - a.views).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-xl">
            <span className="material-symbols-outlined text-white text-4xl">help</span>
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Help Center
          </h1>
          <p className="text-gray-600 text-lg mb-8">Find answers and get support for your journey</p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">search</span>
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl py-5 pl-16 pr-6 text-lg shadow-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {selectedCategory === 'all' ? 'All Articles' : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => navigate(`/help/article/${article.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-600 transition-colors">
                    arrow_forward
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{article.content}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    {article.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">thumb_up</span>
                    {article.helpful} helpful
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Articles */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">trending_up</span>
                Popular Articles
              </h3>
              <div className="space-y-3">
                {popularArticles.map((article) => (
                  <div
                    key={article.id}
                    className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-all cursor-pointer"
                    onClick={() => navigate(`/help/article/${article.id}`)}
                  >
                    <p className="text-sm font-bold text-gray-900">{article.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{article.views} views</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-black mb-4">Quick Links</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/help/faq')}
                  className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center justify-between"
                >
                  <span className="font-bold">FAQ</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button
                  onClick={() => navigate('/help/contact')}
                  className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center justify-between"
                >
                  <span className="font-bold">Contact Support</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button
                  onClick={() => navigate('/blog')}
                  className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center justify-between"
                >
                  <span className="font-bold">Blog</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg">
              <h3 className="text-lg font-black text-gray-900 mb-3">Still need help?</h3>
              <p className="text-sm text-gray-600 mb-4">Our support team responds within 24 hours</p>
              <button
                onClick={() => navigate('/help/contact')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterNew;
