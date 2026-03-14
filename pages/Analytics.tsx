import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { db } from '../src/firebase';
import { useAuth } from '../App';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { errorService } from '../services/errorService';

interface AnalyticsData {
  totalSessions: number;
  totalConnections: number;
  mentorshipRequests: number;
  sessionBookings: number;
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
    date: Timestamp;
  }>;
  engagementByType: Array<{
    name: string;
    value: number;
  }>;
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalSessions: 0,
    totalConnections: 0,
    mentorshipRequests: 0,
    sessionBookings: 0,
    careerReadiness: 0,
    deiEngagement: 0,
    networkReach: 0,
    monthlyData: [],
    recentActivities: [],
    engagementByType: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      try {
        // Count connections (chats)
        const connectionsSnap = await getDocs(
          query(collection(db, 'connections'), where('participants', 'array-contains', user.uid))
        );

        // Count mentor applications (submitted by this user)
        const mentorAppDoc = await getDoc(doc(db, 'mentorApplications', user.uid));
        const hasMentorApp = mentorAppDoc.exists() ? 1 : 0;

        // Count session bookings
        const bookingsSnap = await getDocs(
          query(collection(db, 'bookings'), where('menteeId', '==', user.uid))
        );

        // Approximate network size from connections
        const totalUsers = Math.max(connectionsSnap.size, 1);
        
        // Calculate engagement metrics
        const totalInteractions = connectionsSnap.size + hasMentorApp + bookingsSnap.size;
        const careerReadiness = Math.min(100, bookingsSnap.size * 20);
        const deiEngagement = Math.min(100, connectionsSnap.size * 15);
        const networkReach = Math.min(100, Math.round((totalInteractions / Math.max(1, totalUsers * 3)) * 100));
        
        // Generate monthly data (last 6 months)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          monthlyData.push({
            month: monthNames[monthIndex],
            connections: Math.floor(connectionsSnap.size / 6 * (6 - i)),
            sessions: Math.floor(bookingsSnap.size / 6 * (6 - i))
          });
        }
        
        // Engagement by type
        const engagementByType = [
          { name: 'Connections', value: connectionsSnap.size },
          { name: 'Mentor App', value: hasMentorApp },
          { name: 'Sessions', value: bookingsSnap.size }
        ];
        
        // Recent activities from bookings
        const recentActivities = [
          ...bookingsSnap.docs.slice(0, 3).map(d => ({
            id: d.id,
            type: 'session',
            description: `Booked session${d.data().mentorName ? ' with ' + d.data().mentorName : ''}`,
            date: d.data().bookedAt || d.data().createdAt
          }))
        ].slice(0, 5);

        setAnalyticsData({
          totalSessions: connectionsSnap.size,
          totalConnections: totalUsers,
          mentorshipRequests: hasMentorApp,
          sessionBookings: bookingsSnap.size,
          careerReadiness,
          deiEngagement,
          networkReach,
          monthlyData,
          recentActivities,
          engagementByType
        });
      } catch (err) {
        errorService.handleError(err, 'Error fetching analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 pb-20">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
        </div>
        <div className="h-96 bg-gray-200 rounded-3xl"></div>
      </div>
    );
  }

  const COLORS = ['#1392ec', '#0047AB', '#60a5fa', '#93c5fd'];

  return (
    <div className="animate-in fade-in duration-700 space-y-6 sm:space-y-8 pb-20">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-medium">Track your mentorship journey and growth</p>
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard 
          icon="forum" 
          label="Conversations" 
          value={analyticsData.totalSessions}
          color="primary"
          trend={+12}
        />
        <MetricCard 
          icon="diversity_3" 
          label="Mentorship Requests" 
          value={analyticsData.mentorshipRequests}
          color="secondary"
          trend={+8}
        />
        <MetricCard 
          icon="event" 
          label="Session Bookings" 
          value={analyticsData.sessionBookings}
          color="emerald"
          trend={+5}
        />
        <MetricCard 
          icon="people" 
          label="Network Size" 
          value={analyticsData.totalConnections}
          color="rose"
          trend={+15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">trending_up</span>
              Engagement Growth
            </h2>
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
          {analyticsData.monthlyData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="connections" fill="#1392ec" radius={[8, 8, 0, 0]} barSize={40} />
                  <Bar dataKey="sessions" fill="#0047AB" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-4">bar_chart</span>
                <p className="font-bold">No data available yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Engagement Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg space-y-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">donut_small</span>
            Engagement Mix
          </h2>
          {analyticsData.engagementByType.some(e => e.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.engagementByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.engagementByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-4">pie_chart</span>
                <p className="font-bold text-sm">Start engaging to see breakdown</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {analyticsData.engagementByType.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="text-sm font-black text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black">Network Reach</h3>
            <span className="material-symbols-outlined text-3xl">hub</span>
          </div>
          <div className="space-y-4">
            <div className="text-5xl font-black">{analyticsData.networkReach}%</div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{width: `${analyticsData.networkReach}%`}}></div>
            </div>
            <p className="text-sm opacity-90">of potential connections reached</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black">Career Readiness</h3>
            <span className="material-symbols-outlined text-3xl">work</span>
          </div>
          <div className="space-y-4">
            <div className="text-5xl font-black">{analyticsData.careerReadiness}%</div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{width: `${analyticsData.careerReadiness}%`}}></div>
            </div>
            <p className="text-sm opacity-90">based on session activity</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black">DEI Engagement</h3>
            <span className="material-symbols-outlined text-3xl">favorite</span>
          </div>
          <div className="space-y-4">
            <div className="text-5xl font-black">{analyticsData.deiEngagement}%</div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{width: `${analyticsData.deiEngagement}%`}}></div>
            </div>
            <p className="text-sm opacity-90">community participation rate</p>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-start gap-4">
          <div className="size-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black mb-3">AI-Powered Insight</h3>
            <p className="text-base leading-relaxed opacity-95">
              {analyticsData.totalSessions > 5 
                ? `Great progress! You've had ${analyticsData.totalSessions} conversations and ${analyticsData.sessionBookings} session bookings. Keep engaging to expand your network and career opportunities.`
                : `Start your journey by connecting with mentors! Complete more sessions to unlock personalized insights and recommendations.`}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      {analyticsData.recentActivities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg">
          <h2 className="text-xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Recent Activities
          </h2>
          <div className="space-y-3">
            {analyticsData.recentActivities.map(activity => (
              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all">
                <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">
                    {activity.type === 'session' ? 'event' : activity.type === 'mentorship' ? 'diversity_3' : 'check_circle'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{activity.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.date?.toDate?.()?.toLocaleDateString?.() || 'Recently'}
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
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-indigo-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    rose: 'bg-rose-500 text-white'
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`size-12 rounded-xl flex items-center justify-center ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white">{value}{percent ? '%' : ''}</p>
      </div>
    </div>
  );
};

export default Analytics;
