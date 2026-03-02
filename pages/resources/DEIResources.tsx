
import React from 'react';
import { useNavigate } from 'react-router-dom';

const DEIResources: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:text-primary transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">DEI Hub & Guides</h1>
          <p className="text-gray-500 font-medium">Advancing equity, diversity, and inclusion on campus and beyond.</p>
        </div>
      </header>

      <section className="bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[40px] overflow-hidden flex flex-col lg:flex-row text-white">
        <div className="lg:w-1/2 p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-16 space-y-4 sm:space-y-6 md:space-y-8 flex flex-col justify-center">
          <div className="inline-flex px-3 py-1 rounded-full bg-primary/20 text-primary-light text-[10px] font-black uppercase tracking-widest w-fit">Featured Resource</div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight">Your Rights in the Modern Workplace</h2>
          <p className="text-gray-400 font-medium leading-relaxed">
            A comprehensive guide on labor laws, anti-discrimination policies, and how to advocate for yourself during your first internship.
          </p>
          <button className="bg-primary text-white px-10 py-4 rounded-2xl font-black w-fit hover:scale-105 transition-all">Download Guide (PDF)</button>
        </div>
        <div className="lg:w-1/2 h-40 sm:h-52 md:h-64 lg:h-auto">
          <img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover grayscale opacity-50" />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <DEICard 
          title="Inclusion in Tech"
          category="Career"
          desc="Navigating technical interviews and office culture as a first-gen or minority student."
          icon="terminal"
        />
        <DEICard 
          title="Safe Campus Spaces"
          category="Community"
          desc="A directory of inclusive student associations and mental health safe zones."
          icon="verified_user"
        />
        <DEICard 
          title="DEI Advocacy 101"
          category="Education"
          desc="Learn how to start and lead an inclusion committee in your student club."
          icon="campaign"
        />
      </div>

      <section className="bg-blue-50/50 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 border border-blue-100 flex flex-col md:flex-row items-center gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12">
        <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
          <span className="material-symbols-outlined text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl">diversity_3</span>
        </div>
        <div className="flex-1 space-y-4">
          <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">DEI Advisory Board</h2>
          <p className="text-gray-600 font-medium">Join our board to help shape the platform's inclusion strategy and provide feedback on our resources.</p>
        </div>
        <button className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">Apply to Join</button>
      </section>
    </div>
  );
};

const DEICard: React.FC<{ title: string, category: string, desc: string, icon: string }> = ({ title, category, desc, icon }) => (
  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-50 shadow-sm space-y-6 hover:shadow-xl transition-all group">
    <div className="flex justify-between items-start">
      <div className="size-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
        <span className="material-symbols-outlined text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl">{icon}</span>
      </div>
      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{category}</span>
    </div>
    <div className="space-y-2">
      <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
    <button className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
      Read Guide
      <span className="material-symbols-outlined text-sm">chevron_right</span>
    </button>
  </div>
);

export default DEIResources;
