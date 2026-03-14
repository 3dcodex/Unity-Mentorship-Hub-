import React from 'react';
import { useNavigate } from 'react-router-dom';

const AlumniNetwork: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8 animate-in fade-in duration-500">
      <header className="space-y-3">
        <button
          onClick={() => navigate('/mentorship')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Mentorship
        </button>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Alumni Network</h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium max-w-3xl">
          Build career momentum with alumni and industry mentors for job strategy, networking, and interview preparation.
        </p>
      </header>

      <section className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3">Program Highlights</h2>
        <ul className="space-y-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <li>Career roadmap sessions with professionals in your target field.</li>
          <li>Resume, LinkedIn, and interview guidance for real hiring processes.</li>
          <li>Warm introductions to relevant alumni communities where possible.</li>
        </ul>
        <div className="pt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/mentorship/join-professional')}
            className="px-6 py-3 rounded-xl bg-primary text-white font-black hover:scale-[1.02] transition"
          >
            Join Professional Track
          </button>
          <button
            onClick={() => navigate('/mentorship/match?track=professional')}
            className="px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            Find Professional Mentors
          </button>
        </div>
      </section>
    </div>
  );
};

export default AlumniNetwork;
