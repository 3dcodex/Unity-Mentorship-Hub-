import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, getDocs } from 'firebase/firestore';

const Community: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snapshot => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRealUsers(users.slice(0, 2)); // Show top 2 for demo
    });
  }, []);

  const filteredUsers = realUsers.filter(user =>
    user.displayName?.toLowerCase().includes(userFilter.toLowerCase()) ||
    (user.isMentor ? 'mentor' : 'student').includes(userFilter.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Unity Community</h1>
          <p className="text-gray-500 font-medium mt-1">Connect, share, and grow with peers and mentors who understand your journey.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input 
              type="text" 
              placeholder="Quick search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-4 focus:ring-primary/5 outline-none"
            />
            <input
              type="text"
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              placeholder="Filter members by name or role"
              className="w-full mb-4 px-4 py-2 rounded-xl border border-gray-200"
            />
          </div>
          <button className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <span className="material-symbols-outlined">person_add</span>
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <CommunityActionCard 
          title="Community Feed"
          desc="Stay updated with the latest from your peers and mentors."
          icon="rss_feed"
          color="bg-primary"
          path="/community/feed"
        />
        <CommunityActionCard 
          title="Member Directory"
          desc="Find and connect with over 1,200 active members."
          icon="group"
          color="bg-secondary"
          path="/community/directory"
        />
        <CommunityActionCard 
          title="Discussion Groups"
          desc="Join themed spaces for shared academic and career goals."
          icon="forum"
          color="bg-indigo-600"
          path="/community/groups"
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        <div className="xl:col-span-8 space-y-4 sm:space-y-6 md:space-y-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-50 p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">Recommended for You</h2>
              <Link to="/community/directory" className="text-sm font-black text-primary hover:underline">See All Members</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No members found.</p>
              ) : (
                filteredUsers.map(user => (
                  <SmallMemberCard
                    key={user.id}
                    name={user.displayName || 'Member'}
                    role={user.isMentor ? 'Mentor' : 'Student'}
                    img={user.photoURL || 'https://i.pravatar.cc/100'}
                    id={user.id}
                  />
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-50 p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">Trending Groups</h2>
              <Link to="/community/groups" className="text-sm font-black text-primary hover:underline">Browse All Groups</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <SmallGroupCard name="First-Gen Scholars" count={124} tag="Academics" />
               <SmallGroupCard name="Women in Tech" count={89} tag="Career" />
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4 sm:space-y-6 md:space-y-8">
          <section className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-50 shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
            <h2 className="text-base sm:text-base sm:text-lg md:text-xl font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">campaign</span>
              Highlights
            </h2>
            <div className="space-y-6">
              <HighlightItem icon="celebration" title="Scholarship Win" desc="Elena Rios just landed the 'Future Design' Grant!" time="2h ago" />
              <HighlightItem icon="event_available" title="Next Townhall" desc="Join us tomorrow for our monthly community sync." time="5h ago" onClick={() => navigate('/community/live')} />
              <HighlightItem icon="school" title="New Mentor" desc="Dr. Alice Wong joined our Professional track." time="1d ago" />
            </div>
          </section>

          <section className="bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-4 sm:p-6 md:p-8 text-white space-y-6">
             <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Community Pulse
            </h2>
            <div className="space-y-4">
              <PulseMetric label="Engagement" value="85%" />
              <PulseMetric label="New Members" value="+12" />
              <PulseMetric label="Mentor Availability" value="High" />
            </div>
            <button onClick={() => navigate('/analytics')} className="w-full py-4 bg-white/10 text-white font-black rounded-2xl text-xs hover:bg-white/20 transition-all">
              View Analytics Dashboard
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

const CommunityActionCard: React.FC<{ title: string, desc: string, icon: string, color: string, path: string }> = ({ title, desc, icon, color, path }) => (
  <Link to={path} className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col gap-6">
    <div className={`size-14 ${color} text-white rounded-[20px] flex items-center justify-center group-hover:scale-110 transition-transform`}>
      <span className="material-symbols-outlined text-xl sm:text-2xl md:text-3xl">{icon}</span>
    </div>
    <div className="space-y-2">
      <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
    <div className="mt-auto flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest">
      Go to {title.split(' ')[1]}
      <span className="material-symbols-outlined text-sm">arrow_forward</span>
    </div>
  </Link>
);

const SmallMemberCard: React.FC<{ name: string, role: string, img: string, id: string }> = ({ name, role, img, id }) => {
  const navigate = useNavigate();
  return (
    <div className="p-4 border border-gray-50 rounded-2xl flex items-center gap-4 hover:bg-gray-50 transition-all cursor-pointer" onClick={() => navigate(`/profile-view/${id}`)}>
      <img
        src={img}
        className="size-7 sm:size-9 md:size-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary"
        onClick={e => { e.stopPropagation(); navigate(`/profile-view/${id}`); }}
      />
      <div>
        <h4
          className="text-xs font-black text-gray-900 leading-none cursor-pointer hover:text-primary"
          onClick={e => { e.stopPropagation(); navigate(`/profile-view/${id}`); }}
        >{name}</h4>
        <p className="text-[9px] font-bold text-primary mt-1 uppercase tracking-widest">{role}</p>
      </div>
    </div>
  );
};

const SmallGroupCard: React.FC<{ name: string, count: number, tag: string }> = ({ name, count, tag }) => (
  <div className="p-4 border border-gray-50 rounded-2xl flex flex-col gap-2 hover:bg-gray-50 transition-all cursor-pointer">
    <div className="flex justify-between items-center">
      <h4 className="text-xs font-black text-gray-900">{name}</h4>
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{tag}</span>
    </div>
    <p className="text-[10px] font-bold text-gray-400">{count} Active</p>
  </div>
);

const StatItem: React.FC<{ icon: string, value: string, label: string, color: string }> = ({ icon, value, label, color }) => (
  <div className="bg-white p-6 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-50 shadow-sm flex flex-col items-center text-center space-y-2">
    <div className={`size-7 sm:size-9 md:size-10 ${color.replace('text-', 'bg-')}/10 ${color} rounded-xl flex items-center justify-center`}>
      <span className="material-symbols-outlined text-base sm:text-base sm:text-lg md:text-xl">{icon}</span>
    </div>
    <div className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900 leading-none">{value}</div>
    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</p>
  </div>
);

const HighlightItem: React.FC<{ icon: string, title: string, desc: string, time: string, onClick?: () => void }> = ({ icon, title, desc, time, onClick }) => (
  <div className="flex gap-4 cursor-pointer group" onClick={onClick}>
    <div className="size-7 sm:size-9 md:size-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-all">
      <span className="material-symbols-outlined text-base sm:text-lg">{icon}</span>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-0.5">
        <h5 className="text-sm font-black text-gray-900 leading-none">{title}</h5>
        <span className="text-[10px] text-gray-400 font-bold">{time}</span>
      </div>
      <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

const PulseMetric: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center pb-3 border-b border-white/5">
    <span className="text-xs font-bold text-gray-400">{label}</span>
    <span className="text-xs font-black text-white">{value}</span>
  </div>
);

export default Community;
