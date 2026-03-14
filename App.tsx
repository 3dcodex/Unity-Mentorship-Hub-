import React, { useEffect, useState, createContext, useContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './src/firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import { useAutoLogout } from './hooks/useAutoLogout';
import { presenceService } from './services/presenceService';
import CookieConsent from './components/CookieConsent';

// Critical pages - loaded immediately
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Lazy load all other pages
const About = lazy(() => import('./pages/About'));
const WhoWeServe = lazy(() => import('./pages/WhoWeServe'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Mentorship = lazy(() => import('./pages/Mentorship'));
const MentorshipBooking = lazy(() => import('./pages/MentorshipBooking'));
const Career = lazy(() => import('./pages/career/Career'));
const QuickChat = lazy(() => import('./pages/QuickChat'));
const ExploreTracks = lazy(() => import('./pages/ExploreTracks'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const MentorMatching = lazy(() => import('./pages/MentorMatching'));
const BookChat = lazy(() => import('./pages/BookChat'));
const Resources = lazy(() => import('./pages/resources/Resources'));
const Community = lazy(() => import('./pages/community/Community'));
const HelpCenterNew = lazy(() => import('./pages/support/HelpCenterNew'));
const FAQPage = lazy(() => import('./pages/support/FAQPage'));
const BlogPage = lazy(() => import('./pages/support/BlogPage'));
const ContactSupport = lazy(() => import('./pages/support/ContactSupport'));
const SessionHistory = lazy(() => import('./pages/SessionHistory'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ResumeBuilderNew = lazy(() => import('./pages/career/ResumeBuilderNew'));
const MockInterview = lazy(() => import('./pages/career/MockInterview'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const LocalTips = lazy(() => import('./pages/LocalTips'));
const PostOpportunity = lazy(() => import('./pages/career/PostOpportunity'));
const CoverLetterTemplates = lazy(() => import('./pages/career/CoverLetterTemplates'));
const LiveEvent = lazy(() => import('./pages/LiveEvent'));
const PendingApproval = lazy(() => import('./pages/PendingApproval'));
const Billing = lazy(() => import('./pages/Billing'));
const ProfileView = lazy(() => import('./pages/ProfileView'));
const Notifications = lazy(() => import('./pages/Notifications'));
const OurImpact = lazy(() => import('./pages/OurImpact'));
const Messages = lazy(() => import('./pages/Messages'));

// AdminRoute must be loaded immediately as it's a wrapper component
import AdminRoute from './components/AdminRoute';

// Admin Pages - lazy loaded
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const UserManagementEnhanced = lazy(() => import('./pages/admin/UserManagementEnhanced'));
const CommunicationCenter = lazy(() => import('./pages/admin/CommunicationCenter'));
const ContentModeration = lazy(() => import('./pages/admin/ContentModeration'));
const SystemHealth = lazy(() => import('./pages/admin/SystemHealth'));
const MentorApprovals = lazy(() => import('./pages/admin/MentorApprovals'));
const SessionManagement = lazy(() => import('./pages/admin/SessionManagement'));
const PaymentManagement = lazy(() => import('./pages/admin/PaymentManagement'));
const ReportsManagement = lazy(() => import('./pages/admin/ReportsManagement'));
const PlatformSettings = lazy(() => import('./pages/admin/PlatformSettings'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdvancedAnalytics = lazy(() => import('./pages/admin/AdvancedAnalytics'));
const ActivityLog = lazy(() => import('./pages/admin/ActivityLog'));
const PayoutManagement = lazy(() => import('./pages/admin/PayoutManagement'));
const ReviewsManagement = lazy(() => import('./pages/admin/ReviewsManagement'));
const NotificationsManagement = lazy(() => import('./pages/admin/NotificationsManagement'));
const NewsletterManagement = lazy(() => import('./pages/admin/NewsletterManagement'));
const SecurityManagement = lazy(() => import('./pages/admin/SecurityManagement'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'));
const AdminPromotion = lazy(() => import('./pages/admin/AdminPromotion'));
const SupportTickets = lazy(() => import('./pages/admin/SupportTickets'));
const GroupManagement = lazy(() => import('./pages/admin/GroupManagement'));
const MyTickets = lazy(() => import('./pages/support/MyTickets'));
const UserHelper = lazy(() => import('./pages/admin/UserHelper'));

// Sub-pages - lazy loaded
const FinancialAid = lazy(() => import('./pages/resources/FinancialAid'));
const AcademicSupport = lazy(() => import('./pages/resources/AcademicSupport'));
const DEIResources = lazy(() => import('./pages/resources/DEIResources'));
const CommunityFeed = lazy(() => import('./pages/community/CommunityFeed'));
const MemberDirectory = lazy(() => import('./pages/community/MemberDirectory'));
const DiscussionGroups = lazy(() => import('./pages/community/DiscussionGroups'));
const GroupDetail = lazy(() => import('./pages/community/GroupDetail'));
const JoinProfessionalTrack = lazy(() => import('./pages/JoinProfessionalTrack'));
const JoinCulturalTrack = lazy(() => import('./pages/JoinCulturalTrack'));
const PeerMentors = lazy(() => import('./pages/PeerMentors'));
const AlumniNetwork = lazy(() => import('./pages/AlumniNetwork'));
const PublicMentorship = lazy(() => import('./pages/PublicMentorship'));
const Search = lazy(() => import('./pages/Search'));
const BecomeMentor = lazy(() => import('./pages/BecomeMentor'));

// Pillar Pages - lazy loaded
const PeerMentorship = lazy(() => import('./pages/PeerMentorship'));
const AccessibleResources = lazy(() => import('./pages/resources/AccessibleResources'));
const SafeSpaces = lazy(() => import('./pages/SafeSpaces'));

// Debug pages
import DebugRole from './pages/DebugRole';
import DiagnosticPage from './pages/DiagnosticPage';

// firebase is initialized in `src/firebase.ts`

type AuthState = { user: User | null; loading: boolean };

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading...
  </div>
);

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const onboardingComplete = localStorage.getItem('unity_onboarding_complete') === 'true';
  const location = useLocation();
  const { user, loading } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);
  useAutoLogout();

  // Check account status removed - no longer needed
  useEffect(() => {
    setCheckingStatus(false);
  }, [loading]);

  if (loading || checkingStatus) {
    return <LoadingFallback />;
  }

  // Protected routes should always require authentication first.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Keep onboarding redirect behavior for authenticated users only.
  if (!onboardingComplete && !['/login', '/signup', '/', '/about', '/who-we-serve', '/mentorship-info', '/peer-mentorship', '/accessible-resources', '/safe-spaces', '/pending-approval'].includes(location.pathname)) {
    localStorage.setItem('unity_onboarding_complete', 'true');
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      // Handle presence tracking
      if (u) {
        presenceService.setUserOnline(u.uid);
        
        // Set offline when page unloads
        const handleBeforeUnload = () => {
          presenceService.setUserOffline(u.uid);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          presenceService.setUserOffline(u.uid);
        };
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthContext.Provider value={{ user, loading }}>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/ourimpact" element={<OurImpact />} />
        <Route path="/who-we-serve" element={<WhoWeServe />} />
        <Route path="/mentorship-info" element={<PublicMentorship />} />
        <Route path="/peer-mentorship" element={<PeerMentorship />} />
        <Route path="/accessible-resources" element={<AccessibleResources />} />
        <Route path="/safe-spaces" element={<SafeSpaces />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/debug-role" element={<ProtectedLayout><DebugRole /></ProtectedLayout>} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/dashboard/tips" element={<ProtectedLayout><LocalTips /></ProtectedLayout>} />
        <Route path="/search" element={<ProtectedLayout><Search /></ProtectedLayout>} />
        
        <Route path="/mentorship" element={<ProtectedLayout><Mentorship /></ProtectedLayout>} />
        <Route path="/mentorship/tracks" element={<ProtectedLayout><ExploreTracks /></ProtectedLayout>} />
        <Route path="/mentorship/how-it-works" element={<ProtectedLayout><HowItWorks /></ProtectedLayout>} />
        <Route path="/mentorship/match" element={<ProtectedLayout><MentorMatching /></ProtectedLayout>} />
        <Route path="/mentorship/book-chat" element={<ProtectedLayout><BookChat /></ProtectedLayout>} />
        <Route path="/mentorship/book" element={<ProtectedLayout><MentorshipBooking /></ProtectedLayout>} />
        <Route path="/mentorship/history" element={<ProtectedLayout><SessionHistory /></ProtectedLayout>} />
        <Route path="/become-mentor" element={<ProtectedLayout><BecomeMentor /></ProtectedLayout>} />
        <Route path="/mentorship/peer-mentors" element={<ProtectedLayout><PeerMentors /></ProtectedLayout>} />
        <Route path="/mentorship/alumni-network" element={<ProtectedLayout><AlumniNetwork /></ProtectedLayout>} />
        <Route path="/mentorship/join-professional" element={<ProtectedLayout><JoinProfessionalTrack /></ProtectedLayout>} />
        <Route path="/mentorship/join-cultural" element={<ProtectedLayout><JoinCulturalTrack /></ProtectedLayout>} />
        
        <Route path="/quick-chat" element={<ProtectedLayout><QuickChat /></ProtectedLayout>} />
        <Route path="/career" element={<ProtectedLayout><Career /></ProtectedLayout>} />
        <Route path="/career/post" element={<ProtectedLayout><PostOpportunity /></ProtectedLayout>} />
        <Route path="/career/resume" element={<ProtectedLayout><ResumeBuilderNew /></ProtectedLayout>} />
        <Route path="/career/cover-letter" element={<ProtectedLayout><CoverLetterTemplates /></ProtectedLayout>} />
        <Route path="/career/mock-interview" element={<ProtectedLayout><MockInterview /></ProtectedLayout>} />
        
        <Route path="/resources" element={<ProtectedLayout><Resources /></ProtectedLayout>} />
        <Route path="/resources/financial-aid" element={<ProtectedLayout><FinancialAid /></ProtectedLayout>} />
        <Route path="/resources/academics" element={<ProtectedLayout><AcademicSupport /></ProtectedLayout>} />
        <Route path="/resources/dei-guides" element={<ProtectedLayout><DEIResources /></ProtectedLayout>} />
        
        <Route path="/community" element={<ProtectedLayout><Community /></ProtectedLayout>} />
        <Route path="/community/feed" element={<ProtectedLayout><CommunityFeed /></ProtectedLayout>} />
        <Route path="/community/directory" element={<ProtectedLayout><MemberDirectory /></ProtectedLayout>} />
        <Route path="/community/groups" element={<ProtectedLayout><DiscussionGroups /></ProtectedLayout>} />
        <Route path="/community/groups/:groupId" element={<ProtectedLayout><GroupDetail /></ProtectedLayout>} />
        <Route path="/community/live" element={<ProtectedLayout><LiveEvent /></ProtectedLayout>} />
        <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
        
        <Route path="/help" element={<ProtectedLayout><HelpCenterNew /></ProtectedLayout>} />
        <Route path="/help/faq" element={<ProtectedLayout><FAQPage /></ProtectedLayout>} />
        <Route path="/blog" element={<ProtectedLayout><BlogPage /></ProtectedLayout>} />
        <Route path="/help/contact" element={<ProtectedLayout><ContactSupport /></ProtectedLayout>} />
        <Route path="/my-tickets" element={<ProtectedLayout><MyTickets /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><ProfileSettings /></ProtectedLayout>} />
        
        <Route path="/profile-view/:userId" element={<ProtectedLayout><ProfileView /></ProtectedLayout>} />
        
        <Route path="/billing" element={<ProtectedLayout><Billing /></ProtectedLayout>} />
        <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
        <Route path="/messages" element={<ProtectedLayout><Messages /></ProtectedLayout>} />
        
        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="/admin/users-enhanced" element={<AdminRoute><UserManagementEnhanced /></AdminRoute>} />
        <Route path="/admin/communication" element={<AdminRoute><CommunicationCenter /></AdminRoute>} />
        <Route path="/admin/moderation" element={<AdminRoute><ContentModeration /></AdminRoute>} />
        <Route path="/admin/system-health" element={<AdminRoute><SystemHealth /></AdminRoute>} />
        <Route path="/admin/mentor-approvals" element={<AdminRoute><MentorApprovals /></AdminRoute>} />
        <Route path="/admin/sessions" element={<AdminRoute><SessionManagement /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><PaymentManagement /></AdminRoute>} />
        <Route path="/admin/payouts" element={<AdminRoute><PayoutManagement /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><ReportsManagement /></AdminRoute>} />
        <Route path="/admin/reviews" element={<AdminRoute><ReviewsManagement /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><PlatformSettings /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
        <Route path="/admin/advanced-analytics" element={<AdminRoute><AdvancedAnalytics /></AdminRoute>} />
        <Route path="/admin/activity-log" element={<AdminRoute><ActivityLog /></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><NotificationsManagement /></AdminRoute>} />
        <Route path="/admin/newsletter" element={<AdminRoute><NewsletterManagement /></AdminRoute>} />
        <Route path="/admin/security" element={<AdminRoute><SecurityManagement /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><CategoryManagement /></AdminRoute>} />
        <Route path="/admin/groups" element={<AdminRoute><GroupManagement /></AdminRoute>} />
        <Route path="/admin/support" element={<AdminRoute><SupportTickets /></AdminRoute>} />
        <Route path="/admin/promotion" element={<AdminRoute><AdminPromotion /></AdminRoute>} />
        <Route path="/admin/mentor-requests" element={<AdminRoute><MentorApprovals /></AdminRoute>} />
        <Route path="/admin/user-helper" element={<AdminRoute><UserHelper /></AdminRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
            </Suspense>
            <CookieConsent />
      </Router>
      </AuthContext.Provider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

// Firebase initialization moved to `src/firebase.ts` to avoid duplicate apps

export default App;
