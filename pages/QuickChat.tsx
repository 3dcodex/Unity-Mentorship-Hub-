import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, orderBy, Timestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { presenceService } from '../services/presenceService';
import { errorService } from '../services/errorService';
import { useToast } from '../components/AdminToast';

interface Connection {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage?: string;
  lastMessageTime?: Timestamp | Date;
  unreadCount?: number;
  isOnline?: boolean;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp | Date;
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
  const [incomingCall, setIncomingCall] = useState<{callId: string; callerId: string; callerName: string; callerPhoto: string; callType: 'video' | 'voice'} | null>(null);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmLabel?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(null);
  const callListenersRef = useRef<(() => void) | null>(null);
  const { showToast, ToastComponent } = useToast();

  const openConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmLabel = 'Confirm'
  ) => {
    setConfirmDialog({ title, message, onConfirm, confirmLabel });
  };

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

  // Listen for incoming calls targeting this user
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'calls'),
      where('calleeId', '==', user.uid),
      where('status', '==', 'ringing')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !isInCall) {
          const data = change.doc.data();
          setIncomingCall({
            callId: change.doc.id,
            callerId: data.callerId,
            callerName: data.callerName || 'Someone',
            callerPhoto: data.callerPhoto || '',
            callType: data.callType,
          });
        }
      });
    });
    return () => unsub();
  }, [user, isInCall]);

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
      errorService.handleError(err, 'Error loading connections');
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
      errorService.handleError(err, 'Error creating connection');
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
    if (!user) return;
    openConfirmDialog(
      'Delete Conversation',
      'Delete this conversation? This action cannot be undone.',
      async () => {
        try {
          const conversationId = [user.uid, otherUserId].sort().join('_');

          const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
          const messagesSnapshot = await getDocs(messagesQuery);

          const deletePromises = messagesSnapshot.docs.map(messageDoc =>
            deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageDoc.id))
          );
          await Promise.all(deletePromises);

          await deleteDoc(doc(db, 'conversations', conversationId));
          await deleteDoc(doc(db, 'connections', connectionId));

          await loadConnections();
          setSelectedChat(null);
          setMessages([]);
          showToast('Conversation deleted successfully', 'success');
        } catch (err) {
          errorService.handleError(err, 'Error deleting conversation');
          showToast('Failed to delete conversation', 'error');
        }
      },
      'Delete'
    );
  };

  const clearAllConversations = async () => {
    if (!user) return;

    openConfirmDialog(
      'Clear All Conversations',
      'This will delete all your messages and connections. Continue?',
      async () => {
        try {
          const connectionsQuery = query(collection(db, 'connections'), where('participants', 'array-contains', user.uid));
          const connectionsSnapshot = await getDocs(connectionsQuery);

          for (const connectionDoc of connectionsSnapshot.docs) {
            const connectionData = connectionDoc.data();
            const otherUserId = connectionData.participants.find((id: string) => id !== user.uid);
            const conversationId = [user.uid, otherUserId].sort().join('_');

            const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'));
            const messagesSnapshot = await getDocs(messagesQuery);

            const deletePromises = messagesSnapshot.docs.map(messageDoc =>
              deleteDoc(doc(db, 'conversations', conversationId, 'messages', messageDoc.id))
            );
            await Promise.all(deletePromises);

            await deleteDoc(doc(db, 'conversations', conversationId));
            await deleteDoc(doc(db, 'connections', connectionDoc.id));
          }

          setConnections([]);
          setSelectedChat(null);
          setMessages([]);
          showToast('All conversations cleared', 'success');
        } catch (err) {
          errorService.handleError(err, 'Error clearing conversations');
          showToast('Failed to clear conversations', 'error');
        }
      },
      'Clear All'
    );
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    peerConnectionRef.current = pc;
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };
    return pc;
  };

  const startCall = async (type: 'video' | 'voice') => {
    if (!user || !selectedChat) return;
    try {
      setCallType(type);
      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current && type === 'video') localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const newCallId = `${user.uid}_${selectedChat.userId}_${Date.now()}`;
      callIdRef.current = newCallId;

      await setDoc(doc(db, 'calls', newCallId), {
        callerId: user.uid,
        callerName: user.displayName || user.email,
        callerPhoto: user.photoURL || '',
        calleeId: selectedChat.userId,
        callType: type,
        status: 'ringing',
        offer: { type: offer.type, sdp: offer.sdp },
        createdAt: Timestamp.now(),
      });

      // Publish caller ICE candidates to Firestore
      pc.onicecandidate = async (event) => {
        if (event.candidate && callIdRef.current) {
          await addDoc(collection(db, 'calls', callIdRef.current, 'callerCandidates'), {
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Listen for answer + callee ICE candidates
      const callDocUnsub = onSnapshot(doc(db, 'calls', newCallId), async (snap) => {
        const data = snap.data();
        if (!data) return;
        if (data.status === 'answered' && data.answer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallStatus('connected');
        }
        if (data.status === 'ended' || data.status === 'rejected') { endCall(); }
      });

      const calleeCandUnsub = onSnapshot(collection(db, 'calls', newCallId, 'calleeCandidates'), (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type === 'added') await pc.addIceCandidate(new RTCIceCandidate(change.doc.data().candidate));
        });
      });

      callListenersRef.current = () => { callDocUnsub(); calleeCandUnsub(); };
      setCallStatus('ringing');
      setIsInCall(true);
      setShowCallModal(true);
    } catch (err) {
      errorService.handleError(err, 'Error starting call');
      showToast('Could not access camera/microphone. Check your permissions.', 'error');
      endCall();
    }
  };

  const answerCall = async () => {
    if (!user || !incomingCall) return;
    const { callId: cId, callType: cType } = incomingCall;
    try {
      setCallType(cType);
      const stream = await navigator.mediaDevices.getUserMedia({ video: cType === 'video', audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current && cType === 'video') localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const callSnap = await getDoc(doc(db, 'calls', cId));
      const callData = callSnap.data();
      if (!callData) { setIncomingCall(null); return; }

      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await updateDoc(doc(db, 'calls', cId), {
        answer: { type: answer.type, sdp: answer.sdp },
        status: 'answered',
      });

      callIdRef.current = cId;

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await addDoc(collection(db, 'calls', cId, 'calleeCandidates'), {
            candidate: event.candidate.toJSON(),
          });
        }
      };

      const callerCandUnsub = onSnapshot(collection(db, 'calls', cId, 'callerCandidates'), (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type === 'added') await pc.addIceCandidate(new RTCIceCandidate(change.doc.data().candidate));
        });
      });

      const callDocUnsub = onSnapshot(doc(db, 'calls', cId), (snap) => {
        if (snap.data()?.status === 'ended') endCall();
      });

      callListenersRef.current = () => { callDocUnsub(); callerCandUnsub(); };
      setIncomingCall(null);
      setIsInCall(true);
      setCallStatus('connected');
      setShowCallModal(true);
    } catch (err) {
      errorService.handleError(err, 'Error answering call');
      rejectCall();
    }
  };

  const rejectCall = async () => {
    if (incomingCall) {
      try { await updateDoc(doc(db, 'calls', incomingCall.callId), { status: 'rejected' }); } catch { /* ignore */ }
    }
    setIncomingCall(null);
  };

  const endCall = async () => {
    if (callIdRef.current) {
      try { await updateDoc(doc(db, 'calls', callIdRef.current), { status: 'ended' }); } catch { /* ignore */ }
      callIdRef.current = null;
    }
    if (callListenersRef.current) { callListenersRef.current(); callListenersRef.current = null; }
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setIsInCall(false);
    setShowCallModal(false);
    setCallStatus(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = isVideoOff; });
    setIsVideoOff(!isVideoOff);
  };

  const sendMessage = async () => {
    if (!user || !selectedChat || !messageText.trim()) return;
    
    const conversationId = [user.uid, selectedChat.userId].sort().join('_');
    const messageToSend = messageText.trim();
    
    try {
      // Clear input immediately for better UX
      setMessageText('');
      
      // Ensure conversation document exists
      await setDoc(doc(db, 'conversations', conversationId), {
        participants: [user.uid, selectedChat.userId],
        lastMessage: messageToSend,
        lastMessageTime: Timestamp.now(),
        isActive: true
      }, { merge: true });
      
      // Add the message
      const messageRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        text: messageToSend,
        senderId: user.uid,
        timestamp: Timestamp.now(),
      });
      
      // Update connection with last message
      await updateDoc(doc(db, 'connections', selectedChat.id), {
        lastMessage: messageToSend,
        lastMessageTime: Timestamp.now(),
      });
      
    } catch (err) {
      errorService.handleError(err, 'Error sending message');
      setMessageText(messageToSend); // Restore message on error
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast(`Failed to send message: ${message}`, 'error');
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
    <div className={`h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] ${isDark ? 'bg-slate-900' : 'bg-gray-50'} relative`}>
      <div className="h-full flex md:gap-4">

        {/* ── Sidebar: contacts list ── */}
        {/* On mobile: visible only when no chat is selected. On desktop: always visible. */}
        <div className={`
          ${!selectedChat ? 'flex' : 'hidden'} md:flex
          w-full md:w-80 flex-shrink-0 flex-col
          md:rounded-2xl md:border
          ${isDark ? 'bg-slate-800 md:border-gray-700' : 'bg-white md:border-gray-200'}
          overflow-hidden
        `}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Messages</h2>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{connections.length} connections</p>
            </div>
            <button
              onClick={clearAllConversations}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Clear all conversations"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {connections.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">chat_bubble</span>
                <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No connections yet</p>
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Find a mentor to start chatting</p>
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
                  <div className="relative size-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {conn.userPhoto
                      ? <img src={conn.userPhoto} alt={conn.userName} className="w-full h-full object-cover" />
                      : conn.userName[0]}
                    <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white dark:border-slate-800 ${conn.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{conn.userName}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {conn.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conn.id, conn.userId); }}
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

        {/* ── Chat Area ── */}
        {/* On mobile: visible only when a chat is selected. On desktop: always visible. */}
        <div className={`
          ${selectedChat ? 'flex' : 'hidden'} md:flex
          flex-1 flex-col
          md:rounded-2xl md:border
          ${isDark ? 'bg-slate-800 md:border-gray-700' : 'bg-white md:border-gray-200'}
          overflow-hidden
        `}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className={`p-3 md:p-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Back button – mobile only */}
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden p-2 -ml-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    aria-label="Back to contacts"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div className="relative size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {selectedChat.userPhoto
                      ? <img src={selectedChat.userPhoto} alt={selectedChat.userName} className="w-full h-full object-cover" />
                      : selectedChat.userName[0]}
                    <span className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white dark:border-slate-800 ${onlineUsers[selectedChat.userId] ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedChat.userName}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {onlineUsers[selectedChat.userId] ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">waving_hand</span>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Say hi to {selectedChat.userName}!</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] md:max-w-xs px-4 py-2.5 rounded-2xl ${
                      msg.senderId === user?.uid
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : isDark ? 'bg-slate-700 text-white rounded-bl-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user?.uid ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(msg.timestamp as any)?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className={`p-3 md:p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex gap-2 items-end">
                  <input
                    type="text"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message…"
                    className={`flex-1 px-4 py-3 rounded-2xl border-none text-sm ${isDark ? 'bg-slate-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    className="size-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <span className="material-symbols-outlined text-xl">send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Desktop empty state when no chat selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">chat</span>
                <p className={`mt-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Incoming Call Banner ── */}
      {incomingCall && !isInCall && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
          <div className={`rounded-2xl shadow-2xl p-4 flex items-center gap-4 ${isDark ? 'bg-slate-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="relative size-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
              {incomingCall.callerPhoto
                ? <img src={incomingCall.callerPhoto} alt={incomingCall.callerName} className="w-full h-full object-cover" />
                : incomingCall.callerName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{incomingCall.callerName}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Incoming {incomingCall.callType} call…
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={rejectCall}
                className="size-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                aria-label="Reject call"
              >
                <span className="material-symbols-outlined text-lg">call_end</span>
              </button>
              <button
                onClick={answerCall}
                className="size-10 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                aria-label="Accept call"
              >
                <span className="material-symbols-outlined text-lg">call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Call Modal ── */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
          {/* Call Header */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                {selectedChat?.userPhoto
                  ? <img src={selectedChat.userPhoto} alt={selectedChat.userName} className="w-full h-full object-cover" />
                  : selectedChat?.userName[0]}
              </div>
              <div>
                <p className="font-bold text-white">{selectedChat?.userName}</p>
                <p className="text-xs text-gray-300">
                  {callStatus === 'ringing' ? 'Calling…' : callStatus === 'connected' ? 'Connected' : callType === 'video' ? 'Video Call' : 'Voice Call'}
                </p>
              </div>
            </div>
          </div>

          {/* Video / Voice Area */}
          <div className="flex-1 relative">
            {callType === 'video' ? (
              <>
                {/* Remote video – full screen */}
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {/* Local video – picture-in-picture */}
                <div className="absolute top-4 right-4 w-28 md:w-36 aspect-video rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                </div>
                {callStatus === 'ringing' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="size-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 overflow-hidden">
                        {selectedChat?.userPhoto
                          ? <img src={selectedChat.userPhoto} alt={selectedChat.userName} className="w-full h-full object-cover" />
                          : selectedChat?.userName[0]}
                      </div>
                      <p className="text-white font-bold text-lg">{selectedChat?.userName}</p>
                      <p className="text-gray-300 text-sm mt-1">Ringing…</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className={`size-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ${callStatus === 'ringing' ? 'animate-pulse' : ''} flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 overflow-hidden`}>
                    {selectedChat?.userPhoto
                      ? <img src={selectedChat.userPhoto} alt={selectedChat.userName} className="w-full h-full object-cover" />
                      : selectedChat?.userName[0]}
                  </div>
                  <p className="text-white font-bold text-xl">{selectedChat?.userName}</p>
                  <p className="text-gray-300 text-sm mt-2">
                    {callStatus === 'ringing' ? 'Calling…' : 'Voice call in progress'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="p-6 flex justify-center items-center gap-6">
            <button
              onClick={toggleMute}
              className={`size-14 flex items-center justify-center rounded-full transition-colors ${isMuted ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'}`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
            </button>
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`size-14 flex items-center justify-center rounded-full transition-colors ${isVideoOff ? 'bg-white text-gray-900' : 'bg-white/20 text-white hover:bg-white/30'}`}
                aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                <span className="material-symbols-outlined">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
              </button>
            )}
            <button
              onClick={endCall}
              className="size-16 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg"
              aria-label="End call"
            >
              <span className="material-symbols-outlined text-2xl">call_end</span>
            </button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{confirmDialog.title}</h3>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{confirmDialog.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className={`px-4 py-2 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                className="px-4 py-2 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700"
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastComponent}
    </div>
  );
};

export default QuickChat;
