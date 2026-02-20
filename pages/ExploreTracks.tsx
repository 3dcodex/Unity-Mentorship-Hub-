
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExploreTracks: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in duration-500 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Mentorship Tracks</h1>
          <p className="text-gray-500 font-medium mt-1 text-base sm:text-lg">Tailored guidance for every step of your student journey.</p>
        </div>
        <button 
          onClick={() => navigate('/mentorship')}
          className="flex items-center gap-2 text-sm font-black text-primary hover:translate-x-[-4px] transition-transform"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">arrow_back</span>
          Back to Mentorship
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12">
        <TrackDetailCard 
          id="peer"
          title="Peer Mentoring"
          tag="Community & Support"
          img="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800"
          desc="Connect with upperclassmen who have already navigated the challenges you're facing. This track focuses on campus life, academic balance, and building a local network."
          points={[
            "Campus navigation & student resources",
            "Study tips & course selection advice",
            "Balancing social life & academics",
            "Joining clubs and societies"
          ]}
          color="bg-primary"
        />

        <TrackDetailCard 
          id="professional"
          title="Professional Mentoring"
          tag="Career & Growth"
          img="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800"
          desc="Bridge the gap between graduation and the workforce. Industry experts and alumni provide strategic advice to help you launch a successful career."
          points={[
            "Resume & Portfolio reviews",
            "Mock interviews & technical prep",
            "Industry networking strategies",
            "Career roadmap planning"
          ]}
          color="bg-secondary"
        />

        <TrackDetailCard 
          id="cultural"
          title="Cultural Mentoring"
          tag="Global & Inclusion"
          img="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800"
          desc="Fostering understanding across borders. Whether you're an international student or domestic student wanting to go global, this track builds cultural intelligence."
          points={[
            "Language exchange & practice",
            "Navigating local customs & traditions",
            "Global career opportunities",
            "DEI advocacy & inclusion workshops"
          ]}
          color="bg-indigo-600"
        />
      </div>

      <section className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 text-center border border-gray-100 shadow-xl shadow-gray-200/40 space-y-4 sm:space-y-6 md:space-y-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">Not sure which track is right for you?</h2>
        <p className="text-gray-500 font-medium max-w-2xl mx-auto">
          Take our 2-minute "Mentorship Match" quiz and let our algorithm suggest the best path based on your current needs and goals.
        </p>
        <button className="px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          Take the Match Quiz
        </button>
      </section>
    </div>
  );
};

const TrackDetailCard: React.FC<{ title: string, tag: string, img: string, desc: string, points: string[], color: string, id: string }> = ({ title, tag, img, desc, points, color, id }) => (
  <div className="bg-white rounded-[48px] overflow-hidden border border-gray-100 shadow-2xl shadow-gray-200/50 flex flex-col lg:flex-row min-h-[450px]">
    <div className="lg:w-1/2 relative overflow-hidden">
      <img src={img} className="w-full h-full object-cover" alt={title} />
      <div className={`absolute top-4 sm:p-6 md:p-8 left-8 ${color} text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg`}>
        {tag}
      </div>
    </div>
    <div className="lg:w-1/2 p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-16 flex flex-col justify-center space-y-4 sm:space-y-6 md:space-y-8">
      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
      <div className="space-y-4">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">What's included:</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {points.map((p, i) => (
            <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
              <span className={`material-symbols-outlined text-base sm:text-base sm:text-lg md:text-xl ${color.replace('bg-', 'text-')}`}>check_circle</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="pt-6">
        <button className={`${color} text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-gray-200 hover:scale-[1.02] transition-all`}>
          Join {title}
        </button>
      </div>
    </div>
  </div>
);

export default ExploreTracks;
