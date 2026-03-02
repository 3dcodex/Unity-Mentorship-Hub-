import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, orderBy, Timestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { presenceService } from '../services/presenceService';

interface Connection {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount?: number;
  isOnline?: boolean;
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
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room');
  const targetUserId = searchParams.get('user');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedChat, setSelectedChat] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice'>('video');
  const [isInCall, setIsInCall] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{[userId: string]: boolean}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
    
    const handlePhotoUpdate = () => {
      if (user) loadConnections();
    };
    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);
    
    return () => {
      window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
    };
  }, [user]);

  // Handle URL parameters after connections are loaded
  useEffect(() => {
    if (connections.length > 0) {
      if (roomId) {
        const conn = connections.find(c => c.id === roomId);
        if (conn && !selectedChat) setSelectedChat(conn);
      } else if (targetUserId) {
        const conn = connections.find(c => c.userId === targetUserId);
        if (conn && !selectedChat) setSelectedChat(conn);
      }
    }
  }, [connections, roomId, targetUserId, selectedChat]);

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
            userName: userData?.name || userData?.displayName || 'User',
            userPhoto: userData?.photoURL || '',
            lastMessage: data.lastMessage || '',
            lastMessageTime: data.lastMessageTime,
            unreadCount: 0,
            isOnline: onlineUsers[otherUserId] || false,
          };
        })
      );
      
      setConnections(conns);
      
      // Listen to presence for all connections
      conns.forEach(conn => {
        presenceService.listenToUserStatus(conn.userId, (isOnline) => {
          setOnlineUsers(prev => ({ ...prev, [conn.userId]: isOnline }));
          setConnections(prevConns => 
            prevConns.map(c => c.userId === conn.userId ? { ...c, isOnline } : c)
          );
        });
      });
    } catch (err) {
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const createConnectionIfNeeded = async (otherUserId: string) => {
    if (!user) return;
    
    try {
      const connectionId = [user.uid, otherUserId].sort().join('_');
      
      await setDoc(doc(db, 'connections', connectionId), {
        participants: [user.uid, otherUserId],
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        lastMessage: '',
        lastMessageTime: null
      }, { merge: true });
      
      await loadConnections();
    } catch (err) {
      console.error('Error creating connection:', err);
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

  const deleteConversation = async (connectionId: string, otherUserId: string) => {
    if (!user || !confirm('Delete this conversation? This action cannot be undone.')) return;
    
    try {
      const conversationId = [user.uid, otherUserId].sort().join('_');
      
      // Delete all messages in the conversation
      const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const deletePromises = messagesSnapshot.docs.map(messageDoc => 
        deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageDoc.id))
      );
      await Promise.all(deletePromises);
      
      // Delete the conversation document
      await deleteDoc(doc(db, 'conversations', conversationId));
      
      // Delete the connection
      await deleteDoc(doc(db, 'connections', connectionId));
      
      // Refresh connections
      await loadConnections();
      setSelectedChat(null);
      setMessages([]);
      
      alert('Conversation deleted successfully');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Failed to delete conversation');
    }
  };

  const clearAllConversations = async () => {
    if (!user || !confirm('Clear all conversations? This will delete all your messages and connections.')) return;
    
    try {
      // Delete all connections for this user
      const connectionsQuery = query(collection(db, 'connections'), where('participants', 'array-contains', user.uid));
      const connectionsSnapshot = await getDocs(connectionsQuery);
      
      for (const connectionDoc of connectionsSnapshot.docs) {
        const connectionData = connectionDoc.data();
        const otherUserId = connectionData.participants.find((id: string) => id !== user.uid);
        const conversationId = [user.uid, otherUserId].sort().join('_');
        
        // Delete all messages in this conversation
        const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        const deletePromises = messagesSnapshot.docs.map(messageDoc => 
          deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageDoc.id))
        );
        await Promise.all(deletePromises);
        
        // Delete the conversation document
        await deleteDoc(doc(db, 'conversations', conversationId));
        
        // Delete the connection
        await deleteDoc(doc(db, 'connections', connectionDoc.id));
      }
      
      // Refresh the UI
      setConnections([]);
      setSelectedChat(null);
      setMessages([]);
      
      alert('All conversations cleared successfully');
    } catch (err) {
      console.error('Error clearing conversations:', err);
      alert('Failed to clear conversations');
    }
  };

  const startCall = async (type: 'video' | 'voice') => {
    if (!selectedChat) return;
    
    // Check if user is online
    const isOnline = onlineUsers[selectedChat.userId];
    if (!isOnline) {
      alert(`${selectedChat.userName} is currently offline. They will receive a notification about your call attempt.`);
      
      // Send offline call notification
      await addDoc(collection(db, 'notifications'), {
        userId: selectedChat.userId,
        type: 'missed_call',
        title: `Missed ${type} call`,
        message: `${user.displayName || user.email} tried to call you while you were offline`,
        read: false,
        createdAt: Timestamp.now(),
        callerId: user.uid,
        callType: type
      });
      return;
    }
    
    try {
      setCallType(type);
      setIsInCall(true);
      
      // Get user media
      const constraints = {
        video: type === 'video',
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Send call notification to other user
      await addDoc(collection(db, 'notifications'), {
        userId: selectedChat.userId,
        type: 'call',
        title: `Incoming ${type} call`,
        message: `${user.displayName || user.email} is calling you`,
        read: false,
        createdAt: Timestamp.now(),
        callerId: user.uid,
        callType: type
      });
      
      setShowCallModal(true);
    } catch (err) {
      console.error('Error starting call:', err);
      alert('Failed to start call. Please check your camera/microphone permissions.');
      endCall();
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setIsInCall(false);
    setShowCallModal(false);
  };

  const sendMessage = async () => {
    if (!user || !selectedChat || !messageText.trim()) return;
    
    const conversationId = [user.uid, selectedChat.userId].sort().join('_');
    const messageToSend = messageText.trim();
    
    console.log('Sending message:', { conversationId, messageToSend, userId: user.uid, selectedChatId: selectedChat.id });
    
    try {
      // Clear input immediately for better UX
      setMessageText('');
      
      // Ensure conversation document exists
      console.log('Creating/updating conversation document...');
      await setDoc(doc(db, 'conversations', conversationId), {
        participants: [user.uid, selectedChat.userId],
        lastMessage: messageToSend,
        lastMessageTime: Timestamp.now(),
        isActive: true
      }, { merge: true });
      
      // Add the message
      console.log('Adding message to subcollection...');
      const messageRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        text: messageToSend,
        senderId: user.uid,
        timestamp: Timestamp.now(),
      });
      console.log('Message added with ID:', messageRef.id);
      
      // Update connection with last message
      console.log('Updating connection document...');
      await updateDoc(doc(db, 'connections', selectedChat.id), {
        lastMessage: messageToSend,
        lastMessageTime: Timestamp.now(),
      });
      
      console.log('Message sent successfully!');
    } catch (err) {
      console.error('Error sending message:', err);
      setMessageText(messageToSend); // Restore message on error
      alert(`Failed to send message: ${err.message}`);
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
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Messages</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{connections.length} connections</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearAllConversations}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Clear all conversations"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
              </button>
            </div>
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
                  className={`group w-full p-4 flex items-center gap-3 border-b transition-colors ${
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
                    <div className="flex items-center gap-2">
                      <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{conn.userName}</p>
                      <div className={`size-2 rounded-full flex-shrink-0 ${conn.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {conn.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conn.id, conn.userId);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete conversation"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
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
              <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                    {selectedChat.userPhoto ? (
                      <img src={selectedChat.userPhoto} alt={selectedChat.userName} className="w-full h-full object-cover" />
                    ) : (
                      selectedChat.userName[0]
                    )}
                  </div>
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedChat.userName}</p>
                    <div className="flex items-center gap-2">
                      <div className={`size-2 rounded-full ${onlineUsers[selectedChat.userId] ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {onlineUsers[selectedChat.userId] ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startCall('voice')}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Voice call"
                  >
                    <span className="material-symbols-outlined">call</span>
                  </button>
                  <button
                    onClick={() => startCall('video')}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Video call"
                  >
                    <span className="material-symbols-outlined">videocam</span>
                  </button>
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
      
      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className={`w-full max-w-4xl h-3/4 rounded-2xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {selectedChat?.userPhoto ? (
                    <img src={selectedChat.userPhoto} alt={selectedChat.userName} className="w-full h-full object-cover" />
                  ) : (
                    selectedChat?.userName[0]
                  )}
                </div>
                <div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedChat?.userName}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{callType === 'video' ? 'Video Call' : 'Voice Call'}</p>
                </div>
              </div>
              <button
                onClick={endCall}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">call_end</span>
              </button>
            </div>
            
            <div className="flex-1 p-4 h-full">
              {callType === 'video' ? (
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 text-white text-sm font-bold bg-black/50 px-2 py-1 rounded">
                      You
                    </div>
                  </div>
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 text-white text-sm font-bold bg-black/50 px-2 py-1 rounded">
                      {selectedChat?.userName}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="size-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 overflow-hidden">
                      {selectedChat?.userPhoto ? (
                        <img src={selectedChat.userPhoto} alt={selectedChat.userName} className="w-full h-full object-cover" />
                      ) : (
                        selectedChat?.userName[0]
                      )}
                    </div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedChat?.userName}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Voice call in progress...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className={`p-4 border-t flex justify-center gap-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={endCall}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined">call_end</span>
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickChat;
