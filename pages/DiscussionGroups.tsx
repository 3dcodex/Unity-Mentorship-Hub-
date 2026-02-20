
import React from 'react';
import { useNavigate } from 'react-router-dom';

const DiscussionGroups: React.FC = () => {
  const navigate = useNavigate();

  const groups = [
    { name: "First-Gen Scholars", members: 124, tag: "Academics", img: "https://images.unsplash.com/photo-1523240693567-579c48b01bb0?auto=format&fit=crop&q=80&w=400" },
    { name: "Women in Tech", members: 89, tag: "Career", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
    { name: "International Exchange", members: 210, tag: "Cultural", img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400" },
    { name: "DEI Advocates", members: 56, tag: "Inclusion", img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=400" },
    { name: "Entrepreneurship Hub", members: 78, tag: "Growth", img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=400" },
    { name: "Mental Health Alliance", members: 145, tag: "Wellness", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400" }
  ];

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Discussion Groups</h1>
          <p className="text-gray-500 font-medium mt-1">Themed spaces for shared interests and mutual support.</p>
        </div>
        <button className="bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Create Group
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        {groups.map((g, i) => (
          <div key={i} className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-50 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
            <div className="h-40 overflow-hidden relative">
              <img src={g.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={g.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-6 left-6">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                  {g.tag}
                </span>
              </div>
            </div>
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900 leading-tight">{g.name}</h3>
                <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">{g.members} Active Members</p>
              </div>
              <div className="flex -space-x-3">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="size-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${idx + 20 + i}`} className="size-full object-cover" />
                  </div>
                ))}
                <div className="size-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">+{g.members - 4}</div>
              </div>
              <button className="w-full py-4 bg-gray-50 text-gray-700 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                Join Group
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscussionGroups;
