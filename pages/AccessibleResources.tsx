import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Video, Headphones, Download, Eye, Volume2, Type, Palette, CheckCircle } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const AccessibleResources: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFormat, setActiveFormat] = useState('All');

  const stats = [
    { icon: BookOpen, value: '200+', label: 'Accessible Guides', color: 'text-indigo-600' },
    { icon: Video, value: '150+', label: 'Captioned Videos', color: 'text-purple-600' },
    { icon: Headphones, value: '80+', label: 'Audio Resources', color: 'text-blue-600' },
    { icon: FileText, value: '100+', label: 'Braille-Ready', color: 'text-green-600' }
  ];

  const formats = ['All', 'PDF', 'Audio', 'Video', 'Braille', 'Simplified Text'];

  const resources = [
    {
      title: 'Complete Guide to University Success',
      category: 'Academic',
      desc: 'Comprehensive guide covering study strategies, time management, and academic resources with simplified language options.',
      formats: ['PDF', 'Audio', 'Braille'],
      downloads: 3200,
      duration: '45 min read',
      img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600'
    },
    {
      title: 'Career Planning for All Abilities',
      category: 'Career',
      desc: 'Accessible career guidance including resume building, interview prep, and workplace accommodations.',
      formats: ['PDF', 'Audio', 'Video'],
      downloads: 2800,
      duration: '30 min read',
      img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600'
    },
    {
      title: 'Financial Aid Navigation',
      category: 'Financial',
      desc: 'Step-by-step guide to scholarships, grants, and financial resources with screen reader optimization.',
      formats: ['PDF', 'Audio', 'Simplified Text'],
      downloads: 4100,
      duration: '25 min read',
      img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=600'
    },
    {
      title: 'Mental Health & Wellness',
      category: 'Wellness',
      desc: 'Accessible mental health resources, coping strategies, and support services with audio descriptions.',
      formats: ['PDF', 'Audio', 'Video'],
      downloads: 3600,
      duration: '20 min read',
      img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600'
    },
    {
      title: 'Study Skills Masterclass',
      category: 'Academic',
      desc: 'Evidence-based study techniques with visual aids, audio explanations, and text alternatives.',
      formats: ['PDF', 'Audio', 'Video', 'Simplified Text'],
      downloads: 2900,
      duration: '35 min read',
      img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600'
    },
    {
      title: 'Networking Without Barriers',
      category: 'Career',
      desc: 'Professional networking strategies designed for diverse communication styles and abilities.',
      formats: ['PDF', 'Audio', 'Braille'],
      downloads: 2400,
      duration: '18 min read',
      img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=600'
    }
  ];

  const features = [
    {
      icon: Type,
      title: 'Readability First',
      desc: 'Lexend font and optimized typography designed to improve reading proficiency and reduce visual stress.',
      color: 'bg-blue-500'
    },
    {
      icon: Volume2,
      title: 'Screen Reader Optimized',
      desc: 'Every element is aria-labeled and semantic for seamless navigation with assistive technologies.',
      color: 'bg-purple-500'
    },
    {
      icon: Palette,
      title: 'High Contrast',
      desc: 'AAA contrast standards met across all content for maximum readability in any lighting condition.',
      color: 'bg-indigo-500'
    },
    {
      icon: Eye,
      title: 'Visual Alternatives',
      desc: 'All visual content includes detailed text descriptions and alternative formats.',
      color: 'bg-green-500'
    }
  ];

  const filteredResources = resources.filter(r => 
    (activeFormat === 'All' || r.formats.includes(activeFormat)) &&
    (r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 to-purple-900/90 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1600"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Accessible Resources"
        />
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-4 text-white">
          <div className="inline-flex px-4 py-2 rounded-full bg-white/20 backdrop-blur text-white text-xs font-black uppercase tracking-widest mb-4">
            Accessibility First
          </div>
          <h1 className="text-5xl md:text-6xl font-black">Accessible Resources</h1>
          <p className="text-xl font-medium opacity-95">Knowledge without barriers. Every resource designed with universal access in mind.</p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mt-8">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text" 
              placeholder="Search accessible resources..." 
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

      {/* Accessibility Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4 dark:text-white">Built for Everyone</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our platform follows WCAG 2.1 AAA standards and universal design principles
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-3 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Resource Library */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4 dark:text-white">Resource Library</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              All resources available in multiple formats for maximum accessibility
            </p>
          </div>

          {/* Format Filters */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8">
            {formats.map(format => (
              <button
                key={format}
                onClick={() => setActiveFormat(format)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeFormat === format 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-600'
                }`}
              >
                {format}
              </button>
            ))}
          </div>

          {/* Resources Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all">
                <div className="relative h-48 overflow-hidden">
                  <img src={resource.img} className="w-full h-full object-cover" alt={resource.title} />
                  <div className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                    {resource.category}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">{resource.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{resource.desc}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {resource.formats.map(format => (
                      <span key={format} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full">
                        {format}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {resource.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {resource.downloads}
                    </span>
                  </div>

                  <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    Access Resource
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-12 border border-indigo-100 dark:border-indigo-800">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">WCAG 2.1 AAA Compliant</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Our platform meets the highest accessibility standards, ensuring everyone can access knowledge regardless of ability.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-bold">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                  Multi-format downloads (PDF, MP3, Braille-Ready)
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-bold">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                  Closed captioning on all video content
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-bold">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                  One-click text simplification
                </div>
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-bold">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                  Keyboard navigation throughout
                </div>
              </div>
            </div>
            
            <div className="w-64 h-64 bg-indigo-600 dark:bg-indigo-700 rounded-3xl flex items-center justify-center rotate-3 shadow-2xl">
              <span className="material-symbols-outlined text-white text-[120px]">universal_accessibility</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-black">Need a Specific Accommodation?</h2>
          <p className="text-xl opacity-95">
            Our accessibility team is always listening. If you encounter any barrier, we'll address it within 48 hours.
          </p>
          <button 
            onClick={() => navigate('/help/contact')}
            className="bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-all"
          >
            Contact Accessibility Team
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AccessibleResources;
