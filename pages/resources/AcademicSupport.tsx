
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AcademicSupport: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:text-primary transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Academic Support</h1>
          <p className="text-gray-500 font-medium">Tools and tips for conquering your coursework.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <AcademicTool 
          icon="groups"
          title="Study Pods"
          desc="Join virtual study groups curated by your major and course difficulty."
          btnText="Browse Groups"
          onClick={() => navigate('/community/groups')}
        />
        <AcademicTool 
          icon="history_edu"
          title="Note Sharing"
          desc="Access vetted lecture notes shared by high-achieving peer mentors."
          btnText="View Notes"
          onClick={() => {}}
        />
        <AcademicTool 
          icon="psychology"
          title="Exam Prep"
          desc="AI-generated practice quizzes based on your course syllabus."
          btnText="Start Quiz"
          onClick={() => {}}
        />
      </div>

      <section className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-xl p-10 space-y-4 sm:space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">Weekly Study Schedule</h2>
          <button className="text-primary font-black text-sm hover:underline">Customize My Plan</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
            <div key={day} className="bg-gray-50 p-6 rounded-3xl space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</p>
              <div className="space-y-2">
                <div className="bg-blue-100/50 p-2 rounded-lg text-[10px] font-bold text-primary">Math 204 @ 10AM</div>
                <div className="bg-green-100/50 p-2 rounded-lg text-[10px] font-bold text-green-700">Bio Lab @ 2PM</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary text-white rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black">Struggling with a specific course?</h2>
          <p className="text-white/70 font-medium max-w-lg">Our peer tutors are available 24/7 for quick homework help and conceptual clarity.</p>
        </div>
        <button onClick={() => navigate('/mentorship/book')} className="bg-white text-secondary px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">Book a Tutor</button>
      </section>
    </div>
  );
};

const AcademicTool: React.FC<{ icon: string, title: string, desc: string, btnText: string, onClick: () => void }> = ({ icon, title, desc, btnText, onClick }) => (
  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-50 shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all">
    <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
      <span className="material-symbols-outlined text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl">{icon}</span>
    </div>
    <div className="flex-1 space-y-2">
      <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
    <button onClick={onClick} className="w-full py-3 bg-gray-50 text-gray-700 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
      {btnText}
    </button>
  </div>
);

export default AcademicSupport;
