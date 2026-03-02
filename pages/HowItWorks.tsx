import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const HowItWorks: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    { num: '01', title: 'Create Your Profile', desc: 'Sign up and tell us about your background, goals, and what you need help with.', icon: 'person_add', color: 'from-blue-600 to-indigo-600' },
    { num: '02', title: 'Get Matched', desc: 'Our AI-powered system matches you with mentors who understand your unique journey.', icon: 'auto_awesome', color: 'from-purple-600 to-pink-600' },
    { num: '03', title: 'Connect & Learn', desc: 'Book sessions, chat instantly, and access resources tailored to your needs.', icon: 'chat', color: 'from-green-600 to-teal-600' },
    { num: '04', title: 'Achieve Your Goals', desc: 'Track progress, build skills, and reach milestones with ongoing support.', icon: 'emoji_events', color: 'from-orange-600 to-red-600' }
  ];

  const features = [
    { icon: 'verified_user', title: 'Vetted Mentors', desc: 'All mentors are carefully screened and trained' },
    { icon: 'lock', title: 'Secure & Private', desc: 'Your data and conversations are fully protected' },
    { icon: 'diversity_3', title: 'Inclusive Community', desc: 'Celebrating diversity in every interaction' },
    { icon: 'schedule', title: 'Flexible Scheduling', desc: 'Book sessions that fit your busy life' },
    { icon: 'workspace_premium', title: 'Quality Guaranteed', desc: 'Satisfaction guaranteed or your money back' },
    { icon: 'support_agent', title: '24/7 Support', desc: 'Our team is always here to help you' }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-6 z-10">
          <div className="inline-flex px-5 py-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <span className="text-sm font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">How It Works</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent">
            Your Journey to Success
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Four simple steps to connect with mentors who understand your unique path and help you achieve your goals.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-20">
          {steps.map((step, index) => (
            <div key={step.num} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12`}>
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-2xl`}>
                    <span className="material-symbols-outlined text-white text-3xl">{step.icon}</span>
                  </div>
                  <div className="text-7xl font-black text-gray-100 dark:text-slate-800">{step.num}</div>
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white">{step.title}</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="relative w-80 h-80 bg-white dark:bg-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5 rounded-3xl`}></div>
                  <span className={`material-symbols-outlined text-9xl bg-gradient-to-br ${step.color} bg-clip-text text-transparent`}>{step.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-gray-900 dark:text-white">Why Choose Unity Mentorship Hub</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Everything you need for a successful mentorship experience</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white dark:bg-slate-900 backdrop-blur-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl hover:scale-105 transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                  <span className="material-symbols-outlined text-white text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-black mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-4xl font-black text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8">Join thousands of students already achieving their goals with Unity Mentorship Hub</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold shadow-xl hover:scale-105 transition-all"
            >
              Sign Up Free
            </button>
            <button
              onClick={() => navigate('/mentorship-info')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white rounded-xl font-bold hover:bg-white/20 transition-all"
            >
              Browse Mentors
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
