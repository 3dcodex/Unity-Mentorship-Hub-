import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <PublicHeader />
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex px-5 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <span className="text-sm font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Our Story</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent leading-tight">
            About Unity<br/>Mentorship Hub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            From Personal Journey to Purpose
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">The Beginning</h2>
              <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300">
                <p>At 19, co-founder <span className="font-bold text-blue-600 dark:text-blue-400">Kabi Clinton</span> relocated to Canada as an international student.</p>
                <div className="pl-6 border-l-4 border-blue-600 space-y-2 text-xl font-semibold text-gray-900 dark:text-white">
                  <p>New country.</p>
                  <p>New system.</p>
                  <p>New realities.</p>
                </div>
                <p>The challenge wasn't just academics. It was learning how to adapt, budget, navigate unfamiliar systems, and grow independently.</p>
                <p>He reached out to seniors, classmates, and professionals ahead of him. Over time, students began reaching out to him too.</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Mentorship was happening — but it wasn't structured.</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800" 
                className="relative w-full h-[500px] object-cover rounded-3xl shadow-2xl"
                alt="International students collaborating"
              />
            </div>
          </div>
        </section>

      {/* The Idea Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-xl rounded-3xl p-12 md:p-16 space-y-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-3xl">lightbulb</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">The Idea</h2>
              </div>
              <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300">
                <p>What started as a classroom idea evolved into <span className="font-bold text-blue-600 dark:text-blue-400">Unity Mentorship Hub</span>.</p>
                <p>We recognized a gap: Talented students needed more than motivation — they needed <span className="font-bold text-gray-900 dark:text-white">clarity, strategy, and access</span>.</p>
                <p>As an IT professional trained to think in systems, Kabi realized:</p>
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border-l-4 border-blue-600">
                  <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Growth without structure creates gaps.</p>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">So we built structure.</p>
              </div>
            </div>
          </div>
        </section>

      {/* Mission & Vision Grid */}
      <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 sm:p-12 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-3xl">flag</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                To create a community-driven mentorship platform that empowers students to grow intentionally — academically, professionally, and personally.
              </p>
              <div className="space-y-4">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">We believe mentorship should be:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    <span className="font-bold text-gray-900 dark:text-white">Accessible</span>
                  </div>
                  <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    <span className="font-bold text-gray-900 dark:text-white">Structured</span>
                  </div>
                  <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    <span className="font-bold text-gray-900 dark:text-white">Strategic</span>
                  </div>
                  <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                    <span className="font-bold text-gray-900 dark:text-white">Inclusive</span>
                  </div>
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-white pt-4">Not accidental.</p>
              </div>
            </div>

            {/* Vision Card */}
            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 sm:p-12 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-3xl">visibility</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Our Vision</h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                A world where every student — regardless of background — has access to guidance, opportunity, and a network that accelerates their growth.
              </p>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-purple-100 dark:border-purple-800">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Why Unity?</h3>
                <p className="text-xl font-bold text-primary mb-4">Because no one grows alone.</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Unity Mentorship Hub transforms informal support into an intentional system — where growth is guided, community-driven, and built to last.
                </p>
              </div>
            </div>
          </div>
        </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">Our Core Values</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl text-primary">diversity_3</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">Community First</h3>
                <p className="text-gray-600 dark:text-gray-400">Building connections that empower and uplift every member</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">trending_up</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">Intentional Growth</h3>
                <p className="text-gray-600 dark:text-gray-400">Structured pathways that turn potential into achievement</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl text-amber-600 dark:text-amber-400">handshake</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">Authentic Support</h3>
                <p className="text-gray-600 dark:text-gray-400">Real guidance from people who've walked the path</p>
              </div>
            </div>
          </div>
        </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <span className="material-symbols-outlined text-[500px] absolute -right-20 -top-20">diversity_1</span>
        </div>
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black">
            Ready to be part of the journey?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join Unity Mentorship Hub and start your intentional growth today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/signup" 
              className="px-10 py-5 bg-white text-purple-600 font-black rounded-xl shadow-2xl hover:scale-105 transition-all"
            >
              Get Started
            </Link>
            <Link 
              to="/ourimpact" 
              className="px-10 py-5 border-2 border-white/40 text-white font-black rounded-xl hover:bg-white/10 transition-all"
            >
              See Our Impact
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
