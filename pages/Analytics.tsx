
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { db } from '../src/firebase';
import { useAuth } from '../App';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface AnalyticsData {
  totalSessions: number;
  totalConnections: number;
  careerReadiness: number;
  deiEngagement: number;
  networkReach: number;
  monthlyData: Array<{
    month: string;
    connections: number;
    sessions: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    date: any;
  }>;
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalSessions: 0,
    totalConnections: 0,
    careerReadiness: 0,
    deiEngagement: 0,
    networkReach: 0,
    monthlyData: [
      { month: 'Aug', connections: 4, sessions: 2 },
      { month: 'Sep', connections: 8, sessions: 5 },
      { month: 'Oct', connections: 12, sessions: 9 },
    ],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Count mentor connections
          const connectionsSnap = await getDocs(
            query(collection(db, 'mentorships'), where('menteeId', '==', user.uid))
          );
          
          // Count chat sessions
          const chatsSnap = await getDocs(
            query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid))
          );
          
          // Fetch recent activities
          const activitiesSnap = await getDocs(
            query(collection(db, 'activities'), where('userId', '==', user.uid))
          );
          
          const recentActivities = activitiesSnap.docs
            .map(doc => ({
              id: doc.id,
              type: doc.data().type,
              description: doc.data().description,
              date: doc.data().timestamp
            }))
            .slice(0, 5);

          setAnalyticsData(prev => ({
            ...prev,
            totalSessions: chatsSnap.size,
            totalConnections: connectionsSnap.size,
            careerReadiness: userData.careerReadiness || 45,
            deiEngagement: userData.deiEngagement || 89,
            networkReach: userData.networkReach || 72,
            recentActivities
          }));
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return <div className="animate-pulse space-y-6 pb-20">Loading analytics...</div>;
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12 pb-20">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Community Analytics</h1>
        <p className="text-gray-600 text-sm sm:text-base font-medium">Your mentorship journey and growth metrics</p>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          icon="people_alt" 
          label="Total Connections" 
          value={analyticsData.totalConnections}
          color="primary"
          trend={+12}
        />
        <MetricCard 
          icon="chat" 
          label="Sessions Completed" 
          value={analyticsData.totalSessions}
          color="secondary"
          trend={+8}
        />
        <MetricCard 
          icon="trending_up" 
          label="Career Readiness" 
          value={analyticsData.careerReadiness}
          color="emerald"
          trend={+5}
          percent
        />
        <MetricCard 
          icon="favorite" 
          label="DEI Engagement" 
          value={analyticsData.deiEngagement}
          color="rose"
          trend={+15}
          percent
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black">Engagement Growth</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="size-3 bg-primary rounded-full"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Connections</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 bg-secondary rounded-full"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sessions</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="connections" fill="#1392ec" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="sessions" fill="#0047AB" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Progress Card */}
          <div className="bg-gray-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white space-y-6">
            <h2 className="text-lg sm:text-xl font-black">Your Progress</h2>
            <div className="space-y-6">
              <ProgressCircle label="Network Reach" value={analyticsData.networkReach} />
              <ProgressCircle label="Career Readiness" value={analyticsData.careerReadiness} />
              <ProgressCircle label="DEI Engagement" value={analyticsData.deiEngagement} />
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl font-black">auto_awesome</span>
              <h3 className="text-lg font-black">AI Insight</h3>
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              {analyticsData.totalSessions > 10 
                ? `You're in the top 10% of engaged mentees! Your ${analyticsData.totalSessions} sessions show strong commitment to your growth.`
                : `Complete more mentorship sessions to unlock personalized insights based on your engagement pattern.`}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      {analyticsData.recentActivities.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-lg sm:text-xl font-black mb-6">Recent Activities</h2>
          <div className="space-y-3">
            {analyticsData.recentActivities.map(activity => (
              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-all">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">
                    {activity.type === 'session' ? 'chat' : activity.type === 'connection' ? 'people_alt' : 'check_circle'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.date?.toDate?.()?.toLocaleDateString?.() || new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ 
  icon: string; 
  label: string; 
  value: number; 
  color: string;
  trend: number;
  percent?: boolean;
}> = ({ icon, label, value, color, trend, percent }) => {
  const colorMap: Record<string, string> = {
    primary: 'bg-blue-50 text-blue-600',
    secondary: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3 hover:shadow-md transition-all">
      <div className={`size-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <span className="material-symbols-outlined">{ icon}</span>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}{percent? '%' : ''}</p>
      </div>
      <p className={`text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
      </p>
    </div>
  );
};

const ProgressCircle: React.FC<{ label: string, value: number }> = ({ label, value }) => (
  <div className="space-y-3">
     <div className="flex justify-between items-end">
        <span className="text-xs font-bold text-gray-400">{label}</span>
        <span className="text-sm font-black">{value}%</span>
     </div>
     <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{width: `${value}%`}}></div>
     </div>
  </div>
);

export default Analytics;
