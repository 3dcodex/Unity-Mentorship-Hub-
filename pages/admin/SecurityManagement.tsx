import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../src/firebase';

interface SecurityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  ipAddress: string;
  timestamp: any;
  status: string;
}

const SecurityManagement: React.FC = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const logsSnap = await getDocs(
      query(collection(db, 'securityLogs'), orderBy('timestamp', 'desc'), limit(100))
    );
    const logsData = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityLog));
    setLogs(logsData);
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.action === filter);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Security & Logs</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-gray-500 mb-2">Total Events</p>
            <p className="text-3xl font-black text-gray-900">{logs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-gray-500 mb-2">Failed Logins</p>
            <p className="text-3xl font-black text-red-600">
              {logs.filter(l => l.action === 'failed_login').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-gray-500 mb-2">Admin Actions</p>
            <p className="text-3xl font-black text-blue-600">
              {logs.filter(l => l.action.includes('admin')).length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-gray-500 mb-2">Suspicious Activity</p>
            <p className="text-3xl font-black text-yellow-600">
              {logs.filter(l => l.status === 'suspicious').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
          >
            <option value="all">All Events</option>
            <option value="login">Login Events</option>
            <option value="failed_login">Failed Logins</option>
            <option value="admin_action">Admin Actions</option>
            <option value="user_suspended">User Suspensions</option>
            <option value="payment">Payment Events</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Action</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">IP Address</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.timestamp?.toDate?.()?.toLocaleString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{log.userName}</p>
                    <p className="text-xs text-gray-500">{log.userId}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.action}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{log.ipAddress}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      log.status === 'success' ? 'bg-green-100 text-green-700' :
                      log.status === 'failed' ? 'bg-red-100 text-red-700' :
                      log.status === 'suspicious' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {log.status}
                    </span>
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

export default SecurityManagement;
