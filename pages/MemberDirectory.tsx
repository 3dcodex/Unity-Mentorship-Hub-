import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, getDocs } from 'firebase/firestore';

const MemberDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [realMembers, setRealMembers] = useState<any[]>([]);

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snapshot => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRealMembers(users);
    });
  }, []);

  const filteredMembers = realMembers.filter(m =>
    m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.major?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Member Directory</h1>
          <p className="text-gray-500 font-medium mt-1">Discover and connect with the entire UnitySupport community.</p>
        </div>
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            type="text" 
            placeholder="Search by name or major..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-4 focus:ring-primary/5 outline-none"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((m) => (
          <div key={m.id} className="bg-white p-6 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-50 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="relative">
              <img
                src={m.photoURL || 'https://i.pravatar.cc/100'}
                className="size-20 rounded-2xl object-cover border-4 border-white shadow-lg cursor-pointer hover:ring-2 hover:ring-primary"
                alt={m.displayName || 'Member'}
                onClick={() => navigate(`/profile-view/${m.id}`)}
              />
              <div className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white ${
                m.online ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
            </div>
            <div className="flex-1 space-y-1">
              <h3
                className="text-base sm:text-lg font-black text-gray-900 leading-tight cursor-pointer hover:text-primary"
                onClick={() => navigate(`/profile-view/${m.id}`)}
              >{m.displayName || 'Member'}</h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">{m.isMentor ? 'Mentor' : 'Student'}</p>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{m.major || ''}</p>
              <div className="flex gap-2 pt-3">
                <button 
                  onClick={() => navigate(`/quick-chat?user=${m.id}`)}
                  className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-primary/10 hover:scale-105 transition-all"
                >
                  Message
                </button>
                <button className="bg-gray-50 text-gray-500 text-[10px] font-black px-4 py-2 rounded-xl hover:bg-gray-100 transition-all"
                  onClick={() => navigate(`/profile-view/${m.id}`)}
                >Profile</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberDirectory;
