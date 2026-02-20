
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LocalTips: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 hover:text-primary transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Local Student Tips</h1>
          <p className="text-gray-500 font-medium">Insider knowledge for a smoother university experience.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <TipDetailCard 
          icon="shopping_basket"
          title="Budget Groceries"
          desc="The 'Fresh Hub' offers a 20% discount on Tuesdays for students. For bulk buys, head to the wholesale market on East Side."
          tag="Saving"
        />
        <TipDetailCard 
          icon="directions_bus"
          title="Night Transit"
          desc="Safety first! The University Shuttle runs every 30 mins until 2 AM. Always keep the 'SafeCampus' app active."
          tag="Safety"
        />
        <TipDetailCard 
          icon="menu_book"
          title="Hidden Study Spots"
          desc="The 4th floor of the Biotech building has soundproof pods that are almost always empty during midterms."
          tag="Academic"
        />
        <TipDetailCard 
          icon="local_hospital"
          title="Quick Clinics"
          desc="Avoid the ER for minor issues. The Student Health Center takes walk-ins from 8 AM to 10 AM daily."
          tag="Health"
        />
      </div>

      <section className="bg-primary rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black">Have a tip to share?</h2>
          <p className="opacity-80 font-medium max-w-md">Contribute to our community knowledge base and help your peers thrive.</p>
        </div>
        <button className="bg-white text-primary px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">Submit a Tip</button>
      </section>
    </div>
  );
};

const TipDetailCard: React.FC<{ icon: string, title: string, desc: string, tag: string }> = ({ icon, title, desc, tag }) => (
  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-50 shadow-sm flex flex-col gap-6">
    <div className="flex justify-between items-start">
      <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
        <span className="material-symbols-outlined text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl">{icon}</span>
      </div>
      <span className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400">{tag}</span>
    </div>
    <div className="space-y-2">
      <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default LocalTips;
