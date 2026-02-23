import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../src/firebase';
import { getConversations, getMessages, sendMessage, checkConnection } from '../services/messagingService';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated: any;
  otherUserName?: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  isRead: boolean;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedConversation) return;
    
    const unsubscribe = onSnapshot(
      query(collection(db, `conversations/${selectedConversation}/messages`), orderBy('createdAt', 'asc')),
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
      }
    );
    
    return () => unsubscribe();
  }, [selectedConversation]);

  const loadConversations = async () => {
    if (!user) return;
    const convos = await getConversations(user.uid);
    
    const convosWithNames = await Promise.all(
      convos.map(async (convo) => {
        const otherUserId = convo.participants.find(p => p !== user.uid);
        const userDoc = await db.collection('users').doc(otherUserId).get();
        return { ...convo, otherUserName: userDoc.data()?.name || 'Unknown' };
      })
    );
    
    setConversations(convosWithNames);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    try {
      await sendMessage(selectedConversation, user.uid, newMessage);
      setNewMessage('');
    } catch (error) {
      alert('Failed to send message: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Messages</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-black text-gray-900">Conversations</h2>
            </div>
            <div className="overflow-y-auto h-full">
              {conversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => setSelectedConversation(convo.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation === convo.id ? 'bg-green-50' : ''
                  }`}
                >
                  <p className="font-bold text-gray-900">{convo.otherUserName}</p>
                  <p className="text-sm text-gray-600 truncate">{convo.lastMessage}</p>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Book a session to start messaging</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-black text-gray-900">
                    {conversations.find(c => c.id === selectedConversation)?.otherUserName}
                  </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          msg.senderId === user?.uid
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {msg.createdAt?.toDate?.()?.toLocaleTimeString() || ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl mb-4">chat</span>
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
