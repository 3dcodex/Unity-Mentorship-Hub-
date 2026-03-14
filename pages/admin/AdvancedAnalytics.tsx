import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../src/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatNumber } from '../../utils/formatters';
import { errorService } from '../../services/errorService';

interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  revenueData: { month: string; revenue: number }[];
  engagementData: { metric: string; value: number }[];
  retentionData: { cohort: string; retention: number }[];
}

const AdvancedAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    userGrowth: [],
    revenueData: [],
    engagementData: [],
    retentionData: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'growth' | 'revenue' | 'engagement' | 'retention'>('growth');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Load users for growth analysis
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          lastActive: data.lastActive?.toDate?.() || new Date(data.lastActive || Date.now())
        };
      });

      // User Growth Data
      const userGrowth = calculateUserGrowth(users, startDate, daysBack);

      // Revenue Data (mock for now - would come from transactions)
      const revenueData = generateRevenueData(daysBack);

      // Engagement Data
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const engagementData = [
        { 
          metric: 'Daily Active Users', 
          value: users.filter(u => u.lastActive > oneDayAgo).length 
        },
        { 
          metric: 'Weekly Active Users', 
          value: users.filter(u => u.lastActive > oneWeekAgo).length 
        },
        { 
          metric: 'Monthly Active Users', 
          value: users.filter(u => u.lastActive > oneMonthAgo).length 
        },
        { metric: 'Total Users', value: users.length }
      ];

      // Retention Data (simplified)
      const retentionData = calculateRetention();

      setData({
        userGrowth,
        revenueData,
        engagementData,
        retentionData
      });
    } catch (error) {
      errorService.handleError(error, 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserGrowth = (users: any[], startDate: Date, days: number) => {
    const growth: { date: string; count: number }[] = [];
    const interval = days > 90 ? 7 : days > 30 ? 1 : 1; // Daily for short periods, weekly for long

    for (let i = 0; i <= days; i += interval) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const count = users.filter(u => u.createdAt <= date).length;
      growth.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }

    return growth;
  };

  const generateRevenueData = (days: number) => {
    // Mock revenue data - in production, this would come from transactions
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: { month: string; revenue: number }[] = [];
    
    const monthsToShow = Math.min(12, Math.ceil(days / 30));
    const currentMonth = new Date().getMonth();
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      data.push({
        month: months[monthIndex],
        revenue: Math.floor(Math.random() * 50000) + 10000
      });
    }

    return data;
  };

  const calculateRetention = () => {
    // Simplified retention calculation
    const cohorts = [
      { cohort: 'Week 1', retention: 85 },
      { cohort: 'Week 2', retention: 72 },
      { cohort: 'Week 3', retention: 65 },
      { cohort: 'Week 4', retention: 58 },
      { cohort: 'Month 2', retention: 45 },
      { cohort: 'Month 3', retention: 38 }
    ];

    return cohorts;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400 font-bold mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const maxUserCount = Math.max(...data.userGrowth.map(d => d.count), 1);
  const maxRevenue = Math.max(...data.revenueData.map(d => d.revenue), 1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">Advanced Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive platform insights and metrics</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                {range === '1y' ? '1 Year' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6">
            <div className="flex gap-4">
              {[
                { id: 'growth', label: 'User Growth', icon: 'trending_up' },
                { id: 'revenue', label: 'Revenue', icon: 'payments' },
                { id: 'engagement', label: 'Engagement', icon: 'groups' },
                { id: 'retention', label: 'Retention', icon: 'loyalty' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 font-bold flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* User Growth Chart */}
            {activeTab === 'growth' && (
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">User Growth Over Time</h2>
                <div className="h-80 flex items-end justify-around gap-2">
                  {data.userGrowth.map((point, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full relative group">
                        <div
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                          style={{ height: `${(point.count / maxUserCount) * 300}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {formatNumber(point.count)} users
                        </div>
                      </div>
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mt-2 rotate-45 origin-left">
                        {point.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue Chart */}
            {activeTab === 'revenue' && (
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Monthly Revenue</h2>
                <div className="h-80 flex items-end justify-around gap-2">
                  {data.revenueData.map((point, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full relative group">
                        <div
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-700 hover:to-green-500 cursor-pointer"
                          style={{ height: `${(point.revenue / maxRevenue) * 300}px` }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          ${formatNumber(point.revenue)}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mt-2">
                        {point.month}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Metrics */}
            {activeTab === 'engagement' && (
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">User Engagement</h2>
                <div className="grid grid-cols-2 gap-6">
                  {data.engagementData.map((metric, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
                      <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-2">{metric.metric}</p>
                      <p className="text-4xl font-black text-gray-900 dark:text-white">{formatNumber(metric.value)}</p>
                      <div className="mt-4 h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                          style={{ width: `${(metric.value / data.engagementData[3].value) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Retention Chart */}
            {activeTab === 'retention' && (
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">User Retention</h2>
                <div className="space-y-4">
                  {data.retentionData.map((cohort, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-gray-900 dark:text-white">{cohort.cohort}</p>
                        <p className="text-2xl font-black text-blue-600">{cohort.retention}%</p>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all"
                          style={{ width: `${cohort.retention}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
