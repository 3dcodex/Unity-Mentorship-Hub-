import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../src/firebase';
import { useAuth } from '../App';
import { doc, setDoc, collection, query, orderBy, onSnapshot, getDocs, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { subscribeToUserStatus, setUserOnline, setUserOffline } from '../services/presenceService';

interface Contact {
  id: string;
  name: string;
  role: string;
  img: string;
  online: boolean;
  lastMsg?: string;
  lastMsgTime?: any;
}

interface Message {
  id: string;
  senderId: string;
  displayName: string;
  text: string;
  createdAt: any;
  file?: {
    name: string;
    type: string;
    url: string;
  };
}

const DEFAULT_CONTACTS: Contact[] = [
  { id: 'jordan', name: "Jordan Smith", role: "Senior Peer Lead", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200", online: true, lastMsg: "Send over a PDF if you have it ready!" },
  { id: 'sarah', name: "Dr. Sarah Jenkins", role: "Academic Advisor", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200", online: false, lastMsg: "How is the research coming along?" },
  { id: 'marcus', name: "Marcus Johnson", role: "Career Coach", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", online: true, lastMsg: "Thanks for the coffee chat!" },
  { id: 'elena', name: "Elena Rios", role: "Design Student", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200", online: true, lastMsg: "Did you see the latest grant?" }
];

const QuickChat: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('user');

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string>(targetUserId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userStatuses, setUserStatuses] = useState<{[key: string]: boolean}>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set current user online
  useEffect(() => {
    if (!user) return;
    setUserOnline(user.uid);
    return () => setUserOffline(user.uid);
  }, [user]);

  // Load messages from Firestore
  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, 'users')).then(snapshot => {
      const realContacts = snapshot.docs
        .filter(doc => doc.id !== user.uid)
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.displayName || data.email || 'User',
            role: data.role || 'Member',
            img: data.photoURL || 'https://i.pravatar.cc/100',
            online: false,
            lastMsg: '',
            lastMsgTime: null,
          };
        });
      setContacts(realContacts);
      
      realContacts.forEach(contact => {
        subscribeToUserStatus(contact.id, (isOnline) => {
          setUserStatuses(prev => ({ ...prev, [contact.id]: isOnline }));
        });
      });
      
      if (targetUserId && realContacts.some(c => c.id === targetUserId)) {
        setActiveContactId(targetUserId);
      } else if (realContacts.length > 0 && !activeContactId) {
        setActiveContactId(realContacts[0].id);
      }
    });
  }, [user, targetUserId]);

  useEffect(() => {
    if (!user || !activeContactId) return;
    const conversationId = [user.uid, activeContactId].sort().join('_');
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(loadedMessages);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    });
    return () => unsubscribe();
  }, [user, activeContactId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeContact = contacts.find(c => c.id === activeContactId);
  const isActiveContactOnline = activeContact ? userStatuses[activeContact.id] || false : false;

  const handleSendMessage = async (text?: string, file?: Message['file']) => {
    if (!text?.trim() && !file) return;
    if (!user) {
      alert('Please log in');
      return;
    }

    setIsSending(true);
    try {
      const conversationId = [user.uid, activeContactId].sort().join('_');
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');

      const newMessage = {
        senderId: user.uid,
        displayName: localStorage.getItem('unity_user_name') || user.email,
        text: text || (file ? `Shared a file: ${file.name}` : ''),
        createdAt: serverTimestamp(),
        file: file || null,
      };

      await addDoc(messagesRef, newMessage);

      // Update conversation metadata
      const conversationDoc = doc(db, 'conversations', conversationId);
      await setDoc(conversationDoc, {
        participants: [user.uid, activeContactId],
        lastMessage: newMessage.text,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Create notification for recipient
      try {
        const recipientDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', activeContactId)));
        const senderName = localStorage.getItem('unity_user_name') || user.email || 'Someone';
        const senderDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
        const senderPhoto = senderDoc.docs[0]?.data()?.photoURL || '';
        
        await addDoc(collection(db, 'notifications'), {
          userId: activeContactId,
          type: 'message',
          title: 'New Message',
          message: `${senderName} sent you a message`,
          read: false,
          createdAt: serverTimestamp(),
          actionUrl: `/quick-chat?user=${user.uid}`,
          fromUser: user.uid,
          fromUserName: senderName,
          fromUserPhoto: senderPhoto,
        });
      } catch (err) {
        console.error('Error creating notification:', err);
      }

      setInputText('');

      // Update contact's last message
      setContacts(prev => prev.map(c => 
        c.id === activeContactId 
          ? { ...c, lastMsg: newMessage.text, lastMsgTime: new Date() } 
          : c
      ));
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      const mockFile = {
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      };
      handleSendMessage(undefined, mockFile);
      setIsUploading(false);
    }, 1500);
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (msgDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (msgDate.getTime() === new Date(today.getTime() - 86400000).getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500 px-4 sm:px-6">
      {contacts.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-400">
          <span className="material-symbols-outlined text-6xl mb-4">person_off</span>
          <p className="text-lg font-bold">No users available to chat.</p>
        </div>
      ) : !activeContact ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-400">
          <span className="material-symbols-outlined text-6xl mb-4">chat_bubble_outline</span>
          <p className="text-lg font-bold">Select a user to start chatting.</p>
        </div>
      ) : (
        <>
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-gray-900">Messages</h2>
          <span className="material-symbols-outlined text-gray-400 cursor-pointer hover:text-primary transition-all">edit_square</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 scrollbar-hide">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setActiveContactId(contact.id)}
              className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 transition-all group ${
                activeContactId === contact.id ? 'bg-primary/5 border border-primary/10' : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="relative flex-shrink-0">
                <img src={contact.img} className="size-10 sm:size-12 rounded-lg sm:rounded-xl object-cover" alt={contact.name} />
                {userStatuses[contact.id] && <div className="absolute -bottom-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-white"></div>}
              </div>
              <div className="flex-1 text-left overflow-hidden min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <h4 className={`text-sm font-black truncate ${activeContactId === contact.id ? 'text-primary' : 'text-gray-900'}`}>{contact.name}</h4>
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mt-0.5">{contact.role}</p>
                <p className="text-xs text-gray-500 truncate mt-1 font-medium group-hover:text-gray-700">{contact.lastMsg || 'No messages yet'}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Window */}
      <section className="flex-1 bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden relative">
        <div className="p-4 sm:p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button onClick={() => navigate(-1)} className="md:hidden size-9 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-all flex-shrink-0">
              <span className="material-symbols-outlined text-gray-500">arrow_back</span>
            </button>
            <div className="relative flex-shrink-0">
              <img src={activeContact.img} className="size-10 sm:size-12 rounded-lg sm:rounded-xl object-cover" alt={activeContact.name} />
              {isActiveContactOnline && <div className="absolute -bottom-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-white"></div>}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-gray-900 leading-none truncate">{activeContact.name}</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                {isActiveContactOnline ? 'Active Now' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all hover:bg-gray-100">
              <span className="material-symbols-outlined text-lg">videocam</span>
            </button>
            <button className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all hover:bg-gray-100">
              <span className="material-symbols-outlined text-lg">call</span>
            </button>
            <button className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all hover:bg-gray-100">
              <span className="material-symbols-outlined text-lg">more_vert</span>
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
              <span className="material-symbols-outlined text-5xl sm:text-6xl">chat_bubble_outline</span>
              <p className="text-sm font-bold">Start a conversation with {activeContact.name}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className="max-w-[85%] sm:max-w-[75%] space-y-1">
                  <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm font-medium shadow-sm ${
                    msg.senderId === user?.uid
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                    {msg.file && (
                      <div className={`mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 border text-sm ${msg.senderId === user?.uid ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'}`}>
                        <span className="material-symbols-outlined text-base flex-shrink-0">description</span>
                        <div className="flex-1 truncate min-w-0">
                          <p className="text-xs font-black truncate">{msg.file.name}</p>
                          <p className="text-[10px] opacity-60">File</p>
                        </div>
                        <a href={msg.file.url} download className="material-symbols-outlined text-base hover:scale-110 transition-transform flex-shrink-0">download</a>
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] font-bold text-gray-400 ${msg.senderId === user?.uid ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          {isUploading && (
            <div className="flex justify-end">
              <div className="bg-primary/10 px-3 sm:px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black text-primary animate-pulse">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                UPLOADING...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-50">
          <div className="flex items-center gap-2 sm:gap-4 bg-gray-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 px-3 sm:px-4 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-primary transition-all flex items-center justify-center p-1.5 flex-shrink-0"
              title="Upload a file"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <input 
              type="text" 
              placeholder={`Message ${activeContact.name}...`} 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage(inputText)}
              className="flex-1 bg-transparent border-none outline-none py-2 sm:py-3 text-sm font-medium text-gray-700 min-w-0"
              disabled={isSending}
            />
            <button className="text-gray-400 hover:text-primary transition-all hidden sm:flex flex-shrink-0">
              <span className="material-symbols-outlined">sentiment_satisfied</span>
            </button>
            <button 
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isSending}
              className="bg-primary text-white size-8 sm:size-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
            >
              <span className="material-symbols-outlined">{isSending ? 'schedule' : 'send'}</span>
            </button>
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  );
};

export default QuickChat;
