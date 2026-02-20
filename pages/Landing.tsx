
import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100">
      <PublicHeader />

      <main className="flex-1">
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-12 md:pt-20 pb-12 sm:pb-24 md:pb-32 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10"></div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8 md:space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-gray-900 dark:text-white">
              Where <br/> every student <br/> <span className="text-primary dark:text-blue-400">belongs.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium max-w-lg leading-relaxed">
              Connect with peer mentors who understand your journey. Built by students, for students, prioritizing diversity and equity.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-4">
              <Link to="/mentorship/match" className="px-6 sm:px-10 py-3 sm:py-5 bg-primary dark:bg-blue-600 text-white font-black rounded-xl sm:rounded-2xl shadow-2xl shadow-primary/30 dark:shadow-blue-600/30 hover:shadow-primary/50 dark:hover:shadow-blue-600/50 hover:scale-[1.02] transition-all text-center text-sm sm:text-base">
                Get Matched with a Mentor
              </Link>
              <Link to="/mentorship/book-chat" className="px-6 sm:px-10 py-3 sm:py-5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-black rounded-xl sm:rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-primary dark:hover:border-blue-400 hover:text-primary dark:hover:text-blue-400 transition-all text-center text-sm sm:text-base">
                Book a Chat
              </Link>
            </div>
          </div>
          <div className="relative animate-in fade-in zoom-in-95 duration-1000 hidden sm:block">
            <div className="absolute -inset-4 bg-primary/5 rounded-[60px] blur-3xl -z-10"></div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=600" 
                alt="Diverse students" 
                className="w-full h-48 sm:h-80 md:h-[580px] object-cover rounded-2xl sm:rounded-[56px] shadow-2xl border-4 sm:border-8 border-white"
              />
              <div className="absolute -bottom-4 sm:-bottom-8 -left-4 sm:-left-8 bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-bounce duration-[3000ms]">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="size-8 sm:size-12 rounded-xl sm:rounded-2xl bg-primary dark:bg-blue-600 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-sm sm:text-base">auto_awesome</span>
                  </div>
                  <div>
                    <p className="text-[8px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">New Matches</p>
                    <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">3 AI Recommendations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEI Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-gray-50/50 dark:bg-slate-800/50 px-4 sm:px-6" id="about">
        <div className="max-w-7xl mx-auto text-center space-y-2 sm:space-y-4 mb-8 sm:mb-12 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Our Commitment to DEI</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            We provide resources tailored to the unique needs of every student, ensuring no one is left behind in their academic or professional journey.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <DEICard 
            image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=600"
            icon="groups"
            title="Peer Mentorship"
            desc="Connect with mentors who share your background and experiences. Find someone who truly understands your path."
            to="/peer-mentorship"
          />
          <DEICard 
            image="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600"
            icon="menu_book"
            title="Accessible Resources"
            desc="A library of guides on life, career, and academic success. All materials are designed with accessibility in mind."
            to="/accessible-resources"
          />
          <DEICard 
            image="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=600"
            icon="verified_user"
            title="Safe Spaces"
            desc="Vetted environments where diversity is celebrated. Join forums and groups where you can be your authentic self."
            to="/safe-spaces"
          />
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 dark:bg-slate-900/50" id="who-we-serve">
        <div className="max-w-7xl mx-auto text-center mb-8 sm:mb-12 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Success Stories</h2>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <TestimonialCard 
            name="Sarah Jenkins"
            role="Mentee, Class of '24"
            quote="UnityMentor Hub helped me find a community where I felt seen and heard. My mentor provided the guidance I needed to navigate my first internship application."
            image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
          />
          <TestimonialCard 
            name="Marcus Chen"
            role="Senior Mentor"
            quote="Being a mentor here is incredibly rewarding. Seeing students gain confidence and hit their milestones is exactly why I joined this community."
            image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
          />
          <TestimonialCard 
            name="Jordan Rivera"
            role="Student Ambassador"
            quote="The resources are world-class. I used the DEI library to host a workshop at my campus, and the feedback was phenomenal."
            image="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-20 md:py-32 px-4 sm:px-6 bg-primary dark:bg-blue-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[300px] sm:text-[500px] absolute -right-20 -top-20">diversity_1</span>
        </div>
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10 relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">Ready to start your journey?</h2>
          <p className="text-base sm:text-lg md:text-xl opacity-90 font-medium leading-relaxed">Join thousands of students building a more inclusive future together.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <Link to="/mentorship/match" className="px-8 sm:px-12 py-3 sm:py-5 bg-white dark:bg-slate-900 text-primary dark:text-blue-400 font-black rounded-xl sm:rounded-2xl shadow-2xl hover:scale-105 transition-all text-sm sm:text-base">
              Get Matched with a Mentor
            </Link>
            <Link to="/resources" className="px-8 sm:px-12 py-3 sm:py-5 border-2 border-white/40 text-white font-black rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all text-sm sm:text-base">
              Explore Resources
            </Link>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
};

const DEICard: React.FC<{ image: string, icon: string, title: string, desc: string, to: string }> = ({ image, icon, title, desc, to }) => (
  <Link to={to} className="bg-white dark:bg-slate-800 rounded-[40px] overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-black/30 hover:-translate-y-2 transition-all duration-300 border border-gray-50 dark:border-gray-700 group block">
    <div className="h-64 overflow-hidden">
      <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
    </div>
    <div className="p-8 space-y-4">
      <div className="flex items-center gap-3 text-primary dark:text-blue-400">
        <span className="material-symbols-outlined font-black">{icon}</span>
        <h3 className="text-xl font-black text-gray-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium">{desc}</p>
      <div className="pt-2 flex items-center gap-2 text-xs font-black text-primary dark:text-blue-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Explore Pillar <span className="material-symbols-outlined text-sm">arrow_forward</span>
      </div>
    </div>
  </Link>
);

const TestimonialCard: React.FC<{ name: string, role: string, quote: string, image: string }> = ({ name, role, quote, image }) => (
  <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] shadow-2xl shadow-gray-200/40 dark:shadow-black/30 border border-gray-50 dark:border-gray-700 space-y-6">
    <div className="flex items-center gap-4">
      <img src={image} alt={name} className="size-16 rounded-3xl object-cover border-4 border-primary/10 dark:border-blue-500/20 shadow-lg" />
      <div>
        <h4 className="font-black text-gray-900 dark:text-white leading-none">{name}</h4>
        <p className="text-xs font-bold text-primary dark:text-blue-400 mt-2">{role}</p>
      </div>
    </div>
    <p className="text-gray-600 dark:text-gray-300 font-medium italic leading-relaxed">\"" + quote + "\""</p>
    <div className="flex gap-1 text-amber-400">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="material-symbols-outlined fill-1 text-lg">star</span>
      ))}
    </div>
  </div>
);

export default Landing;
