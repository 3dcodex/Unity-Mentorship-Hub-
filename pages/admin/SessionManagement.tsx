import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../src/firebase';

interface Session {
  id: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  date: any;
  time: string;
  status: string;
  paymentStatus: string;
  amount: number;
}

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const sessionsSnap = await getDocs(collection(db, 'sessions'));
    const sessionsData = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
    setSessions(sessionsData);
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    
    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'cancelled',
      cancelledBy: 'admin',
      cancelledAt: new Date()
    });
    
    loadSessions();
  };

  const filteredSessions = sessions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (dateFilter && s.date?.toDate?.()?.toISOString().split('T')[0] !== dateFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Session Management</h1>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
            >
              <option value="all">All Sessions</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
            
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
            />
            
            <button className="px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
              Export Sessions
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Session ID</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Mentor</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Student</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Date & Time</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {session.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{session.mentorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{session.studentName}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {session.date?.toDate?.()?.toLocaleDateString() || 'N/A'}<br/>
                    {session.time}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      session.status === 'completed' ? 'bg-green-100 text-green-700' :
                      session.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                      session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      session.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                      session.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      ${session.amount} - {session.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {session.status === 'upcoming' && (
                      <button
                        onClick={() => handleCancelSession(session.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionManagement;
