
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCareerAdvice } from '../services/geminiService';
import Footer from '../components/Footer';

const Resources: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Academics', 'Career', 'Financial Aid', 'Mental Health', 'DEI Guides'];

  const resources = [
    {
      title: "Mastering the Tech Interview",
      category: "Career",
      desc: "A comprehensive guide on behavioral and technical rounds at top firms.",
      img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
      readTime: "12 min read",
      path: "/career/mock-interview"
    },
    {
      title: "Scholarship Strategies for First-Gen Students",
      category: "Financial Aid",
      desc: "How to find and win grants specifically designed for first-generation university students.",
      img: "https://images.unsplash.com/photo-1523240693567-579c48b01bb0?auto=format&fit=crop&q=80&w=600",
      readTime: "8 min read",
      path: "/resources/financial-aid"
    },
    {
      title: "Building a Supportive Peer Network",
      category: "Academics",
      desc: "Tips for finding study groups and building long-lasting academic connections.",
      img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=600",
      readTime: "5 min read",
      path: "/resources/academics"
    },
    {
      title: "DEI Advocacy in the Modern Workplace",
      category: "DEI Guides",
      desc: "Understanding your rights and how to lead inclusion efforts in your first job.",
      img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=600",
      readTime: "15 min read",
      path: "/resources/dei-guides"
    },
    {
      title: "Mindfulness for Exam Season",
      category: "Mental Health",
      desc: "Proven techniques to manage stress and maintain focus during high-pressure weeks.",
      img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600",
      readTime: "6 min read",
      path: "/resources/academics"
    },
    {
      title: "Effective Resume Storytelling",
      category: "Career",
      desc: "How to frame your unique life experiences as professional strengths.",
      img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600",
      readTime: "10 min read",
      path: "/career/resume"
    }
  ];

  const handleAiCounselor = async () => {
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    try {
      const role = localStorage.getItem('unity_user_role') || 'Student';
      const advice = await getCareerAdvice(role, aiQuery);
      setAiResponse(advice || 'Sorry, I could not generate advice at this time.');
    } catch (error) {
      setAiResponse('An error occurred while reaching the AI Counselor. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredResources = resources.filter(r => 
    (activeCategory === 'All' || r.category === activeCategory) &&
    (r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Resources Hub</h1>
          <p className="text-gray-500 font-medium mt-1">Curated guides and tools for your academic and professional success.</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Search guides, tools..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-[20px] py-4 pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all"
          />
        </div>
      </header>

      {/* Featured Resource Spotlight */}
      <section className="bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[40px] overflow-hidden flex flex-col lg:flex-row shadow-2xl shadow-gray-200/50">
        <div className="lg:w-1/2 p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-16 flex flex-col justify-center space-y-4 sm:space-y-6 md:space-y-8 text-white relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent pointer-events-none"></div>
          <div className="inline-flex px-3 py-1 rounded-full bg-primary/20 text-primary-light text-[10px] font-black uppercase tracking-[0.2em] w-fit">Spotlight of the month</div>
          <h2 className="text-xl sm:text-2xl md:text-3xl md:text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight">Navigating Graduate School as a Minority Student</h2>
          <p className="text-gray-400 text-base sm:text-lg font-medium leading-relaxed">
            A deep dive into funding, faculty mentorship, and finding community in higher-level academia.
          </p>
          <button className="w-fit bg-primary text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2">
            Read Featured Guide
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
        <div className="lg:w-1/2 h-40 sm:h-52 md:h-64 lg:h-auto overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1523240693567-579c48b01bb0?auto=format&fit=crop&q=80&w=1000" 
            className="w-full h-full object-cover" 
            alt="Spotlight"
          />
        </div>
      </section>

      {/* Categories & Resource Grid */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border-2 whitespace-nowrap ${
                activeCategory === cat 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white border-gray-50 text-gray-500 hover:border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
          {filteredResources.map((res, i) => (
            <div key={i} className="bg-white rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-50 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="h-48 overflow-hidden relative">
                <img src={res.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={res.title} />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-primary uppercase tracking-widest shadow-sm">
                  {res.category}
                </div>
              </div>
              <div className="p-4 sm:p-6 md:p-8 flex flex-col flex-1 space-y-4">
                <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900 group-hover:text-primary transition-colors leading-tight">{res.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed flex-1">{res.desc}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {res.readTime}
                  </span>
                  <button 
                    onClick={() => navigate(res.path)}
                    className="text-primary text-xs font-black hover:underline uppercase tracking-widest flex items-center gap-1"
                  >
                    Read Guide
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Career Counselor Section */}
      <section className="bg-blue-50/50 border border-blue-100 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-16 flex flex-col lg:flex-row gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12 items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 opacity-[0.03] pointer-events-none">
          <span className="material-symbols-outlined text-[300px] text-primary">smart_toy</span>
        </div>
        <div className="lg:w-1/2 space-y-6 relative z-10">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined font-black">psychology</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Powered by Gemini AI</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight">Unity AI Career Counselor</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            Get personalized career advice tailored to your unique background and goals. Ask about internships, career paths, or skill building.
          </p>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Ask anything about your career..." 
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiCounselor()}
                className="flex-1 bg-white border border-blue-100 rounded-2xl p-4 text-sm font-medium shadow-sm focus:ring-4 focus:ring-primary/5 outline-none"
              />
              <button 
                onClick={handleAiCounselor}
                disabled={isAiLoading || !aiQuery.trim()}
                className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isAiLoading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">send</span>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setAiQuery("How to find inclusive tech internships?")} className="px-3 py-1 bg-white border border-blue-50 rounded-lg text-[10px] font-bold text-gray-400 hover:text-primary hover:border-primary transition-all">"Inclusive tech internships?"</button>
              <button onClick={() => setAiQuery("Best skills for a marketing career in 2024?")} className="px-3 py-1 bg-white border border-blue-50 rounded-lg text-[10px] font-bold text-gray-400 hover:text-primary hover:border-primary transition-all">"2024 marketing skills?"</button>
            </div>
          </div>
        </div>
        <div className="lg:w-1/2 w-full h-full min-h-[300px] relative">
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-[32px] p-4 sm:p-6 md:p-8 border border-blue-100 shadow-xl min-h-[300px] flex flex-col relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm">support_agent</span>
              </div>
              <h3 className="text-sm font-black text-gray-900">Career Advisor Response</h3>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px] text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-line pr-2">
              {isAiLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-full"></div>
                  <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                </div>
              ) : aiResponse ? (
                aiResponse
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-2">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-5xl">chat_bubble_outline</span>
                  <p className="text-xs">Your AI-generated advice will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer variant="simple" />
    </div>
  );
};

export default Resources;
