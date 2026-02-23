import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../src/firebase';

const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    activeMentors: 0,
    totalSessions: 0,
    completedSessions: 0,
    monthlyRevenue: 0,
    growthRate: 0,
    conversionRate: 0
  });

  const [categoryStats, setCategoryStats] = useState<{[key: string]: number}>({});

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const sessionsSnap = await getDocs(collection(db, 'sessions'));
    const transSnap = await getDocs(collection(db, 'transactions'));

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newUsersThisMonth = usersSnap.docs.filter(doc => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt >= firstDayOfMonth;
    }).length;

    const completedSessions = sessionsSnap.docs.filter(doc => doc.data().status === 'completed').length;
    const monthlyRevenue = transSnap.docs
      .filter(doc => doc.data().status === 'completed')
      .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

    setStats({
      totalUsers: usersSnap.size,
      newUsersThisMonth,
      activeMentors: usersSnap.docs.filter(d => d.data().role === 'mentor').length,
      totalSessions: sessionsSnap.size,
      completedSessions,
      monthlyRevenue,
      growthRate: ((newUsersThisMonth / usersSnap.size) * 100),
      conversionRate: ((completedSessions / sessionsSnap.size) * 100) || 0
    });

    const categories: {[key: string]: number} = {};
    sessionsSnap.docs.forEach(doc => {
      const category = doc.data().category || 'Other';
      categories[category] = (categories[category] || 0) + 1;
    });
    setCategoryStats(categories);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Analytics Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-500">Total Users</p>
              <span className="material-symbols-outlined text-blue-600">group</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.totalUsers}</p>
            <p className="text-sm text-green-600 font-bold mt-2">+{stats.newUsersThisMonth} this month</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-500">Active Mentors</p>
              <span className="material-symbols-outlined text-green-600">school</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.activeMentors}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-500">Total Sessions</p>
              <span className="material-symbols-outlined text-purple-600">event</span>
            </div>
            <p className="text-3xl font-black text-gray-900">{stats.totalSessions}</p>
            <p className="text-sm text-gray-600 mt-2">{stats.completedSessions} completed</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-500">Monthly Revenue</p>
              <span className="material-symbols-outlined text-yellow-600">attach_money</span>
            </div>
            <p className="text-3xl font-black text-gray-900">${stats.monthlyRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Key Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="font-bold text-gray-700">Growth Rate</span>
                <span className="text-2xl font-black text-green-600">{stats.growthRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="font-bold text-gray-700">Conversion Rate</span>
                <span className="text-2xl font-black text-blue-600">{stats.conversionRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="font-bold text-gray-700">Avg Revenue/Session</span>
                <span className="text-2xl font-black text-purple-600">
                  ${stats.totalSessions > 0 ? (stats.monthlyRevenue / stats.totalSessions).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Popular Categories</h2>
            <div className="space-y-3">
              {Object.entries(categoryStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-bold text-gray-700">{category}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600"
                          style={{width: `${(count / stats.totalSessions) * 100}%`}}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-600 w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Revenue Trend</h2>
          <div className="h-64 flex items-end justify-around gap-2">
            {[65, 78, 82, 90, 88, 95, 100].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-700 hover:to-green-500"
                  style={{height: `${height}%`}}
                />
                <p className="text-xs font-bold text-gray-600 mt-2">Week {idx + 1}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
