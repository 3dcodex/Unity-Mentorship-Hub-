
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LiveEvent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto py-12 animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
             <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Neurodiversity Hub</h1>
            <p className="text-gray-500 font-medium">Live Community Sync • Group Discussion</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-black animate-pulse flex items-center gap-2 shadow-lg shadow-red-200">
           <span className="size-2 bg-white rounded-full"></span>
           LIVE • 142 ATTENDING
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <div className="xl:col-span-9">
           <div className="bg-gray-900 rounded-[48px] aspect-video relative overflow-hidden shadow-2xl flex flex-col">
              <div className="flex-1 flex items-center justify-center text-center p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 space-y-4 sm:space-y-6 md:space-y-8">
                 <div className="size-32 rounded-full border-4 border-primary/30 flex items-center justify-center relative">
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=200" className="size-28 rounded-full object-cover border-4 border-white shadow-xl" />
                    <div className="absolute -bottom-2 right-0 size-8 bg-primary rounded-full flex items-center justify-center border-4 border-gray-900">
                       <span className="material-symbols-outlined text-white text-sm">mic</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-white">Julio Rodriguez is speaking...</h2>
                    <p className="text-gray-400 font-medium italic">"Understanding focus patterns in open-plan study environments..."</p>
                 </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8 bg-black/40 backdrop-blur-md flex items-center justify-center gap-6">
                 <ControlButton icon="mic_off" />
                 <ControlButton icon="videocam_off" />
                 <ControlButton icon="pan_tool" label="Raise Hand" />
                 <ControlButton icon="emoji_emotions" />
                 <button onClick={() => navigate('/community')} className="px-8 py-3 bg-red-500 text-white font-black rounded-xl text-sm shadow-xl shadow-red-900/20 hover:scale-105 transition-all">Leave Session</button>
              </div>
           </div>
        </div>

        <div className="xl:col-span-3 bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
           <div className="p-6 border-b border-gray-50">
              <h3 className="font-black text-gray-900">Live Chat</h3>
           </div>
           <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-hide">
              <ChatItem name="Elena" msg="This is so helpful for my midterm prep!" />
              <ChatItem name="Marcus" msg="Anyone want to form a study group after this?" />
              <ChatItem name="Sarah" msg="Welcome everyone! Great to see such a big turn out." />
           </div>
           <div className="p-4 bg-gray-50">
              <div className="relative">
                 <input type="text" placeholder="Send message..." className="w-full bg-white border-none rounded-xl py-3 pl-4 pr-10 text-xs font-bold focus:ring-2 focus:ring-primary/20" />
                 <button className="absolute right-2 top-1/2 -translate-y-1/2 text-primary">
                    <span className="material-symbols-outlined text-base sm:text-base sm:text-lg md:text-xl">send</span>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const ControlButton: React.FC<{ icon: string, label?: string }> = ({ icon, label }) => (
  <button className="flex flex-col items-center gap-1 group">
    <div className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all duration-300">
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    {label && <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{label}</span>}
  </button>
);

const ChatItem: React.FC<{ name: string, msg: string }> = ({ name, msg }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{name}</p>
    <p className="text-xs text-gray-600 font-medium leading-relaxed">{msg}</p>
  </div>
);

export default LiveEvent;
