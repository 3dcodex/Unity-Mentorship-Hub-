
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HowItWorks: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-500 space-y-20">
      <header className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-primary text-[10px] font-black uppercase tracking-widest">Step-by-Step Guide</div>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">Your Path to Excellence <br/> Starts Here</h1>
        <p className="text-base sm:text-lg text-gray-500 font-medium">Simple, inclusive, and effective. Here's how to make the most of UnityMentor Hub.</p>
      </header>

      {/* The Process */}
      <section className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-100 hidden md:block -translate-x-1/2"></div>
        
        <div className="space-y-24 relative z-10">
          <ProcessStep 
            number="01"
            title="Complete Your Profile"
            desc="Tell us about your background, your major, and what you're looking for. Our inclusion-first approach ensures we capture the details that matter."
            icon="person_add"
            align="right"
          />
          <ProcessStep 
            number="02"
            title="Get Matched"
            desc="Our smart algorithm suggests mentors based on shared experiences and specific goals. Browse profiles and find the perfect connection."
            icon="hub"
            align="left"
          />
          <ProcessStep 
            number="03"
            title="Connect & Chat"
            desc="Reach out via Quick Chat for rapid questions or book a dedicated session. Start building a relationship that supports your growth."
            icon="chat"
            align="right"
          />
          <ProcessStep 
            number="04"
            title="Learn and Grow"
            desc="Engage in recurring sessions, attend community workshops, and access the Career Toolkit. Track your progress as you reach your milestones."
            icon="trending_up"
            align="left"
          />
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[60px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-20 text-white space-y-6 sm:space-y-8 md:space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black">Commitment to Inclusive Support</h2>
          <p className="text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
            We vet all our mentors and provide training to ensure every session is safe, productive, and respectful of your unique journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12 text-center">
          <div className="space-y-4">
            <div className="size-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
              <span className="material-symbols-outlined text-xl sm:text-2xl md:text-3xl">verified_user</span>
            </div>
            <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-bold">Vetted Mentors</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">All mentors undergo a screening process to ensure high-quality support.</p>
          </div>
          <div className="space-y-4">
            <div className="size-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
              <span className="material-symbols-outlined text-xl sm:text-2xl md:text-3xl">lock</span>
            </div>
            <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-bold">Secure Privacy</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">Your data and conversations are protected and held in strict confidence.</p>
          </div>
          <div className="space-y-4">
            <div className="size-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
              <span className="material-symbols-outlined text-xl sm:text-2xl md:text-3xl">favorite</span>
            </div>
            <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-bold">DEI Focused</h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">We actively promote an environment where diversity is celebrated.</p>
          </div>
        </div>
      </section>

      <div className="text-center pt-10 pb-20">
        <button 
          onClick={() => navigate('/mentorship')}
          className="bg-primary text-white font-black px-12 py-5 rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
        >
          Get Started Now
        </button>
      </div>
    </div>
  );
};

const ProcessStep: React.FC<{ number: string, title: string, desc: string, icon: string, align: 'left' | 'right' }> = ({ number, title, desc, icon, align }) => (
  <div className={`flex flex-col md:flex-row items-center gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12 ${align === 'left' ? 'md:flex-row-reverse' : ''}`}>
    <div className="md:w-1/2 space-y-6 text-center md:text-left">
      <div className="text-6xl font-black text-primary/10 select-none leading-none">{number}</div>
      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight">{title}</h3>
      <p className="text-base sm:text-lg text-gray-500 font-medium leading-relaxed max-w-lg">{desc}</p>
    </div>
    <div className="md:w-1/2 flex justify-center relative">
       <div className="size-32 md:size-48 bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] shadow-2xl shadow-gray-200/50 flex items-center justify-center text-primary border border-gray-50 z-20">
          <span className="material-symbols-outlined text-[60px] md:text-[80px]">{icon}</span>
       </div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 md:size-64 bg-primary/5 rounded-full blur-3xl z-10"></div>
    </div>
  </div>
);

export default HowItWorks;
