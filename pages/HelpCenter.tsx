
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HelpCenter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 animate-in fade-in duration-700 space-y-8 sm:space-y-10 md:space-y-16">
      <header className="text-center space-y-3 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight">Help Center</h1>
        <p className="text-sm sm:text-base text-gray-500 font-medium">Find answers and get support for your mentorship journey.</p>
        <div className="relative max-w-xl mx-auto mt-6 sm:mt-8">
           <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
           <input type="text" placeholder="Search for help articles..." className="w-full bg-white border border-gray-100 rounded-full py-3 sm:py-5 pl-10 sm:pl-12 pr-4 sm:pr-6 text-sm sm:text-base shadow-xl focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        <FAQCard title="Getting Started" items={["How do I find a mentor?", "Completing your profile", "Connecting via Quick Chat"]} />
        <FAQCard title="Booking & Sessions" items={["Scheduling a meeting", "Recurring sessions policy", "Cancellations & Rescheduling"]} />
        <FAQCard title="Career Toolkit" items={["Using the AI Resume Builder", "Mock Interview feedback", "Accessing job boards"]} />
        <FAQCard title="Trust & Safety" items={["Reporting an issue", "Community guidelines", "Privacy of your data"]} />
      </div>

      <section className="bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 md:gap-8">
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-2xl font-black">Still have questions?</h2>
          <p className="text-sm sm:text-base text-gray-400 font-medium max-w-md">Our support team is dedicated to ensuring you have a smooth experience. We respond within 24 hours.</p>
        </div>
        <button 
          onClick={() => navigate('/help/contact')}
          className="bg-primary text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all text-sm sm:text-base whitespace-nowrap"
        >
          Contact Support
        </button>
      </section>
    </div>
  );
};

const FAQCard: React.FC<{ title: string, items: string[] }> = ({ title, items }) => (
  <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[32px] p-6 sm:p-8 border border-gray-50 shadow-sm space-y-4 sm:space-y-6">
    <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
       <span className="material-symbols-outlined text-sm sm:text-base text-primary">folder</span>
       {title}
    </h3>
    <ul className="space-y-3 sm:space-y-4">
      {items.map(item => (
        <li key={item} className="flex items-center justify-between group cursor-pointer">
          <span className="text-xs sm:text-sm font-bold text-gray-500 group-hover:text-primary transition-colors">{item}</span>
          <span className="material-symbols-outlined text-xs sm:text-sm text-gray-300 group-hover:text-primary transition-colors">chevron_right</span>
        </li>
      ))}
    </ul>
  </div>
);

export default HelpCenter;
