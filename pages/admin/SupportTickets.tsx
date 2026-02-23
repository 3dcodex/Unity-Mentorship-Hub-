import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, serverTimestamp, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: any;
  updatedAt: any;
  responses: Array<{
    adminId: string;
    adminName: string;
    message: string;
    timestamp: any;
  }>;
}

const SupportTickets: React.FC = () => {
  const { user: admin } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [statusFilter, tickets]);

  const loadTickets = async () => {
    const ticketsSnap = await getDocs(query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc')));
    const ticketsData = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
    setTickets(ticketsData);
  };

  const filterTickets = () => {
    if (statusFilter === 'all') {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(tickets.filter(t => t.status === statusFilter));
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim() || !admin) return;

    setSending(true);
    try {
      const response = {
        adminId: admin.uid,
        adminName: localStorage.getItem('unity_user_name') || admin.email || 'Admin',
        message: responseMessage,
        timestamp: new Date()
      };

      await updateDoc(doc(db, 'supportTickets', selectedTicket.id), {
        responses: arrayUnion(response),
        status: 'in_progress',
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'notifications', `${selectedTicket.userId}_${Date.now()}`), {
        userId: selectedTicket.userId,
        type: 'support_response',
        title: 'Support Response',
        message: `Admin responded to your ticket: ${selectedTicket.subject}`,
        read: false,
        createdAt: serverTimestamp(),
        link: '/my-tickets'
      });

      setResponseMessage('');
      loadTickets();
      alert('Response sent successfully!');
    } catch (error) {
      console.error('Error sending response:', error);
      alert('Failed to send response');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    await updateDoc(doc(db, 'supportTickets', ticketId), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    loadTickets();
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !admin) return;

    setSending(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = usersSnap.docs.map(userDoc => 
        setDoc(doc(db, 'notifications', `${userDoc.id}_${Date.now()}`), {
          userId: userDoc.id,
          type: 'announcement',
          title: 'Platform Announcement',
          message: broadcastMessage,
          read: false,
          createdAt: serverTimestamp()
        })
      );

      await Promise.all(batch);
      setBroadcastMessage('');
      setShowBroadcast(false);
      alert(`Broadcast sent to ${usersSnap.size} users!`);
    } catch (error) {
      console.error('Error broadcasting:', error);
      alert('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-gray-900">Support Tickets</h1>
          <button
            onClick={() => setShowBroadcast(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:scale-105 transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">campaign</span>
              Broadcast Message
            </span>
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex gap-3">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-black">Tickets ({filteredTickets.length})</h2>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all ${
                    selectedTicket?.id === ticket.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-black text-gray-900">{ticket.subject}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      ticket.status === 'open' ? 'bg-red-100 text-red-700' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ticket.userName} • {ticket.userEmail}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{ticket.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {ticket.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            {selectedTicket ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-black">{selectedTicket.subject}</h2>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                      className="px-3 py-1 border-2 border-gray-200 rounded-lg text-sm font-bold"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm font-bold text-gray-700 mb-1">From: {selectedTicket.userName}</p>
                    <p className="text-sm text-gray-600 mb-1">Email: {selectedTicket.userEmail}</p>
                    <p className="text-sm text-gray-600">Category: {selectedTicket.category}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-gray-800">{selectedTicket.message}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-gray-900 mb-3">Responses ({selectedTicket.responses?.length || 0})</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                    {selectedTicket.responses?.map((response, idx) => (
                      <div key={idx} className="bg-green-50 rounded-xl p-4">
                        <p className="text-xs font-bold text-green-700 mb-1">{response.adminName}</p>
                        <p className="text-sm text-gray-800">{response.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {response.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none resize-none mb-3"
                  />
                  <button
                    onClick={handleSendResponse}
                    disabled={sending || !responseMessage.trim()}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl mb-4">support_agent</span>
                  <p className="font-bold">Select a ticket to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBroadcast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full">
            <h2 className="text-3xl font-black mb-4">Broadcast Message</h2>
            <p className="text-gray-600 mb-6">Send a notification to all users on the platform</p>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Type your announcement..."
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowBroadcast(false)}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                disabled={sending || !broadcastMessage.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send to All Users'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
