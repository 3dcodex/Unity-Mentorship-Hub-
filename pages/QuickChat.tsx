import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../src/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, orderBy, Timestamp, getDoc } from 'firebase/firestore';

interface Connection {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount?: number;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

const QuickChat: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedChat, setSelectedChat] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadConnections();
  }, [user]);

  useEffect(() => {
    if (selectedChat) loadMessages(selectedChat.userId);
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConnections = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'connections'), where('participants', 'array-contains', user.uid));
      const snapshot = await getDocs(q);
      
      const conns = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          const otherUserId = data.participants.find((id: string) => id !== user.uid);
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          const userData = userDoc.data();
          
          return {
            id: d.id,
            userId: otherUserId,
            userName: userData?.name || 'User',
            userPhoto: userData?.photoURL || '',
            lastMessage: data.lastMessage || '',
            lastMessageTime: data.lastMessageTime,
            unreadCount: 0,
          };
        })
      );
      
      setConnections(conns);
    } catch (err) {
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = (otherUserId: string) => {
    if (!user) return;
    
    const conversationId = [user.uid, otherUserId].sort().join('_');
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];
      setMessages(msgs);
    });
    
    return unsubscribe;
  };

  const sendMessage = async () => {
    if (!user || !selectedChat || !messageText.trim()) return;
    
    const conversationId = [user.uid, selectedChat.userId].sort().join('_');
    
    try {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        text: messageText,
        senderId: user.uid,
        timestamp: Timestamp.now(),
      });
      
      await updateDoc(doc(db, 'connections', selectedChat.id), {
        lastMessage: messageText,
        lastMessageTime: Timestamp.now(),
      });
      
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-8rem)] ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="h-full flex gap-4">
        {/* Connections List */}
        <div className={`w-80 rounded-2xl border ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden flex flex-col`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Messages</h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{connections.length} connections</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {connections.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">chat_bubble</span>
                <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No connections yet</p>
              </div>
            ) : (
              connections.map(conn => (
                <button
                  key={conn.id}
                  onClick={() => setSelectedChat(conn)}
                  className={`w-full p-4 flex items-center gap-3 border-b transition-colors ${
                    selectedChat?.id === conn.id
                      ? isDark ? 'bg-slate-700 border-gray-600' : 'bg-blue-50 border-blue-200'
                      : isDark ? 'border-gray-700 hover:bg-slate-700' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {conn.userPhoto ? (
                      <img src={conn.userPhoto} alt={conn.userName} className="w-full h-full object-cover" />
                    ) : (
                      conn.userName[0]
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{conn.userName}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {conn.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 rounded-2xl border ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden flex flex-col`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className={`p-4 border-b flex items-center gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {selectedChat.userPhoto ? (
                    <img src={selectedChat.userPhoto} alt={selectedChat.userName} className="w-full h-full object-cover" />
                  ) : (
                    selectedChat.userName[0]
                  )}
                </div>
                <div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedChat.userName}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Online</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                      msg.senderId === user?.uid
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user?.uid ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className={`flex-1 px-4 py-3 rounded-xl border-none ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900'} focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">chat</span>
                <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickChat;
