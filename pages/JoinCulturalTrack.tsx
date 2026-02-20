
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinCulturalTrack: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert("Successfully joined the Cultural Mentorship Track!");
      navigate('/mentorship');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:text-primary transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Join Cultural Track</h1>
          <p className="text-gray-500 font-medium">Fostering international exchange and global intelligence.</p>
        </div>
      </header>

      <section className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] p-10 border border-gray-100 shadow-xl grid md:grid-cols-2 gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12">
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black">Global Perspectives</h2>
          <div className="space-y-6">
            <FeatureItem icon="public" title="Language Exchange" desc="Practice your target language with a native speaker peer." />
            <FeatureItem icon="emoji_events" title="Cultural Events" desc="Priority access to international food festivals and exchange nights." />
            <FeatureItem icon="travel_explore" title="Global Mindset" desc="Workshops on cross-cultural communication and leadership." />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black">Exchange Preferences</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Primary Language</label>
              <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder="e.g. Spanish, Mandarin, Hindi" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Interests</label>
              <textarea rows={4} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder="Tell us what you want to learn about another culture..." />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-5 bg-secondary text-white font-black rounded-2xl shadow-xl shadow-secondary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Start Global Journey'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="flex gap-4">
    <div className="size-7 sm:size-9 md:size-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center flex-shrink-0">
      <span className="material-symbols-outlined text-base sm:text-base sm:text-lg md:text-xl">{icon}</span>
    </div>
    <div>
      <h4 className="text-sm font-black text-gray-900 leading-tight">{title}</h4>
      <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">{desc}</p>
    </div>
  </div>
);

export default JoinCulturalTrack;
