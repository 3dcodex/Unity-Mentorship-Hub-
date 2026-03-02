import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../src/firebase';
import { formatDate, formatDateTime, formatCurrency } from '../utils/formatters';
import LoadingSpinner from './LoadingSpinner';
import StatusBadge from './StatusBadge';
import { useToast } from './AdminToast';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  accountStatus?: string;
  createdAt: any;
  lastActive: any;
  phone?: string;
  bio?: string;
  location?: string;
  profilePicture?: string;
  verified?: boolean;
  subscriptionPlan?: string;
  totalSessions?: number;
  totalSpent?: number;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, onClose, onUpdate }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'payments' | 'reports' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<'general' | 'warning' | 'positive' | 'issue'>('general');
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUser({ id: userDoc.id, ...userDoc.data() } as UserData);
      }

      // Load sessions
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('studentId', '==', userId)
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      setSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load transactions
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      );
      const transactionsSnap = await getDocs(transactionsQuery);
      setTransactions(transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load reports (filed by or against user)
      const reportsByQuery = query(
        collection(db, 'reports'),
        where('reporterId', '==', userId)
      );
      const reportsAgainstQuery = query(
        collection(db, 'reports'),
        where('reportedUserId', '==', userId)
      );
      const [reportsBySnap, reportsAgainstSnap] = await Promise.all([
        getDocs(reportsByQuery),
        getDocs(reportsAgainstQuery)
      ]);
      setReports([
        ...reportsBySnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'filed' })),
        ...reportsAgainstSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'against' }))
      ]);

      // Load reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('reviewerId', '==', userId)
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load admin notes
      const notesQuery = query(
        collection(db, 'userNotes'),
        where('userId', '==', userId)
      );
      const notesSnap = await getDocs(notesQuery);
      setNotes(notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Failed to load user data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await addDoc(collection(db, 'userNotes'), {
        userId,
        note: newNote,
        category: noteCategory,
        createdAt: Timestamp.now(),
        adminId: 'current-admin-id', // Replace with actual admin ID
        adminName: 'Admin' // Replace with actual admin name
      });

      setNewNote('');
      showToast('Note added successfully', 'success');
      loadUserData();
    } catch (error) {
      showToast('Failed to add note', 'error');
    }
  };

  const handleSendEmail = () => {
    if (user?.email) {
      window.location.href = `mailto:${user.email}`;
    }
  };

  const handleExportUserData = async () => {
    if (!user) return;

    const data = {
      user,
      sessions,
      transactions,
      reports,
      reviews,
      notes
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-${userId}-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    showToast('User data exported successfully', 'success');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-bold mt-4">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md">
          <p className="text-red-600 font-bold">User not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-xl">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {ToastComponent}
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-black text-blue-600">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-black">{user.name}</h2>
                <p className="text-blue-100">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={user.status} />
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                    {user.role?.toUpperCase()}
                  </span>
                  {user.verified && (
                    <span className="px-3 py-1 bg-green-500 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2">
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSendEmail}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">email</span>
              Send Email
            </button>
            <button
              onClick={handleExportUserData}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export Data
            </button>
            <button
              onClick={() => window.open(`/profile-view/${userId}`, '_blank')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              View Public Profile
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            {['overview', 'sessions', 'payments', 'reports', 'notes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 font-bold capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-600 font-bold">Total Sessions</p>
                  <p className="text-3xl font-black text-blue-900">{sessions.length}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-600 font-bold">Total Spent</p>
                  <p className="text-3xl font-black text-green-900">
                    {formatCurrency(transactions.reduce((sum, t) => sum + (t.amount || 0), 0))}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-600 font-bold">Reviews Given</p>
                  <p className="text-3xl font-black text-purple-900">{reviews.length}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-red-600 font-bold">Reports</p>
                  <p className="text-3xl font-black text-red-900">{reports.length}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-black mb-4">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-bold">User ID</p>
                    <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-bold">Joined</p>
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-bold">Last Active</p>
                    <p className="text-gray-900">{formatDateTime(user.lastActive)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-bold">Subscription</p>
                    <p className="text-gray-900">{user.subscriptionPlan || 'Free'}</p>
                  </div>
                  {user.phone && (
                    <div>
                      <p className="text-sm text-gray-600 font-bold">Phone</p>
                      <p className="text-gray-900">{user.phone}</p>
                    </div>
                  )}
                  {user.location && (
                    <div>
                      <p className="text-sm text-gray-600 font-bold">Location</p>
                      <p className="text-gray-900">{user.location}</p>
                    </div>
                  )}
                </div>
                {user.bio && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 font-bold">Bio</p>
                    <p className="text-gray-900 mt-1">{user.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <h3 className="text-xl font-black">Session History ({sessions.length})</h3>
              {sessions.length === 0 ? (
                <p className="text-gray-600">No sessions found</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold">{session.title || 'Session'}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(session.date)}</p>
                      </div>
                      <StatusBadge status={session.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-xl font-black">Payment History ({transactions.length})</h3>
              {transactions.length === 0 ? (
                <p className="text-gray-600">No transactions found</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(transaction.createdAt)}</p>
                      </div>
                      <StatusBadge status={transaction.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="text-xl font-black">Reports ({reports.length})</h3>
              {reports.length === 0 ? (
                <p className="text-gray-600">No reports found</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          report.type === 'filed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {report.type === 'filed' ? 'Filed by user' : 'Against user'}
                        </span>
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="font-bold">{report.reason}</p>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDateTime(report.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="text-lg font-black mb-3">Add New Note</h3>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl mb-2"
                >
                  <option value="general">General</option>
                  <option value="warning">Warning</option>
                  <option value="positive">Positive</option>
                  <option value="issue">Issue</option>
                </select>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this user..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-2"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Add Note
                </button>
              </div>

              <h3 className="text-xl font-black">Admin Notes ({notes.length})</h3>
              {notes.length === 0 ? (
                <p className="text-gray-600">No notes yet</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          note.category === 'warning' ? 'bg-red-100 text-red-700' :
                          note.category === 'positive' ? 'bg-green-100 text-green-700' :
                          note.category === 'issue' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {note.category}
                        </span>
                        <p className="text-xs text-gray-500">{formatDateTime(note.createdAt)}</p>
                      </div>
                      <p className="text-gray-900">{note.note}</p>
                      <p className="text-xs text-gray-600 mt-2">By: {note.adminName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
