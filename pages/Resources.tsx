import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCareerAdvice } from '../services/geminiService';
import { BookOpen, GraduationCap, Briefcase, DollarSign, Heart, Users, TrendingUp, Award, FileText, Video, Headphones, Download } from 'lucide-react';
import Footer from '../components/Footer';

const Resources: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Academics', 'Career', 'Financial Aid', 'Mental Health', 'DEI Guides', 'Skills'];

  const stats = [
    { icon: BookOpen, value: '150+', label: 'Guides & Articles', color: 'text-blue-600' },
    { icon: Video, value: '80+', label: 'Video Tutorials', color: 'text-purple-600' },
    { icon: Headphones, value: '45+', label: 'Podcasts', color: 'text-green-600' },
    { icon: Download, value: '200+', label: 'Downloads', color: 'text-orange-600' }
  ];

  const resources: any[] = [];

  const quickLinks = [
    { icon: GraduationCap, title: 'Study Resources', count: 45, color: 'bg-blue-500' },
    { icon: Briefcase, title: 'Career Tools', count: 38, color: 'bg-purple-500' },
    { icon: DollarSign, title: 'Financial Aid', count: 22, color: 'bg-green-500' },
    { icon: Heart, title: 'Wellness', count: 18, color: 'bg-pink-500' },
    { icon: Users, title: 'Community', count: 30, color: 'bg-orange-500' },
    { icon: TrendingUp, title: 'Skills Dev', count: 42, color: 'bg-indigo-500' }
  ];

  const handleAiCounselor = async () => {
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    try {
      const role = localStorage.getItem('unity_user_role') || 'Student';
      const advice = await getCareerAdvice(role, aiQuery);
      setAiResponse(advice || 'Sorry, I could not generate advice at this time.');
    } catch (error) {
      setAiResponse('An error occurred. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredResources = resources.filter(r => 
    (activeCategory === 'All' || r.category === activeCategory) &&
    (r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-blue-900/90 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=1600"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Resources"
        />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-4 text-white">
          <h1 className="text-5xl md:text-6xl font-black">Resources Hub</h1>
          <p className="text-xl font-medium opacity-95">Everything you need to succeed academically, professionally, and personally</p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mt-8">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text" 
              placeholder="Search guides, tutorials, tools..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white shadow-xl focus:ring-4 focus:ring-white/20 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl p-6 text-center shadow-lg border border-gray-100 dark:border-gray-700">
                  <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                  <div className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Access Links */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black mb-8 dark:text-white">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button key={link.title} className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`${link.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">{link.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{link.count} items</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories & Resources Grid */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black dark:text-white">Browse Resources</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">{filteredResources.length} resources found</div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Resources Grid */}
          {filteredResources.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((res, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                  <div className="relative h-48 overflow-hidden">
                    <img src={res.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={res.title} />
                    <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-primary">
                      {res.category}
                    </div>
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-white">
                      {res.type}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-primary transition-colors">{res.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{res.desc}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {res.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">download</span>
                        {res.downloads}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        res.difficulty === 'Beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        res.difficulty === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {res.difficulty}
                      </span>
                    </div>

                    <button className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                      Access Resource
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">folder_open</span>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-bold">No resources available yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Check back soon for new content!</p>
            </div>
          )}
        </div>
      </section>

      {/* AI Career Counselor */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 to-blue-50 dark:from-primary/20 dark:to-slate-800 rounded-3xl p-8 md:p-12 border border-primary/20">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">psychology</span>
                  <span className="text-xs font-black uppercase tracking-wider">AI-Powered</span>
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white">Unity AI Career Counselor</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Get instant, personalized career advice powered by advanced AI. Ask about internships, career paths, skill development, or any professional guidance you need.
                </p>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Ask me anything about your career..." 
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiCounselor()}
                      className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button 
                      onClick={handleAiCounselor}
                      disabled={isAiLoading || !aiQuery.trim()}
                      className="bg-primary text-white px-6 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                      {isAiLoading ? (
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined">send</span>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setAiQuery("How to find inclusive tech internships?")} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary hover:border-primary transition-all">
                      "Inclusive tech internships?"
                    </button>
                    <button onClick={() => setAiQuery("Best skills for marketing career?")} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary hover:border-primary transition-all">
                      "Marketing skills?"
                    </button>
                    <button onClick={() => setAiQuery("How to negotiate salary?")} className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary hover:border-primary transition-all">
                      "Salary negotiation?"
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-xl min-h-[400px] flex flex-col">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">support_agent</span>
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white">AI Response</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {isAiLoading ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  ) : aiResponse ? (
                    aiResponse
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      <span className="material-symbols-outlined text-5xl mb-2">chat_bubble_outline</span>
                      <p className="text-xs">Your personalized advice will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="simple" />
    </div>
  );
};

export default Resources;
