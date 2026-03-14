import React from 'react';
import { useNavigate } from 'react-router-dom';

const PeerMentors: React.FC = () => {
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
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Peer Mentors</h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium max-w-3xl">
          Connect with students and recent graduates who can guide you through coursework, campus life, and practical study strategies.
        </p>
      </header>

      <section className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3">What You Get</h2>
        <ul className="space-y-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <li>Academic planning support from students who recently completed similar programs.</li>
          <li>Practical campus survival advice on study habits, time management, and resources.</li>
          <li>Structured matching based on focus areas to improve relevance.</li>
        </ul>
        <div className="pt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/mentorship/match?track=peer')}
            className="px-6 py-3 rounded-xl bg-primary text-white font-black hover:scale-[1.02] transition"
          >
            Find Peer Matches
          </button>
          <button
            onClick={() => navigate('/mentorship/book')}
            className="px-6 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition"
          >
            Go to Booking
          </button>
        </div>
      </section>
    </div>
  );
};

export default PeerMentors;
