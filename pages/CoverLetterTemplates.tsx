
import React from 'react';
import { useNavigate } from 'react-router-dom';

const CoverLetterTemplates: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Cover Letter Templates</h1>
          <p className="text-gray-500 font-medium mt-1">Storytelling frameworks that highlight your unique background.</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-sm font-black text-primary hover:underline">Back to Career Hub</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <TemplateCard 
          title="The Inclusive Narrative"
          desc="Best for students highlighting non-traditional experience or community leadership."
          tags={["STORYTELLING", "FIRST-GEN"]}
        />
        <TemplateCard 
          title="The Tech Impact"
          desc="Focuses on quantifiable technical results and collaborative projects."
          tags={["STEM", "CONCISE"]}
        />
        <TemplateCard 
          title="Career Transition"
          desc="Perfect for alumni pivotting into a new industry or specialization."
          tags={["ALUMNI", "SKILLS-BASED"]}
        />
      </div>

      <div className="bg-blue-50/50 p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-blue-100 flex flex-col md:flex-row items-center gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12">
        <div className="flex-1 space-y-4">
           <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">Need an AI review?</h2>
           <p className="text-gray-500 font-medium">Upload your draft and our AI Career Counselor will provide feedback on your narrative flow and inclusive language.</p>
        </div>
        <button className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all">Scan My Draft</button>
      </div>
    </div>
  );
};

const TemplateCard: React.FC<{ title: string, desc: string, tags: string[] }> = ({ title, desc, tags }) => (
  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all">
    <div className="size-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
      <span className="material-symbols-outlined">history_edu</span>
    </div>
    <div className="flex-1 space-y-3">
      <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900 leading-tight">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
      <div className="flex flex-wrap gap-2 pt-2">
        {tags.map(t => <span key={t} className="px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">{t}</span>)}
      </div>
    </div>
    <button className="w-full py-4 bg-gray-50 text-gray-700 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Use Template</button>
  </div>
);

export default CoverLetterTemplates;
