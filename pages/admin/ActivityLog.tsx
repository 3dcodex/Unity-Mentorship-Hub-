import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/AdminToast';

interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  details: string;
  timestamp: any;
}

const ActivityLog: React.FC = () => {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAdmin, setFilterAdmin] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [admins, setAdmins] = useState<string[]>([]);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'adminActions'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      const snapshot = await getDocs(q);
      const actionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminAction[];
      
      setActions(actionsData);
      
      // Extract unique admin names
      const uniqueAdmins = [...new Set(actionsData.map(a => a.adminName))];
      setAdmins(uniqueAdmins);
    } catch (error) {
      console.error('Error loading actions:', error);
      showToast('Failed to load activity log', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Admin', 'Action', 'Target User', 'Details'];
    const rows = filteredActions.map(action => [
      formatDateTime(action.timestamp),
      action.adminName,
      action.action,
      action.targetUserName || 'N/A',
      typeof action.details === 'string' ? action.details : JSON.stringify(action.details)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showToast('Activity log exported successfully', 'success');
  };

  const filteredActions = actions.filter(action => {
    if (filterAdmin !== 'all' && action.adminName !== filterAdmin) return false;
    if (filterAction !== 'all' && action.action !== filterAction) return false;
    
    if (dateRange.start) {
      const actionDate = action.timestamp?.toDate?.() || new Date(action.timestamp);
      if (actionDate < new Date(dateRange.start)) return false;
    }
    
    if (dateRange.end) {
      const actionDate = action.timestamp?.toDate?.() || new Date(action.timestamp);
      if (actionDate > new Date(dateRange.end + 'T23:59:59')) return false;
    }
    
    return true;
  });

  const actionTypes = [...new Set(actions.map(a => a.action))];

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      approve_mentor: 'verified_user',
      reject_mentor: 'cancel',
      suspend_user: 'block',
      activate_user: 'check_circle',
      change_role: 'admin_panel_settings',
      approve_professional: 'business_center',
      grant_free_access: 'card_giftcard',
      error_caught: 'error'
    };
    return icons[action] || 'history';
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      approve_mentor: 'text-green-600 bg-green-100',
      reject_mentor: 'text-red-600 bg-red-100',
      suspend_user: 'text-red-600 bg-red-100',
      activate_user: 'text-green-600 bg-green-100',
      change_role: 'text-blue-600 bg-blue-100',
      approve_professional: 'text-purple-600 bg-purple-100',
      grant_free_access: 'text-yellow-600 bg-yellow-100',
      error_caught: 'text-red-600 bg-red-100'
    };
    return colors[action] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-bold mt-4">Loading activity log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      {ToastComponent}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">Admin Activity Log</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Track all administrative actions and changes</p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined">download</span>
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg mb-6 border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Admins</option>
              {admins.map(admin => (
                <option key={admin} value={admin}>{admin}</option>
              ))}
            </select>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="End Date"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-bold text-gray-900 dark:text-white">{filteredActions.length}</span> of <span className="font-bold text-gray-900 dark:text-white">{actions.length}</span> actions
            </p>
            <button
              onClick={() => {
                setFilterAdmin('all');
                setFilterAction('all');
                setDateRange({ start: '', end: '' });
              }}
              className="text-sm text-green-600 dark:text-green-400 font-bold hover:text-green-700 dark:hover:text-green-300"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {filteredActions.map((action) => (
            <div key={action.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getActionColor(action.action)}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {getActionIcon(action.action)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white truncate">
                        {action.action.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        by <span className="font-bold text-gray-900 dark:text-white">{action.adminName}</span>
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDateTime(action.timestamp)}
                    </span>
                  </div>

                  {action.targetUserName && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Target: <span className="font-bold text-gray-900 dark:text-white">{action.targetUserName}</span>
                    </p>
                  )}

                  {action.details && (
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 mt-2 overflow-x-auto">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words">
                        {typeof action.details === 'string' 
                          ? action.details 
                          : JSON.stringify(action.details, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredActions.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-lg border border-gray-100 dark:border-gray-700">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">history</span>
              <p className="text-xl font-bold text-gray-600 dark:text-gray-400">No activity found</p>
              <p className="text-gray-500 dark:text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
