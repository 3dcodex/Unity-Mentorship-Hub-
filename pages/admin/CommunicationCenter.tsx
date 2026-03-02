import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';
import { sendEmailToUser, sendBulkEmail, broadcastNotification, getEmailTemplates, getEmailLogs } from '../../services/communicationService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/AdminToast';

const CommunicationCenter: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'email' | 'notification' | 'broadcast' | 'templates' | 'logs'>('email');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [broadcastFilter, setBroadcastFilter] = useState({ role: 'all', status: 'all' });
  const [templates, setTemplates] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadUsers();
    loadTemplates();
    loadEmailLogs();
  }, []);

  const loadUsers = async () => {
    const usersSnap = await getDocs(collection(db, 'users'));
    setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const loadTemplates = async () => {
    const templatesData = await getEmailTemplates();
    setTemplates(templatesData);
  };

  const loadEmailLogs = async () => {
    const logsData = await getEmailLogs(50);
    setEmailLogs(logsData);
  };

  const handleSendEmail = async () => {
    if (!subject || !message || selectedUsers.length === 0) {
      showToast('Please fill all fields and select users', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await sendBulkEmail(
        selectedUsers,
        subject,
        message,
        currentAdmin?.uid || '',
        currentAdmin?.email || 'Admin'
      );

      showToast(`Email sent to ${result.success} users. ${result.failed} failed.`, 'success');
      setSubject('');
      setMessage('');
      setSelectedUsers([]);
      loadEmailLogs();
    } catch (error) {
      showToast('Failed to send emails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastNotification = async () => {
    if (!subject || !message) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const filter = {
        role: broadcastFilter.role !== 'all' ? broadcastFilter.role : undefined,
        status: broadcastFilter.status !== 'all' ? broadcastFilter.status : undefined
      };

      const sentCount = await broadcastNotification(subject, message, notificationType, filter);
      showToast(`Notification sent to ${sentCount} users`, 'success');
      setSubject('');
      setMessage('');
    } catch (error) {
      showToast('Failed to broadcast notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {ToastComponent}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Communication Center</h1>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-4">
              {['email', 'notification', 'broadcast', 'templates', 'logs'].map((tab) => (
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

          <div className="p-6">
            {activeTab === 'email' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black">Send Email to Users</h2>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Users</label>
                  <select
                    multiple
                    value={selectedUsers}
                    onChange={(e) => setSelectedUsers(Array.from(e.target.selectedOptions, option => option.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl h-40"
                  >
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-600 mt-1">Hold Ctrl/Cmd to select multiple users</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                    placeholder="Email subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                    rows={6}
                    placeholder="Email message..."
                  />
                </div>

                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" color="white" /> : <span className="material-symbols-outlined">send</span>}
                  Send Email to {selectedUsers.length} User(s)
                </button>
              </div>
            )}

            {activeTab === 'broadcast' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black">Broadcast Notification</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Role</label>
                    <select
                      value={broadcastFilter.role}
                      onChange={(e) => setBroadcastFilter({ ...broadcastFilter, role: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Students</option>
                      <option value="professional">Professionals</option>
                      <option value="moderator">Moderators</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Status</label>
                    <select
                      value={broadcastFilter.status}
                      onChange={(e) => setBroadcastFilter({ ...broadcastFilter, status: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="pending">Pending Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Notification Type</label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as any)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                    placeholder="Notification title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                    rows={4}
                    placeholder="Notification message..."
                  />
                </div>

                <button
                  onClick={handleBroadcastNotification}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <LoadingSpinner size="sm" color="white" /> : <span className="material-symbols-outlined">campaign</span>}
                  Broadcast Notification
                </button>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-black">Email Logs ({emailLogs.length})</h2>
                {emailLogs.length === 0 ? (
                  <p className="text-gray-600">No emails sent yet</p>
                ) : (
                  <div className="space-y-2">
                    {emailLogs.map((log) => (
                      <div key={log.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold">{log.subject}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">To: {log.to?.length || 0} user(s)</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Sent by {log.sentByName} on {log.sentAt?.toDate?.()?.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationCenter;
