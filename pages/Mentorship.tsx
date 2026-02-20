
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const Mentorship: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-500 space-y-6 sm:space-y-8 md:space-y-16">
      {/* Hero Section */}
      <section className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 overflow-hidden shadow-xl shadow-gray-200/50 flex flex-col md:flex-row">
        <div className="p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-16 flex-1 space-y-4 sm:space-y-6 md:space-y-8">
          <div className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-primary text-[10px] font-black uppercase tracking-widest">DEI Focused Support</div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 leading-tight">
            Peer-Powered <br/> Mentorship
          </h1>
          <p className="text-base sm:text-lg text-gray-500 font-medium leading-relaxed">
            Mentorship by students, for students. Bridging gaps through lived experience and a commitment to inclusive success.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => navigate('/mentorship/tracks')}
              className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
            >
              Explore Tracks
            </button>
            <button 
              onClick={() => navigate('/mentorship/how-it-works')}
              className="px-10 py-4 bg-white border-2 border-gray-100 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all"
            >
              How it Works
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-[400px]">
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000" 
            className="w-full h-full object-cover"
            alt="Students collaborating"
          />
        </div>
      </section>

      {/* Matching Quiz CTA */}
      <section className="bg-blue-50 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-16 flex flex-col md:flex-row items-center gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12 border border-blue-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 opacity-5">
           <span className="material-symbols-outlined text-[200px] text-primary">psychology</span>
        </div>
        <div className="flex-1 space-y-4 sm:space-y-6 md:space-y-8 relative z-10">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined font-black">hub</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Smart Matching</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight">Take the Mentorship Match Quiz</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            Our AI-powered algorithm analyzes your goals to connect you with the right mentor. Whether you need academic help, emotional support, or a career roadmap.
          </p>
        </div>
        <div className="flex-shrink-0 relative z-10">
          <button 
            onClick={() => navigate('/mentorship/match')}
            className="px-12 py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
          >
            Start Match Quiz
          </button>
        </div>
      </section>

      {/* Tracks Section */}
      <section>
        <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black mb-10">Mentorship Tracks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
          <TrackCard 
            img="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600"
            title="Peer Mentoring"
            icon="groups"
            desc="Shared experiences navigating campus life. Connect with upperclassmen who have walked in your shoes."
            linkText="Explore Peer Mentors"
            to="/mentorship/book"
          />
          <TrackCard 
            img="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=600"
            title="Professional Mentoring"
            icon="business_center"
            desc="Strategic connections with alumni and industry leaders. Get career advice and networking opportunities."
            linkText="Join Alumni Network"
            to="/mentorship/join-professional"
          />
          <TrackCard 
            img="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=600"
            title="Cultural Mentoring"
            icon="public"
            desc="Fostering international and domestic exchange. Bridge cultures and build global understanding."
            linkText="Start Cultural Exchange"
            to="/mentorship/join-cultural"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
        <div className="space-y-4 max-w-xl">
          <h2 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight">Ready to make an impact?</h2>
          <p className="text-gray-400 font-medium text-base sm:text-lg leading-relaxed">
            If you've navigated student life and want to help others succeed, join our mentor community. Gain leadership skills, expand your network, and give back.
          </p>
        </div>
        <button className="px-12 py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all min-w-[240px]">
          Become a Mentor
        </button>
      </section>

      <Footer />
    </div>
  );
};

const TrackCard: React.FC<{ img: string, title: string, desc: string, linkText: string, icon: string, to: string }> = ({ img, title, desc, linkText, icon, to }) => (
  <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-50 shadow-xl shadow-gray-200/40 overflow-hidden flex flex-col h-full group">
    <div className="h-40 sm:h-52 md:h-64 overflow-hidden">
      <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={title} />
    </div>
    <div className="p-4 sm:p-6 md:p-8 flex flex-col flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900">{title}</h3>
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <p className="text-sm text-gray-400 font-medium leading-relaxed flex-1">{desc}</p>
      <Link to={to} className="inline-flex items-center gap-2 text-sm font-black text-primary hover:translate-x-1 transition-transform">
        {linkText}
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </Link>
    </div>
  </div>
);

export default Mentorship;
