
import React from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../src/firebase';

const Landing: React.FC = () => {
  const [stats, setStats] = useState({
    students: 0,
    mentors: 0,
    sessions: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRef = collection(db, 'users');
        const studentsQuery = query(usersRef, where('role', '==', 'Student'));
        const mentorsQuery = query(usersRef, where('role', '==', 'Mentor'));
        
        const [studentsSnap, mentorsSnap] = await Promise.all([
          getDocs(studentsQuery),
          getDocs(mentorsQuery),
        ]);

        setStats({
          students: studentsSnap.size,
          mentors: mentorsSnap.size,
          sessions: studentsSnap.size + mentorsSnap.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

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
              Connect with peer mentors who understand your journey. Built by students, for students, prioritizing diversity, equity, and inclusion.
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

      {/* Stats Section */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">Making a Real Difference</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto">Our community is growing every day, creating meaningful connections and opportunities</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
              <div className="text-4xl font-black text-primary dark:text-blue-400 mb-2">{stats.students}+</div>
              <div className="text-sm font-bold text-gray-600 dark:text-gray-400">Active Students</div>
            </div>
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800">
              <div className="text-4xl font-black text-green-600 dark:text-green-400 mb-2">{stats.mentors}+</div>
              <div className="text-sm font-bold text-gray-600 dark:text-gray-400">Mentors</div>
            </div>
            <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
              <div className="text-4xl font-black text-purple-600 dark:text-purple-400 mb-2">{stats.sessions}+</div>
              <div className="text-sm font-bold text-gray-600 dark:text-gray-400">Sessions Completed</div>
            </div>
            <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
              <div className="text-4xl font-black text-amber-600 dark:text-amber-400 mb-2">15+</div>
              <div className="text-sm font-bold text-gray-600 dark:text-gray-400">Partner Employers</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gray-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-black mx-auto mb-6 shadow-lg">1</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">Create Your Profile</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Tell us about your goals, interests, and what you're looking for in a mentor</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-black mx-auto mb-6 shadow-lg">2</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">Get Matched</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Our AI-powered system connects you with mentors who align with your needs</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-black mx-auto mb-6 shadow-lg">3</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">Start Growing</h3>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Schedule sessions, access resources, and build meaningful connections</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 dark:bg-slate-900/50" id="who-we-serve">
        <div className="max-w-7xl mx-auto text-center mb-8 sm:mb-12 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Success Stories</h2>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <TestimonialCard 
            name="Iteriteka Aimable"
            role="Business Marketing Student, St. Lawrence College"
            quote="Through this platform, I have connected with numerous working professionals who have expanded my perspective and strengthened my professional network. The mentorship and exposure have given me clarity and confidence as I grow in my career journey."
            image="https://api.dicebear.com/7.x/avataaars/svg?seed=Iteriteka"
          />
          <TestimonialCard 
            name="Kabi Clinton Ngong"
            role="Information Systems Technician"
            quote="This platform has given me the opportunity to share my story, inspire students, and create meaningful impact within the community. It's more than networking — it's about building pathways for growth and leadership."
            image="https://api.dicebear.com/7.x/avataaars/svg?seed=Kabi"
          />
          <ComingSoonCard />
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
    <p className="text-gray-600 dark:text-gray-300 font-medium italic leading-relaxed">"{quote}"</p>
    <div className="flex gap-1 text-amber-400">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="material-symbols-outlined fill-1 text-lg">star</span>
      ))}
    </div>
  </div>
);

const ComingSoonCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] shadow-2xl shadow-gray-200/40 dark:shadow-black/30 border border-gray-50 dark:border-gray-700 space-y-6 relative overflow-hidden">
    <div className="absolute inset-0 backdrop-blur-sm bg-white/60 dark:bg-slate-800/60 z-10 flex flex-col items-center justify-center">
      <p className="text-2xl font-black text-gray-900 dark:text-white mb-2">Coming Soon</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">(Next Success Story Loading…)</p>
      <p className="text-xs text-primary dark:text-blue-400 font-bold mt-4">Be part of the next success story</p>
    </div>
    <div className="blur-sm">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-3xl bg-gray-200 dark:bg-gray-700" />
        <div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="space-y-2 mt-6">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  </div>
);

export default Landing;
