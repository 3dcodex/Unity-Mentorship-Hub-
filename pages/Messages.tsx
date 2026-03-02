import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>('1');
  const [message, setMessage] = useState('');

  const chats = [
    { id: '1', name: 'Sarah Chen', lastMsg: 'Thanks for the study tips!', time: '2m', unread: 2, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: '2', name: 'Marcus Johnson', lastMsg: 'See you at the live event', time: '1h', unread: 0, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { id: '3', name: 'Elena Rodriguez', lastMsg: 'Great session today!', time: '3h', unread: 1, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
  ];

  const messages = selectedChat === '1' ? [
    { id: '1', sender: 'Sarah Chen', text: 'Hey! Did you finish the assignment?', time: '10:30 AM', isMine: false },
    { id: '2', sender: 'You', text: 'Almost done! Just reviewing it now', time: '10:32 AM', isMine: true },
    { id: '3', sender: 'Sarah Chen', text: 'Thanks for the study tips!', time: '10:35 AM', isMine: false },
  ] : [];

  return (
    <div className="max-w-7xl mx-auto py-12 animate-in fade-in duration-700">
      <header className="flex items-center gap-6 mb-8">
        <button onClick={() => navigate(-1)} className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-4xl font-black text-gray-900">Messages</h1>
      </header>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        <div className="col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <input type="text" placeholder="Search messages..." className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <div key={chat.id} onClick={() => setSelectedChat(chat.id)} className={`p-6 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat === chat.id ? 'bg-primary/5' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={chat.avatar} className="size-14 rounded-full object-cover" />
                    <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-gray-900 truncate">{chat.name}</h3>
                      <span className="text-xs text-gray-400 font-medium">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">{chat.lastMsg}</p>
                      {chat.unread > 0 && <span className="size-5 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center">{chat.unread}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={chats.find(c => c.id === selectedChat)?.avatar} className="size-12 rounded-full object-cover" />
                  <div>
                    <h2 className="font-black text-gray-900">{chats.find(c => c.id === selectedChat)?.name}</h2>
                    <p className="text-xs text-green-500 font-medium">Active now</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="size-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100">
                    <span className="material-symbols-outlined text-gray-600">videocam</span>
                  </button>
                  <button className="size-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100">
                    <span className="material-symbols-outlined text-gray-600">call</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md ${msg.isMine ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-3`}>
                      <p className="text-sm font-medium">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.isMine ? 'text-white/70' : 'text-gray-500'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <button className="size-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100">
                    <span className="material-symbols-outlined text-gray-600">add</span>
                  </button>
                  <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20" />
                  <button className="size-10 rounded-xl bg-primary flex items-center justify-center hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-white">send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-4">chat_bubble</span>
                <p className="font-medium">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
