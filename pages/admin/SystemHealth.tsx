import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../src/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatNumber } from '../../utils/formatters';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalTransactions: number;
  errorCount: number;
  avgResponseTime: number;
  storageUsed: number;
  bandwidthUsed: number;
}

const SystemHealth: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    totalTransactions: 0,
    errorCount: 0,
    avgResponseTime: 0,
    storageUsed: 0,
    bandwidthUsed: 0
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    loadSystemMetrics();
    loadErrors();
    loadPerformanceData();
  }, []);

  const loadSystemMetrics = async () => {
    try {
      const [usersSnap, sessionsSnap, transactionsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'sessions')),
        getDocs(collection(db, 'transactions'))
      ]);

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const activeUsers = usersSnap.docs.filter(doc => {
        const lastActive = doc.data().lastActive?.toDate?.();
        return lastActive && lastActive > last24Hours;
      }).length;

      setMetrics({
        totalUsers: usersSnap.size,
        activeUsers,
        totalSessions: sessionsSnap.size,
        totalTransactions: transactionsSnap.size,
        errorCount: 0,
        avgResponseTime: 0,
        storageUsed: 0,
        bandwidthUsed: 0
      });
    } catch (error) {
      console.error('Error loading system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadErrors = async () => {
    try {
      const errorsQuery = query(
        collection(db, 'adminActions'),
        where('action', '==', 'error_caught')
      );
      const errorsSnap = await getDocs(errorsQuery);
      setErrors(errorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 10));
    } catch (error) {
      console.error('Error loading errors:', error);
    }
  };

  const loadPerformanceData = async () => {
    // Mock performance data - in production, this would come from monitoring service
    setPerformanceData([
      { time: '00:00', responseTime: 120, requests: 450 },
      { time: '04:00', responseTime: 95, requests: 320 },
      { time: '08:00', responseTime: 180, requests: 890 },
      { time: '12:00', responseTime: 210, requests: 1200 },
      { time: '16:00', responseTime: 190, requests: 1100 },
      { time: '20:00', responseTime: 150, requests: 750 }
    ]);
  };

  const getHealthStatus = () => {
    if (metrics.errorCount > 100) return { status: 'critical', color: 'red', text: 'Critical' };
    if (metrics.errorCount > 50) return { status: 'warning', color: 'yellow', text: 'Warning' };
    return { status: 'healthy', color: 'green', text: 'Healthy' };
  };

  const health = getHealthStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-bold mt-4">Loading system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">System Health</h1>
            <p className="text-gray-600 mt-2">Monitor platform performance and health</p>
          </div>
          <div className={`px-6 py-3 bg-${health.color}-100 text-${health.color}-700 rounded-xl font-bold flex items-center gap-2`}>
            <span className="material-symbols-outlined">health_and_safety</span>
            System {health.text}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-500">Total Users</p>
              <span className="material-symbols-outlined text-blue-600">group</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{formatNumber(metrics.totalUsers)}</p>
            <p className="text-sm text-green-600 font-bold mt-2">
              {metrics.activeUsers} active (24h)
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-500">Total Sessions</p>
              <span className="material-symbols-outlined text-purple-600">event</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{formatNumber(metrics.totalSessions)}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-500">Transactions</p>
              <span className="material-symbols-outlined text-green-600">payments</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{formatNumber(metrics.totalTransactions)}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-500">Error Count</p>
              <span className="material-symbols-outlined text-red-600">error</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{formatNumber(metrics.errorCount)}</p>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Performance (Last 24 Hours)</h2>
          <div className="h-64 flex items-end justify-around gap-2">
            {performanceData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500"
                    style={{ height: `${(data.requests / 1200) * 200}px` }}
                    title={`${data.requests} requests`}
                  />
                  <div
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-700 hover:to-green-500"
                    style={{ height: `${(data.responseTime / 210) * 100}px` }}
                    title={`${data.responseTime}ms response time`}
                  />
                </div>
                <p className="text-xs font-bold text-gray-600 mt-2">{data.time}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-sm text-gray-600">Requests</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-sm text-gray-600">Response Time</span>
            </div>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Recent Errors ({errors.length})</h2>
          {errors.length === 0 ? (
            <p className="text-gray-600">No recent errors</p>
          ) : (
            <div className="space-y-2">
              {errors.map((error) => (
                <div key={error.id} className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      ERROR
                    </span>
                    <p className="text-xs text-gray-500">
                      {error.timestamp?.toDate?.()?.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-900 font-mono">{error.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
