
import React from 'react';
import PublicHeader from '../components/PublicHeader';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const PeerMentorship: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PublicHeader />
      <main className="flex-1 animate-in fade-in duration-700">
        <section className="py-8 sm:py-12 md:py-20 px-6 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8">
            <div className="inline-flex px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">Core Pillar</div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl md:text-6xl font-black text-gray-900 leading-tight">Peer Mentorship</h1>
            <p className="text-base sm:text-base sm:text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Connecting students who share lived experiences to build community, confidence, and academic success.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-4 sm:gap-8 md:gap-16 items-center">
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              <h2 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">By Students, <br/> For Students</h2>
              <p className="text-base sm:text-lg text-gray-500 font-medium leading-relaxed">
                Traditional mentorship can feel hierarchical. Our peer model breaks down barriers, allowing you to learn from upperclassmen who have recently faced the same challenges as you.
              </p>
              <ul className="space-y-6">
                <BenefitItem icon="psychology" title="Lived Experience" desc="Mentors share practical strategies they used to succeed on your specific campus." />
                <BenefitItem icon="diversity_3" title="Shared Backgrounds" desc="Filter mentors by identity, major, and interests to find someone who truly gets it." />
                <BenefitItem icon="verified" title="Safe Discussions" desc="Ask the 'silly' questions in a judgment-free, peer-to-peer environment." />
              </ul>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" className="rounded-[48px] shadow-2xl" alt="Students talking" />
              <div className="absolute -bottom-8 -right-8 bg-primary p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] text-white shadow-2xl max-w-xs space-y-2">
                <p className="text-xl sm:text-2xl md:text-3xl font-black">500+</p>
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest leading-tight">Active Peer Mentors Ready to Help</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 bg-gray-900 text-white px-6">
          <div className="max-w-7xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-16">
            <h2 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black">Our Mentoring Framework</h2>
            <div className="grid md:grid-cols-3 gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12">
              <FrameworkCard 
                step="01" 
                title="Matching" 
                desc="Our AI matches you based on academic needs and identity markers to ensure alignment." 
              />
              <FrameworkCard 
                step="02" 
                title="Intro Chat" 
                desc="A casual 15-minute sync to see if the vibe is right before committing to long-term goals." 
              />
              <FrameworkCard 
                step="03" 
                title="Active Support" 
                desc="Weekly or bi-weekly check-ins focused on specific milestones and emotional wellbeing." 
              />
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-16 md:py-32 text-center px-6">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900">Ready to find your guide?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/welcome" className="px-12 py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                Sign Up & Get Matched
              </Link>
              <Link to="/who-we-serve" className="px-12 py-5 border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all">
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const BenefitItem: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="flex gap-6">
    <div className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div className="space-y-1">
      <h4 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900">{title}</h4>
      <p className="text-gray-500 font-medium">{desc}</p>
    </div>
  </div>
);

const FrameworkCard: React.FC<{ step: string, title: string, desc: string }> = ({ step, title, desc }) => (
  <div className="bg-white/5 border border-white/10 p-10 rounded-2xl sm:rounded-3xl md:rounded-[40px] text-left space-y-6 hover:bg-white/10 transition-colors">
    <div className="text-2xl sm:text-3xl md:text-5xl font-black text-primary/30 leading-none">{step}</div>
    <h3 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black">{title}</h3>
    <p className="text-gray-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

export default PeerMentorship;
