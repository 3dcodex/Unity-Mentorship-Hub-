
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const WhoWeServe: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 pt-12 pb-20">
          <div className="max-w-7xl mx-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-purple-900/20 dark:to-slate-800 rounded-3xl md:rounded-[48px] p-8 md:p-16 lg:p-20 relative overflow-hidden">
            <div className="max-w-3xl relative z-10 space-y-6">
              <h1 className="text-4xl md:text-6xl font-black leading-tight text-gray-900 dark:text-white">
                Who We Serve: <br/>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Our Community Roles</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                A multi-faceted ecosystem designed to empower students, professionals, and partners through inclusive mentorship and DEI-focused resources.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all">
                  Join the Hub Today
                </button>
                <button onClick={() => navigate('/resources')} className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-black rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all">
                  View Resources
                </button>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
              <span className="material-symbols-outlined text-[400px]">diversity_3</span>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">Empowering Every Role in Our Ecosystem</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Discover the tailored support and unique opportunities available for each member of our community.
            </p>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 mb-12">
            <RoleCard 
              icon="public"
              title="International Students"
              desc="Navigating a new academic and professional landscape can be challenging. We're here to help."
              bullets={["Visa guidance & support", "Cultural transition workshops", "English language mentorship"]}
              btnText="Sign Up as Student"
              onClick={() => navigate('/signup')}
            />
            <RoleCard 
              icon="school"
              title="Domestic Students"
              desc="Expand your network and build leadership skills that set you apart in the local market."
              bullets={["Local career path planning", "Peer networking events", "Campus leadership roles"]}
              btnText="Sign Up as Student"
              onClick={() => navigate('/signup')}
            />
            <RoleCard 
              icon="history_edu"
              title="Alumni"
              desc="Stay connected with your alma mater and give back to the next generation of talent."
              bullets={["Mentoring current students", "Lifelong learning resources", "Exclusive alumni network"]}
              btnText="Join Alumni Network"
              onClick={() => navigate('/signup')}
            />
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
            <RoleCard 
              icon="settings_account_box"
              title="Professionals"
              desc="Share your industry insights and advocate for more diverse and inclusive workplaces."
              bullets={["Industry trend sharing", "Professional mentoring", "DEI leadership advocacy"]}
              btnText="Apply as Mentor"
              onClick={() => navigate('/become-mentor')}
            />
            <RoleCard 
              icon="business"
              title="Partner Companies"
              desc="Access a diverse pipeline of talent and strengthen your corporate social responsibility."
              bullets={["Direct diverse talent access", "Employer branding & CSR", "Diversity recruitment tools"]}
              btnText="Become a Partner"
              onClick={() => navigate('/help/contact')}
            />
          </div>
        </section>

        {/* Path Choice CTA */}
        <section className="py-20 px-6 bg-gray-50 dark:bg-slate-800">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 dark:from-slate-800 dark:via-purple-900 dark:to-slate-800 rounded-3xl md:rounded-[48px] p-12 md:p-20 text-center text-white space-y-8">
            <h2 className="text-4xl md:text-5xl font-black leading-tight">Choose Your Path and Join Us Today</h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
              Not sure which role fits you best? Join as a general member and explore the platform to find your perfect fit in the UnityMentor Hub community.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
              <button onClick={() => navigate('/signup')} className="px-12 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-black rounded-2xl shadow-2xl hover:scale-105 transition-all">
                Get Started Now
              </button>
              <button onClick={() => navigate('/help/contact')} className="text-white font-bold hover:underline">
                Talk to an advisor
              </button>
            </div>
          </div>
        </section>

      </main>
      <Footer variant="simple" />
    </div>
  );
};

const RoleCard: React.FC<{ icon: string, title: string, desc: string, bullets: string[], btnText: string, onClick: () => void }> = ({ icon, title, desc, bullets, btnText, onClick }) => (
  <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl flex flex-col items-start text-left space-y-6 group transition-all">
    <div className="size-14 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
      <span className="material-symbols-outlined text-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{icon}</span>
    </div>
    <div className="space-y-3 flex-1">
      <h3 className="text-xl font-black text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
      <ul className="space-y-3 pt-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="material-symbols-outlined text-lg flex-shrink-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">check_circle</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
    <button onClick={onClick} className="w-full py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-gray-900 dark:text-gray-200 hover:text-white font-black rounded-2xl text-sm uppercase tracking-wider transition-all">
      {btnText}
    </button>
  </div>
);

export default WhoWeServe;
