
import React from 'react';

const SessionHistory: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header>
        <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Session History</h1>
        <p className="text-gray-500 font-medium">Review your past connections and upcoming appointments.</p>
      </header>

      <div className="space-y-6 sm:space-y-8 md:space-y-10">
        <section className="space-y-6">
           <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
             <span className="material-symbols-outlined text-primary">event_upcoming</span>
             Upcoming Sessions
           </h2>
           <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 border-2 border-primary/10 shadow-lg shadow-primary/5 flex flex-col md:flex-row items-center gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-6 flex-1">
                 <div className="size-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" className="size-full object-cover" />
                 </div>
                 <div>
                    <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black">Dr. Sarah Jenkins</h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Research Strategy Session</p>
                 </div>
              </div>
              <div className="flex items-center gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12">
                 <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                    <p className="text-sm font-black">Oct 25, 2024</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</p>
                    <p className="text-sm font-black">01:00 PM</p>
                 </div>
              </div>
              <button className="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">Join Room</button>
           </div>
        </section>

        <section className="space-y-6">
           <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
             <span className="material-symbols-outlined text-gray-400">history</span>
             Past Sessions
           </h2>
           <div className="grid grid-cols-1 gap-4">
              <PastSessionCard 
                name="Jordan Smith" 
                date="Oct 12, 2024" 
                topic="CV Review & Impact" 
                img="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200" 
              />
              <PastSessionCard 
                name="Marcus Johnson" 
                date="Sep 28, 2024" 
                topic="Career Transition Intro" 
                img="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" 
              />
           </div>
        </section>
      </div>
    </div>
  );
};

const PastSessionCard: React.FC<{ name: string, date: string, topic: string, img: string }> = ({ name, date, topic, img }) => (
  <div className="bg-white p-6 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-50 shadow-sm flex items-center gap-6 group hover:bg-gray-50 transition-all">
     <img src={img} className="size-14 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" />
     <div className="flex-1">
        <h4 className="text-sm font-black">{name}</h4>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{topic}</p>
     </div>
     <div className="text-right">
        <p className="text-xs font-bold text-gray-400">{date}</p>
        <button className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 hover:underline">View Recording</button>
     </div>
  </div>
);

export default SessionHistory;
