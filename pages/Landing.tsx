import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../src/firebase';
import { getFeaturedStories } from '../services/storyService';
import { UserStory } from '../types/stories';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const Landing: React.FC = () => {
  const [stats, setStats] = useState({ students: 0, mentors: 0, sessions: 0 });
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsSnap, mentorsSnap, featuredStories] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'Student'))),
          getDocs(query(collection(db, 'users'), where('isMentor', '==', true))),
          getFeaturedStories(),
        ]);

        setStats({
          students: studentsSnap.size,
          mentors: mentorsSnap.size,
          sessions: studentsSnap.size + mentorsSnap.size,
        });
        setStories(featuredStories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-tight">
              Where Every Student <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Belongs</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Connect with mentors who understand your journey. Built by students, for students, prioritizing diversity, equity, and inclusion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/signup" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                Get Started Free
              </Link>
              <Link to="/about" className="px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl text-gray-900 dark:text-white font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard value={`${stats.students}+`} label="Active Students" color="blue" />
            <StatCard value={`${stats.mentors}+`} label="Mentors" color="green" />
            <StatCard value={`${stats.sessions}+`} label="Sessions" color="purple" />
            <StatCard value="15+" label="Partners" color="amber" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Our Commitment to DEI</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Resources tailored to the unique needs of every student
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="groups"
              title="Peer Mentorship"
              description="Connect with mentors who share your background and experiences"
              link="/peer-mentorship"
            />
            <FeatureCard
              icon="menu_book"
              title="Accessible Resources"
              description="Guides on life, career, and academic success for everyone"
              link="/accessible-resources"
            />
            <FeatureCard
              icon="verified_user"
              title="Safe Spaces"
              description="Vetted environments where diversity is celebrated"
              link="/safe-spaces"
            />
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 px-4 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Success Stories</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Real stories from our community</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              <>
                <StoryCardSkeleton />
                <StoryCardSkeleton />
                <StoryCardSkeleton />
              </>
            ) : stories.length > 0 ? (
              stories.map(story => <StoryCard key={story.id} story={story} />)
            ) : (
              <>
                <DefaultStory />
                <DefaultStory />
                <ComingSoonCard />
              </>
            )}
          </div>
          <div className="text-center mt-12">
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
              Share Your Story
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <StepCard number={1} title="Create Profile" description="Tell us about your goals and interests" />
            <StepCard number={2} title="Get Matched" description="AI connects you with perfect mentors" />
            <StepCard number={3} title="Start Growing" description="Schedule sessions and access resources" />
          </div>
        </div>
      </section>

      {/* Why Choose Unity */}
      <section className="py-20 px-4 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Why Choose Unity?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Built with students in mind</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <BenefitCard icon="diversity_3" title="Inclusive Community" description="Connect with diverse peers and mentors" />
            <BenefitCard icon="psychology" title="AI-Powered Matching" description="Smart algorithms find your perfect mentor" />
            <BenefitCard icon="workspace_premium" title="Verified Mentors" description="All mentors are vetted professionals" />
            <BenefitCard icon="schedule" title="Flexible Scheduling" description="Book sessions that fit your schedule" />
          </div>
        </div>
      </section>

      {/* Resources Preview */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Explore Our Resources</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Everything you need to succeed</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ResourceCard icon="school" title="Academic Support" description="Study guides, tutoring, and academic resources" link="/resources/academics" />
            <ResourceCard icon="work" title="Career Development" description="Resume building, interview prep, and job search" link="/career" />
            <ResourceCard icon="account_balance" title="Financial Aid" description="Scholarships, grants, and financial planning" link="/resources/financial-aid" />
            <ResourceCard icon="favorite" title="Wellness" description="Mental health resources and self-care tips" link="/resources" />
            <ResourceCard icon="public" title="DEI Resources" description="Diversity, equity, and inclusion guides" link="/resources/dei-guides" />
            <ResourceCard icon="groups" title="Community" description="Join groups and connect with peers" link="/community" />
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-20 px-4 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">What Students Say</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Hear from our community members</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <TestimonialCard 
              quote="Unity helped me find a mentor who truly understood my challenges as an international student. The support has been life-changing."
              author="Sarah Chen"
              role="Computer Science Student"
            />
            <TestimonialCard 
              quote="The resources and community here are incredible. I've grown both academically and personally thanks to Unity."
              author="Marcus Johnson"
              role="Business Major"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <span className="material-symbols-outlined text-[500px] absolute -right-20 -top-20">diversity_1</span>
        </div>
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black">Ready to Start Your Journey?</h2>
          <p className="text-xl opacity-90">Join thousands of students building a more inclusive future</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:scale-105 transition-all">
              Get Started Free
            </Link>
            <Link to="/resources" className="px-8 py-4 border-2 border-white/40 text-white font-bold rounded-xl hover:bg-white/10 transition-all">
              Explore Resources
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

const StatCard: React.FC<{ value: string; label: string; color: string }> = ({ value, label, color }) => (
  <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-2xl border border-${color}-200 dark:border-${color}-800 text-center`}>
    <div className={`text-4xl font-black text-${color}-600 dark:text-${color}-400 mb-2`}>{value}</div>
    <div className="text-sm font-bold text-gray-600 dark:text-gray-400">{label}</div>
  </div>
);

const FeatureCard: React.FC<{ icon: string; title: string; description: string; link: string }> = ({ icon, title, description, link }) => (
  <Link to={link} className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all">
    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <span className="material-symbols-outlined text-white text-3xl">{icon}</span>
    </div>
    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </Link>
);

const StoryCard: React.FC<{ story: UserStory }> = ({ story }) => (
  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-4">
    <div className="flex items-center gap-3">
      <img src={story.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.userName}`} alt={story.userName} className="w-12 h-12 rounded-full" />
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white">{story.userName}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">{story.userRole}</p>
      </div>
    </div>
    <h3 className="text-xl font-black text-gray-900 dark:text-white">{story.title}</h3>
    <p className="text-gray-600 dark:text-gray-400 line-clamp-4">{story.story}</p>
    <div className="flex items-center gap-4 pt-2">
      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
        <span className="material-symbols-outlined text-red-500">favorite</span>
        <span className="text-sm font-bold">{story.likes}</span>
      </div>
      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
        <span className="material-symbols-outlined">comment</span>
        <span className="text-sm font-bold">{story.comments?.length || 0}</span>
      </div>
    </div>
  </div>
);

const DefaultStory: React.FC = () => (
  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-4">
    <div className="flex items-center gap-3">
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=default" alt="User" className="w-12 h-12 rounded-full" />
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white">Community Member</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">Student</p>
      </div>
    </div>
    <h3 className="text-xl font-black text-gray-900 dark:text-white">Your Story Here</h3>
    <p className="text-gray-600 dark:text-gray-400">Share your journey and inspire others. Login to submit your success story.</p>
  </div>
);

const ComingSoonCard: React.FC = () => (
  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-[300px]">
    <div className="text-center space-y-3">
      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">auto_stories</span>
      <h3 className="text-2xl font-black text-gray-900 dark:text-white">Coming Soon</h3>
      <p className="text-gray-600 dark:text-gray-400">Next success story loading...</p>
    </div>
  </div>
);

const StoryCardSkeleton: React.FC = () => (
  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      </div>
    </div>
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
  </div>
);

const StepCard: React.FC<{ number: number; title: string; description: string }> = ({ number, title, description }) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-black mx-auto mb-6 shadow-lg">
      {number}
    </div>
    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

const BenefitCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="text-center p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all">
    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
      <span className="material-symbols-outlined text-white text-2xl">{icon}</span>
    </div>
    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

const ResourceCard: React.FC<{ icon: string; title: string; description: string; link: string }> = ({ icon, title, description, link }) => (
  <Link to={link} className="group p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all">
    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <span className="material-symbols-outlined text-white text-xl">{icon}</span>
    </div>
    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-bold">
      Learn More
      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
    </div>
  </Link>
);

const TestimonialCard: React.FC<{ quote: string; author: string; role: string }> = ({ quote, author, role }) => (
  <div className="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 space-y-6">
    <div className="flex gap-1 text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="material-symbols-outlined fill-1">star</span>
      ))}
    </div>
    <p className="text-lg text-gray-700 dark:text-gray-300 italic">"{quote}"</p>
    <div>
      <p className="font-black text-gray-900 dark:text-white">{author}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>
    </div>
  </div>
);

export default Landing;
