
import React from 'react';
import { useNavigate } from 'react-router-dom';

const FinancialAid: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:text-primary transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Financial Aid & Grants</h1>
          <p className="text-gray-500 font-medium">Supporting your academic journey through accessible funding.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <GrantCard 
          title="Inclusion Scholars Grant"
          amount="$5,000"
          deadline="Nov 15, 2024"
          desc="For students from underrepresented backgrounds pursuing STEM degrees."
        />
        <GrantCard 
          title="Community Leader Fellowship"
          amount="$2,500"
          deadline="Dec 01, 2024"
          desc="Recognizing students who have made a significant impact on local community initiatives."
        />
        <GrantCard 
          title="Tech Pivot Bursary"
          amount="$1,000"
          deadline="Monthly"
          desc="Supporting students who are transitioning careers into the technology sector."
        />
        <GrantCard 
          title="Global Mobility Award"
          amount="$3,000"
          deadline="Jan 10, 2025"
          desc="Helping international students with housing and travel costs."
        />
      </div>

      <div className="bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 text-white space-y-4 sm:space-y-6 md:space-y-8">
        <div className="flex items-center gap-4">
           <div className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined">calculate</span>
           </div>
           <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black">Tuition Estimator Tool</h2>
        </div>
        <p className="text-gray-400 font-medium max-w-2xl leading-relaxed">
          Need a quick look at your semester costs? Use our AI-powered calculator to estimate fees, books, and living expenses based on your campus location.
        </p>
        <button className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">Launch Estimator</button>
      </div>
    </div>
  );
};

const GrantCard: React.FC<{ title: string, amount: string, deadline: string, desc: string }> = ({ title, amount, deadline, desc }) => (
  <div className="bg-white p-10 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-50 shadow-sm flex flex-col justify-between space-y-6 group hover:shadow-xl transition-all">
    <div className="flex justify-between items-start">
      <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900 group-hover:text-primary transition-colors leading-tight">{title}</h3>
      <span className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black">{amount}</span>
    </div>
    <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-gray-300 text-sm">calendar_today</span>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deadline: {deadline}</span>
      </div>
      <button className="text-primary text-xs font-black uppercase tracking-widest">Apply Now</button>
    </div>
  </div>
);

export default FinancialAid;
