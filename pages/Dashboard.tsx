
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('unity_user_name') || 'Alex';
  const userRole = localStorage.getItem('unity_user_role') || 'Student';

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Hello, {userName}! 👋</h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium">Ready to continue your {userRole} journey today?</p>
        </div>
        <div className="flex gap-3 sm:gap-4 w-full md:w-auto">
          <button 
            onClick={() => navigate('/mentorship/match')}
            className="bg-primary text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base flex-1 md:flex-none"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            Quick Match
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Main Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-6">
          <DashboardCard 
            title="Next Session"
            icon="event_upcoming"
            color="bg-blue-500"
            content={
              <div className="flex items-center gap-4">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100" className="size-12 rounded-xl object-cover" />
                <div>
                  <p className="text-sm font-black">Dr. Sarah Jenkins</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Oct 25 • 01:00 PM</p>
                </div>
              </div>
            }
            action={() => navigate('/mentorship/history')}
          />
          <DashboardCard 
            title="Unread Messages"
            icon="chat_bubble"
            color="bg-amber-500"
            content={
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="size-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="size-full object-cover" />
                  </div>
                ))}
                <div className="size-10 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center text-[10px] font-black text-amber-700">+2</div>
              </div>
            }
            action={() => navigate('/quick-chat')}
          />
        </div>

        {/* Community Feed Preview */}
        <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-sm p-6 sm:p-8 space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-400">Community Feed</h3>
            <Link to="/community/feed" className="text-[10px] sm:text-xs font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            <FeedSnippet name="Elena R." text="Just shared a new scholarship guide!" time="2h" />
            <FeedSnippet name="Julio M." text="Who's up for a study group tomorrow?" time="5h" />
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-6">
        <Link to="/dashboard/tips" className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <span className="material-symbols-outlined text-primary mb-3 sm:mb-4 text-2xl sm:text-3xl group-hover:scale-110 transition-transform">lightbulb</span>
          <h3 className="text-base sm:text-lg font-black text-gray-900">Local Tips</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium">Insider campus knowledge from peer mentors.</p>
        </Link>
        <Link to="/career/resume" className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <span className="material-symbols-outlined text-secondary mb-4 text-3xl group-hover:scale-110 transition-transform">description</span>
          <h3 className="text-lg font-black text-gray-900">Resume AI</h3>
          <p className="text-xs text-gray-500 mt-2 font-medium">Optimize your resume for 2024 hiring trends.</p>
        </Link>
        <Link to="/resources/financial-aid" className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <span className="material-symbols-outlined text-green-500 mb-4 text-3xl group-hover:scale-110 transition-transform">payments</span>
          <h3 className="text-lg font-black text-gray-900">Financial Aid</h3>
          <p className="text-xs text-gray-500 mt-2 font-medium">Grants and scholarships for diverse students.</p>
        </Link>
        <Link to="/resources/dei-guides" className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <span className="material-symbols-outlined text-indigo-500 mb-4 text-3xl group-hover:scale-110 transition-transform">verified_user</span>
          <h3 className="text-lg font-black text-gray-900">DEI Guides</h3>
          <p className="text-xs text-gray-500 mt-2 font-medium">Safe spaces and rights in the modern workplace.</p>
        </Link>
      </section>
    </div>
  );
};

const DashboardCard: React.FC<{ title: string, icon: string, color: string, content: React.ReactNode, action: () => void }> = ({ title, icon, color, content, action }) => (
  <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between h-40 sm:h-48 group cursor-pointer hover:shadow-lg transition-all" onClick={action}>
    <div className="flex justify-between items-start">
      <div className={`size-8 sm:size-10 ${color} text-white rounded-lg sm:rounded-xl flex items-center justify-center`}>
        <span className="material-symbols-outlined text-sm sm:text-base">{icon}</span>
      </div>
      <span className="material-symbols-outlined text-gray-200 group-hover:text-primary transition-colors">arrow_forward</span>
    </div>
    <div>
      <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-400 mb-3 sm:mb-4">{title}</h3>
      {content}
    </div>
  </div>
);

const FeedSnippet: React.FC<{ name: string, text: string, time: string }> = ({ name, text, time }) => (
  <div className="flex gap-2 sm:gap-3">
    <div className="size-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
    <div className="flex-1">
      <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">
        <span className="font-black text-gray-900">{name}</span> {text}
      </p>
      <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{time} ago</p>
    </div>
  </div>
);

export default Dashboard;
