
import React from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const WhoWeServe: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      <PublicHeader />

      <main className="flex-1">
      {/* Hero Section */}
      <section className="px-6 pt-12 pb-24">
        <div className="max-w-7xl mx-auto bg-blue-50 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-6 sm:p-8 md:p-12 lg:p-24 relative overflow-hidden animate-in fade-in duration-700">
          <div className="max-w-2xl relative z-10 space-y-6">
            <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl md:text-2xl sm:text-3xl md:text-5xl font-black text-gray-900">
              Who We Serve: <br/>
              <span className="text-primary">Our Community Roles</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed">
              A multi-faceted ecosystem designed to empower students, professionals, and partners through inclusive mentorship and DEI-focused resources. Join a community built on growth and equity.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all">Join the Hub Today</button>
              <button className="px-10 py-4 bg-white text-gray-900 font-black rounded-2xl border border-gray-100 hover:border-primary transition-all">View Resources</button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
             <span className="material-symbols-outlined text-[400px]">diversity_3</span>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black">Empowering Every Role in Our Ecosystem</h2>
          <p className="text-gray-500 font-medium">Discover the tailored support and unique opportunities available for each member of our community.</p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8 mb-12">
          <RoleCard 
            icon="public"
            title="International Students"
            desc="Navigating a new academic and professional landscape can be challenging. We're here to help."
            bullets={["Visa guidance & support", "Cultural transition workshops", "English language mentorship"]}
            btnText="Sign Up as Student"
          />
          <RoleCard 
            icon="school"
            title="Domestic Students"
            desc="Expand your network and build leadership skills that set you apart in the local market."
            bullets={["Local career path planning", "Peer networking events", "Campus leadership roles"]}
            btnText="Sign Up as Student"
          />
          <RoleCard 
            icon="history_edu"
            title="Alumni"
            desc="Stay connected with your alma mater and give back to the next generation of talent."
            bullets={["Mentoring current students", "Lifelong learning resources", "Exclusive alumni network"]}
            btnText="Join Alumni Network"
          />
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
          <RoleCard 
            icon="settings_account_box"
            title="Professionals"
            desc="Share your industry insights and advocate for more diverse and inclusive workplaces."
            bullets={["Industry trend sharing", "Professional mentoring", "DEI leadership advocacy"]}
            btnText="Apply as Mentor"
          />
          <RoleCard 
            icon="business"
            title="Partner Companies"
            desc="Access a diverse pipeline of talent and strengthen your corporate social responsibility."
            bullets={["Direct diverse talent access", "Employer branding & CSR", "Diversity recruitment tools"]}
            btnText="Become a Partner"
          />
        </div>
      </section>

      {/* Path Choice CTA */}
      <section className="py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-20 text-center text-white space-y-4 sm:space-y-6 md:space-y-8">
          <h2 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight">Choose Your Path and Join Us Today</h2>
          <p className="text-gray-400 font-medium max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Not sure which role fits you best? Join as a general member and explore the platform to find your perfect fit in the UnityMentor Hub community.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8 pt-4">
            <button className="px-12 py-5 bg-primary text-white font-black rounded-2xl shadow-2xl hover:scale-105 transition-all">Get Started Now</button>
            <button className="text-white font-bold hover:underline">Talk to an advisor</button>
          </div>
        </div>
      </section>

      </main>
      <Footer variant="simple" />
    </div>
  );
};

const RoleCard: React.FC<{ icon: string, title: string, desc: string, bullets: string[], btnText: string }> = ({ icon, title, desc, bullets, btnText }) => (
  <div className="bg-white p-10 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-50 shadow-xl shadow-gray-200/40 flex flex-col items-start text-left space-y-6 group hover:shadow-2xl transition-all">
    <div className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div className="space-y-3 flex-1">
      <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</p>
      <ul className="space-y-3 pt-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
            <span className="material-symbols-outlined text-primary text-base sm:text-lg flex-shrink-0">check_circle</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
    <button className="w-full py-4 bg-gray-50 text-primary font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
      {btnText}
    </button>
  </div>
);

export default WhoWeServe;
