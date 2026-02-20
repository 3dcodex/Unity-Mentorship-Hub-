
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface MentorPreview {
  name: string;
  role: string;
  img: string;
  tags: string[];
}

const FEATURED_MENTOR: MentorPreview = {
  name: "Dr. Sarah Jenkins",
  role: "Academic Research Lead",
  img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
  tags: ["First-Gen Advocate", "STEM Expert"]
};

const BookChat: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [chatType, setChatType] = useState<'video' | 'audio' | 'text'>('video');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const times = ['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM', '04:45 PM'];
  const topics = ['Career Transition', 'Academic Balance', 'Networking Tips', 'General Intro'];

  const handleBook = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3500);
    }, 1200);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 text-center space-y-4 sm:space-y-6 md:space-y-8 animate-in zoom-in duration-500">
        <div className="relative mx-auto size-32">
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
          <div className="relative size-32 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-100">
            <span className="material-symbols-outlined text-6xl font-black">celebration</span>
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Chat Booked!</h1>
          <p className="text-gray-500 font-medium text-base sm:text-lg leading-relaxed px-6">
            A calendar invite for your session with <span className="text-primary font-bold">{FEATURED_MENTOR.name}</span> has been sent to your inbox.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] animate-pulse">Redirecting to Dashboard</span>
          <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full animate-[progress_3s_linear]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-6 sm:space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:text-primary transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Book an Intro Chat</h1>
            <p className="text-gray-500 font-medium">A low-pressure 15-minute sync to jumpstart your journey.</p>
          </div>
        </div>
        <div className="px-6 py-3 bg-blue-50 text-primary rounded-2xl border border-blue-100 flex items-center gap-3">
          <span className="material-symbols-outlined font-black">timer</span>
          <span className="text-sm font-black">15 Minute Intro</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12">
        {/* Left: Mentor and Type */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6 md:space-y-8">
          <section className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Meeting With</h3>
            <div className="flex items-center gap-5 p-2">
              <img src={FEATURED_MENTOR.img} className="size-20 rounded-[24px] object-cover shadow-lg" alt={FEATURED_MENTOR.name} />
              <div>
                <h4 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900">{FEATURED_MENTOR.name}</h4>
                <p className="text-xs font-bold text-gray-400 mt-1">{FEATURED_MENTOR.role}</p>
                <div className="flex gap-2 mt-3">
                  {FEATURED_MENTOR.tags.map(t => (
                    <span key={t} className="text-[9px] font-black text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Communication Mode</h3>
            <div className="grid grid-cols-3 gap-3">
              <ModeButton 
                active={chatType === 'video'} 
                icon="videocam" 
                label="Video" 
                onClick={() => setChatType('video')} 
              />
              <ModeButton 
                active={chatType === 'audio'} 
                icon="call" 
                label="Audio" 
                onClick={() => setChatType('audio')} 
              />
              <ModeButton 
                active={chatType === 'text'} 
                icon="chat" 
                label="Text" 
                onClick={() => setChatType('text')} 
              />
            </div>
          </section>
        </div>

        {/* Right: Schedule and Details */}
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 p-10 md:p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 space-y-6 sm:space-y-8 md:space-y-12">
          <div className="space-y-6">
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Select an available time
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {times.map(time => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                    selectedTime === time 
                    ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20' 
                    : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {time}
                </button>
              ))}
              <button className="py-4 rounded-2xl border-2 border-dashed border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-primary/30 transition-all">
                More Slots...
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">topic</span>
              Main conversation starter
            </h2>
            <div className="flex flex-wrap gap-2">
              {topics.map(t => (
                <button key={t} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-bold text-gray-500 hover:border-primary hover:text-primary transition-all">
                  {t}
                </button>
              ))}
            </div>
            <textarea 
              placeholder="Tell Sarah what you're hoping to learn..."
              className="w-full bg-gray-50 border-none rounded-2xl p-6 text-sm font-medium focus:ring-4 focus:ring-primary/10 resize-none min-h-[120px] transition-all"
            />
          </div>

          <button 
            disabled={!selectedTime || isLoading}
            onClick={handleBook}
            className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                SECURELY BOOKING...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">verified</span>
                CONFIRM COFFEE CHAT
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ModeButton: React.FC<{ active: boolean, icon: string, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
      active ? 'bg-primary/5 border-primary text-primary' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'
    }`}
  >
    <span className="material-symbols-outlined">{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default BookChat;
