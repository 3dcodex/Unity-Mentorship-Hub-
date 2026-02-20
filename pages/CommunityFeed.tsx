
import React, { useState } from 'react';

const CommunityFeed: React.FC = () => {
  const [postText, setPostText] = useState('');

  const posts = [
    { id: 1, user: "Alex Chen", role: "Design Lead", text: "Just finished a mock interview with a senior mentor. Highly recommend for anyone nervous about technical rounds!", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200", time: "10m ago", likes: 12, comments: 2 },
    { id: 2, user: "Sarah Jenkins", role: "Academic Advisor", text: "New resources for the Winter term scholarships are now live in the Financial Aid section. Don't miss out on the early deadlines!", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200", time: "1h ago", likes: 45, comments: 8 },
    { id: 3, user: "Julio Rodriguez", role: "Alumni Mentor", text: "I'm opening up 3 more slots for coffee chats this Thursday. First come first serve!", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=200", time: "4h ago", likes: 89, comments: 14 }
  ];

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6 sm:space-y-8 md:space-y-10 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Community Feed</h1>
        <button className="bg-primary text-white size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 rounded-full flex items-center justify-center shadow-xl shadow-primary/20">
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      {/* Share Box */}
      <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-[32px] p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex gap-4">
          <img src="https://i.pravatar.cc/100?u=me" className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 rounded-xl object-cover" />
          <textarea 
            placeholder="Share an update or question with the community..." 
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none min-h-[100px]"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-base sm:text-lg">image</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Photo</span>
            </button>
            <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-base sm:text-lg">link</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Link</span>
            </button>
          </div>
          <button disabled={!postText.trim()} className="bg-primary text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/10 disabled:opacity-50 transition-all">
            Post
          </button>
        </div>
      </div>

      {/* Feed Posts */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={post.img} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 rounded-xl object-cover" />
                  <div>
                    <h3 className="text-sm font-black text-gray-900 leading-none">{post.user}</h3>
                    <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-widest">{post.role}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{post.time}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">{post.text}</p>
              <div className="flex items-center gap-6 pt-2 border-t border-gray-50">
                <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-base sm:text-lg">favorite</span>
                  <span className="text-xs font-black">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-base sm:text-lg">chat_bubble</span>
                  <span className="text-xs font-black">{post.comments}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors ml-auto">
                  <span className="material-symbols-outlined text-base sm:text-lg">share</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityFeed;
