import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import { Users, Briefcase, Award, TrendingUp, Heart, Globe, Target, BookOpen } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../src/firebase';
import { errorService } from '../services/errorService';

const impactStats = [
  { value: '2,500+', label: 'Students Mentored', icon: Users, color: 'text-blue-600 dark:text-blue-400' },
  { value: '450+', label: 'Active Mentors', icon: Heart, color: 'text-rose-600 dark:text-rose-400' },
  { value: '85%', label: 'Career Success Rate', icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
  { value: '50+', label: 'Partner Organizations', icon: Briefcase, color: 'text-purple-600 dark:text-purple-400' },
  { value: '15K+', label: 'Mentoring Hours', icon: BookOpen, color: 'text-amber-600 dark:text-amber-400' },
  { value: '30+', label: 'Countries Reached', icon: Globe, color: 'text-cyan-600 dark:text-cyan-400' },
];

const outcomes = [
  { title: 'Career Advancement', stat: '78%', description: 'of mentees secured internships or jobs within 6 months', icon: Briefcase },
  { title: 'Skill Development', stat: '92%', description: 'reported improved technical and soft skills', icon: Award },
  { title: 'Network Growth', stat: '3.5x', description: 'average increase in professional connections', icon: Users },
  { title: 'Confidence Boost', stat: '89%', description: 'felt more confident in their career path', icon: Target },
];

const stories = [
  {
    name: 'Iteriteka Aimable',
    role: 'Business Marketing Student, St. Lawrence College',
    quote: 'Through this platform, I have connected with numerous working professionals who have expanded my perspective and strengthened my professional network. The mentorship and exposure have given me clarity and confidence as I grow in my career journey.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Iteriteka',
    achievement: 'Expanded Network',
  },
  {
    name: 'Kabi Clinton Ngong',
    role: 'Information Systems Technician',
    quote: 'This platform has given me the opportunity to share my story, inspire students, and create meaningful impact within the community. It\'s more than networking — it\'s about building pathways for growth and leadership.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kabi',
    achievement: 'Community Leader',
  },
];

const milestones = [
  { year: '2020', title: 'Platform Launch', description: 'Started with 50 students and 10 mentors' },
  { year: '2021', title: 'First 1,000 Connections', description: 'Reached milestone of 1,000 mentor-mentee matches' },
  { year: '2022', title: 'Global Expansion', description: 'Expanded to 15 countries across 4 continents' },
  { year: '2023', title: 'Corporate Partnerships', description: 'Partnered with 50+ leading organizations' },
  { year: '2024', title: 'AI-Powered Matching', description: 'Launched intelligent mentor-mentee matching system' },
];

const initiatives = [
  {
    title: 'Diversity in Tech',
    description: 'Supporting underrepresented groups in technology careers',
    impact: '60% of mentees from underrepresented backgrounds',
    icon: Users,
  },
  {
    title: 'Career Transitions',
    description: 'Helping professionals pivot into new industries',
    impact: '500+ successful career transitions',
    icon: TrendingUp,
  },
  {
    title: 'Student Success',
    description: 'Empowering students to achieve their academic and career goals',
    impact: '2,000+ students supported annually',
    icon: Award,
  },
];

const OurImpact: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
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
        errorService.handleError(error, 'Error fetching stats');
      }
    };

    fetchStats();
  }, []);

  const impactStats = [
    { value: `${stats.students}+`, label: 'Students Mentored', icon: Users, color: 'text-blue-600 dark:text-blue-400' },
    { value: `${stats.mentors}+`, label: 'Active Mentors', icon: Heart, color: 'text-rose-600 dark:text-rose-400' },
    { value: '85%', label: 'Career Success Rate', icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
    { value: '50+', label: 'Partner Organizations', icon: Briefcase, color: 'text-purple-600 dark:text-purple-400' },
    { value: `${stats.sessions}+`, label: 'Mentoring Hours', icon: BookOpen, color: 'text-amber-600 dark:text-amber-400' },
    { value: '30+', label: 'Countries Reached', icon: Globe, color: 'text-cyan-600 dark:text-cyan-400' },
  ];

  const handleSignUp = () => {
    if (currentUser) {
      navigate('/resources');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 font-sans text-gray-900 dark:text-gray-100">
      <PublicHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-64 sm:h-96 md:h-[500px] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-blue-900/90 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1600"
            className="absolute inset-0 w-full h-full object-cover"
            alt="Impact Hero"
          />
          <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-4xl mx-auto space-y-6 text-white">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight tracking-tight drop-shadow-lg">
              Transforming Lives Through Mentorship
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium opacity-95 max-w-3xl mx-auto leading-relaxed drop-shadow">
              Real people. Real growth. Real impact. See how we're building a more inclusive future.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-12 dark:text-white">Impact by the Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {impactStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                    <Icon className={`w-8 h-8 ${stat.color} mb-3`} />
                    <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Key Outcomes */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-4 dark:text-white">Measurable Outcomes</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Our mentorship programs deliver tangible results that transform careers and lives
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {outcomes.map((outcome) => {
                const Icon = outcome.icon;
                return (
                  <div key={outcome.title} className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                    <Icon className="w-12 h-12 text-primary mb-4" />
                    <div className="text-4xl font-black text-primary mb-2">{outcome.stat}</div>
                    <h3 className="text-lg font-bold mb-2 dark:text-white">{outcome.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{outcome.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-16 px-4 sm:px-6 bg-gray-50 dark:bg-slate-800">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-4 dark:text-white">Success Stories</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Hear from the mentors and mentees who are part of our growing community
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stories.map((story) => (
                <div key={story.name} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all hover:-translate-y-1">
                  <img src={story.image} alt={story.name} className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-primary shadow-md" />
                  <div className="text-center mb-4">
                    <div className="font-bold text-lg text-gray-900 dark:text-white">{story.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{story.role}</div>
                    <div className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1 rounded-full font-semibold">
                      {story.achievement}
                    </div>
                  </div>
                  <blockquote className="text-sm italic text-gray-700 dark:text-gray-300 text-center">
                    "{story.quote}"
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Journey */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-12 dark:text-white">Our Journey</h2>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-blue-600 hidden md:block"></div>
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={milestone.year} className="relative flex items-start md:pl-20">
                    <div className="absolute left-0 md:left-4 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg">
                      {milestone.year}
                    </div>
                    <div className="ml-20 md:ml-0 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 flex-1">
                      <h3 className="text-xl font-bold mb-2 dark:text-white">{milestone.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Key Initiatives */}
        <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-primary/5 to-blue-50 dark:from-slate-800 dark:to-slate-900">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-4 dark:text-white">Key Initiatives</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Focused programs driving meaningful change in communities worldwide
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {initiatives.map((initiative) => {
                const Icon = initiative.icon;
                return (
                  <div key={initiative.title} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="bg-primary/10 dark:bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 dark:text-white">{initiative.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{initiative.description}</p>
                    <div className="text-sm font-bold text-primary">{initiative.impact}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-r from-primary to-blue-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6">Be Part of Our Impact</h2>
            <p className="text-lg sm:text-xl mb-8 opacity-95">
              Whether you're seeking guidance or ready to give back, join our community and help create lasting change.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleSignUp}
                className="bg-white text-primary px-8 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-all"
              >
                {currentUser ? 'Go to Resources' : 'Sign Up Now'}
              </button>
              <button 
                onClick={() => navigate('/mentorship')}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-primary transition-all"
              >
                Learn More
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer variant="simple" />
    </div>
  );
};

export default OurImpact;
