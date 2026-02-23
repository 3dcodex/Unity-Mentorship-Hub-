import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useAuth } from '../App';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  createdAt: any;
  responses: Array<{
    adminName: string;
    message: string;
    timestamp: any;
  }>;
}

const MyTickets: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  const loadTickets = async () => {
    if (!user) return;
    const ticketsSnap = await getDocs(
      query(collection(db, 'supportTickets'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))
    );
    const ticketsData = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
    setTickets(ticketsData);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black text-gray-900">My Support Tickets</h1>
        <button
          onClick={() => navigate('/help/contact')}
          className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all"
        >
          New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-black">All Tickets ({tickets.length})</h2>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {tickets.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <span className="material-symbols-outlined text-6xl mb-4">support_agent</span>
                <p className="font-bold">No tickets yet</p>
              </div>
            ) : (
              tickets.map(ticket => (
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
                  <p className="text-sm text-gray-500 line-clamp-2">{ticket.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {ticket.createdAt?.toDate?.()?.toLocaleString() || 'Just now'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {selectedTicket ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black">{selectedTicket.subject}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedTicket.status === 'open' ? 'bg-red-100 text-red-700' :
                    selectedTicket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">Your Message:</p>
                  <p className="text-sm text-gray-800">{selectedTicket.message}</p>
                </div>
              </div>

              <div>
                <h3 className="font-black text-gray-900 mb-3">Admin Responses ({selectedTicket.responses?.length || 0})</h3>
                <div className="space-y-3">
                  {selectedTicket.responses?.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <span className="material-symbols-outlined text-4xl mb-2">schedule</span>
                      <p className="text-sm font-bold">Waiting for admin response...</p>
                    </div>
                  ) : (
                    selectedTicket.responses?.map((response, idx) => (
                      <div key={idx} className="bg-green-50 rounded-xl p-4">
                        <p className="text-xs font-bold text-green-700 mb-1">{response.adminName}</p>
                        <p className="text-sm text-gray-800">{response.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {response.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
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
  );
};

export default MyTickets;
