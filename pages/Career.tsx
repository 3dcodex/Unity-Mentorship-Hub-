
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Career: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-500 space-y-6 sm:space-y-8 md:space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight">Internship & Career Support Portal</h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">Advancing student success through inclusive career pathways and mentorship.</p>
        </div>
        <button onClick={() => navigate('/career/post')} className="bg-secondary text-white font-black px-6 py-2.5 sm:py-3 rounded-xl shadow-lg hover:scale-105 transition-all text-sm sm:text-base whitespace-nowrap">
          Post Opportunity
        </button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg md:text-xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm sm:text-base">auto_awesome</span>
            Curated Opportunities
          </h2>
          <button className="text-primary text-xs sm:text-sm font-bold hover:underline">View All Openings</button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <FilterDropdown label="First-Gen Friendly" />
          <FilterDropdown label="Inclusive Culture" />
          <FilterDropdown label="Remote" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
          <OpportunityCard 
            title="Product Design Intern"
            company="Stellar Tech"
            location="San Francisco, CA"
            tags={['FIRST-GEN FRIENDLY', 'INCLUSIVE CULTURE']}
            img="https://images.unsplash.com/photo-1542744094-3a31f272c491?auto=format&fit=crop&q=80&w=100"
          />
          <OpportunityCard 
            title="Equity Research Analyst"
            company="Capital Trust"
            location="New York City, NY"
            tags={['DEI FOCUS', 'MENTORSHIP PROGRAM']}
            img="https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=100"
          />
        </div>
      </section>

      <section>
        <h2 className="text-base sm:text-base sm:text-lg md:text-xl font-black mb-10 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">hand_repair</span>
          Career Toolkit
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
          <ToolkitItem 
            icon="description" 
            title="Resume Builder" 
            desc="AI-powered optimization with templates designed for top-tier firms." 
            onClick={() => navigate('/career/resume')}
          />
          <ToolkitItem 
            icon="history_edu" 
            title="Cover Letter Templates" 
            desc="Professionally crafted narratives highlighting your unique background." 
            onClick={() => navigate('/career/cover-letter')}
          />
          <ToolkitItem 
            icon="video_chat" 
            title="Mock Interview" 
            desc="Practice behavioral and technical rounds with industry experts." 
            onClick={() => navigate('/career/mock-interview')}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-base sm:text-base sm:text-lg md:text-xl font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">hub</span>
            Expert Network
          </h2>
          <button onClick={() => navigate('/community')} className="text-primary text-sm font-bold hover:underline">Explore All Mentors</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
          <ExpertCard 
            name="Sarah Chen" 
            role="Software Engineer @ Top Tech" 
            tag="FIRST-GEN ALUMNI" 
            desc="Happy to help with resume reviews and systems design prep!"
            img="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
          />
          <ExpertCard 
            name="Marcus Johnson" 
            role="Investment Banking Analyst" 
            tag="ALUMNI CLASS OF '21" 
            desc="Expert in technical finance interviews and case studies."
            img="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
          />
          <ExpertCard 
            name="Elena Rodriguez" 
            role="Brand Manager @ Retail Leader" 
            tag="MARKETING MENTOR" 
            desc="Passionate about storytelling and building personal brands."
            img="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
          />
        </div>
      </section>
    </div>
  );
};

const OpportunityCard: React.FC<{ title: string, company: string, location: string, tags: string[], img: string }> = ({ title, company, location, tags, img }) => (
  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-100 shadow-sm space-y-6 group">
    <div className="flex justify-between items-start">
      <div className="size-16 rounded-2xl bg-gray-50 p-3 flex items-center justify-center border border-gray-100">
        <img src={img} className="max-h-full max-w-full object-contain mix-blend-multiply" />
      </div>
      <button className="text-gray-300 hover:text-primary transition-colors">
        <span className="material-symbols-outlined">bookmark</span>
      </button>
    </div>
    <div className="space-y-2">
      <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm font-bold text-gray-400">{company} • {location}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {tags.map(t => (
        <span key={t} className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-black uppercase tracking-widest rounded-md">{t}</span>
      ))}
    </div>
    <button className="w-full py-4 bg-secondary text-white font-black rounded-2xl shadow-xl shadow-secondary/10 hover:scale-[1.01] transition-all">
      Apply Now
    </button>
  </div>
);

const ToolkitItem: React.FC<{ icon: string, title: string, desc: string, onClick: () => void }> = ({ icon, title, desc, onClick }) => (
  <div onClick={onClick} className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-start space-y-6 h-full group cursor-pointer hover:shadow-xl transition-all">
    <div className="size-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
      <span className="material-symbols-outlined text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl">{icon}</span>
    </div>
    <div className="flex-1 space-y-3">
      <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">{title}</h3>
      <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
    <button className="flex items-center gap-2 text-xs font-black text-primary hover:translate-x-1 transition-transform uppercase tracking-widest">
      Go to tool
      <span className="material-symbols-outlined text-sm">arrow_forward</span>
    </button>
  </div>
);

const ExpertCard: React.FC<{ name: string, role: string, tag: string, desc: string, img: string }> = ({ name, role, tag, desc, img }) => (
  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-sm space-y-6 text-center group">
    <div className="relative mx-auto size-24">
      <img src={img} className="size-full rounded-full object-cover border-4 border-white shadow-lg" />
    </div>
    <div className="space-y-2">
      <h3 className="text-base sm:text-lg font-black text-gray-900">{name}</h3>
      <p className="text-[10px] font-bold text-gray-400 leading-tight">{role}</p>
      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{tag}</p>
    </div>
    <p className="text-xs text-gray-500 font-medium italic leading-relaxed min-h-[3rem]">
      "{desc}"
    </p>
    <button className="w-full py-3 border-2 border-secondary text-secondary font-black rounded-xl text-xs hover:bg-secondary hover:text-white transition-all">
      Book Coffee Chat
    </button>
  </div>
);

const FilterDropdown: React.FC<{ label: string }> = ({ label }) => (
  <button className="px-5 py-2.5 bg-blue-50/50 text-primary text-xs font-black rounded-xl border border-blue-50 flex items-center gap-2 hover:bg-blue-100 transition-all">
    {label}
    <span className="material-symbols-outlined text-sm">expand_more</span>
  </button>
);

export default Career;
