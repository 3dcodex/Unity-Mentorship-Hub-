import React, { useEffect, useState, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './src/firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import About from './pages/About';
import WhoWeServe from './pages/WhoWeServe';
import Dashboard from './pages/Dashboard';
import Mentorship from './pages/Mentorship';
import MentorshipBooking from './pages/MentorshipBooking';
import Career from './pages/Career';
import QuickChat from './pages/QuickChat';
import ExploreTracks from './pages/ExploreTracks';
import HowItWorks from './pages/HowItWorks';
import MentorMatching from './pages/MentorMatching';
import BookChat from './pages/BookChat';
import Resources from './pages/Resources';
import Community from './pages/Community';
import HelpCenterNew from './pages/HelpCenterNew';
import FAQPage from './pages/FAQPage';
import BlogPage from './pages/BlogPage';
import ContactSupport from './pages/ContactSupport';
import SessionHistory from './pages/SessionHistory';
import Analytics from './pages/Analytics';
import ResumeBuilderNew from './pages/ResumeBuilderNew';
import MockInterview from './pages/MockInterview';
import ProfileSettings from './pages/ProfileSettings';
import LocalTips from './pages/LocalTips';
import PostOpportunity from './pages/PostOpportunity';
import CoverLetterTemplates from './pages/CoverLetterTemplates';
import LiveEvent from './pages/LiveEvent';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Billing from './pages/Billing';
import ProfileView from './pages/ProfileView';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import AdminRoute from './components/AdminRoute';
import AdminDebug from './pages/AdminDebug';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import MentorApprovals from './pages/admin/MentorApprovals';
import SessionManagement from './pages/admin/SessionManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import ReportsManagement from './pages/admin/ReportsManagement';
import PlatformSettings from './pages/admin/PlatformSettings';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import PayoutManagement from './pages/admin/PayoutManagement';
import ReviewsManagement from './pages/admin/ReviewsManagement';
import NotificationsManagement from './pages/admin/NotificationsManagement';
import SecurityManagement from './pages/admin/SecurityManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import AdminPromotion from './pages/admin/AdminPromotion';
import SupportTickets from './pages/admin/SupportTickets';
import BecomeMentor from './pages/BecomeMentor';
import MyTickets from './pages/MyTickets';
import AdminSetup from './pages/AdminSetup';
import FixAdmin from './pages/FixAdmin';

// New Sub-pages
import FinancialAid from './pages/FinancialAid';
import AcademicSupport from './pages/AcademicSupport';
import DEIResources from './pages/DEIResources';
import CommunityFeed from './pages/CommunityFeed';
import MemberDirectory from './pages/MemberDirectory';
import DiscussionGroups from './pages/DiscussionGroups';
import JoinProfessionalTrack from './pages/JoinProfessionalTrack';
import JoinCulturalTrack from './pages/JoinCulturalTrack';
import PublicMentorship from './pages/PublicMentorship';
import Search from './pages/Search';

// Pillar Pages
import PeerMentorship from './pages/PeerMentorship';
import AccessibleResources from './pages/AccessibleResources';
import SafeSpaces from './pages/SafeSpaces';

// firebase is initialized in `src/firebase.ts`

type AuthState = { user: User | null; loading: boolean };

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const onboardingComplete = localStorage.getItem('unity_onboarding_complete') === 'true';
  const location = useLocation();
  const { user, loading } = useAuth();

  // Keep onboarding redirect behavior
  if (!onboardingComplete && !['/login', '/signup', '/', '/about', '/who-we-serve', '/mentorship-info', '/peer-mentorship', '/accessible-resources', '/safe-spaces'].includes(location.pathname)) {
    return <Navigate to="/signup" replace />;
  }

  // If not loading and no user, redirect to login
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
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
    });
    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, loading }}>
        <Router>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/who-we-serve" element={<WhoWeServe />} />
        <Route path="/mentorship-info" element={<PublicMentorship />} />
        <Route path="/peer-mentorship" element={<PeerMentorship />} />
        <Route path="/accessible-resources" element={<AccessibleResources />} />
        <Route path="/safe-spaces" element={<SafeSpaces />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route path="/fix-admin" element={<FixAdmin />} />
        
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
        <Route path="/admin-debug" element={<ProtectedLayout><AdminDebug /></ProtectedLayout>} />
        
        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="/admin/mentor-approvals" element={<AdminRoute><MentorApprovals /></AdminRoute>} />
        <Route path="/admin/sessions" element={<AdminRoute><SessionManagement /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><PaymentManagement /></AdminRoute>} />
        <Route path="/admin/payouts" element={<AdminRoute><PayoutManagement /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><ReportsManagement /></AdminRoute>} />
        <Route path="/admin/reviews" element={<AdminRoute><ReviewsManagement /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><PlatformSettings /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><NotificationsManagement /></AdminRoute>} />
        <Route path="/admin/security" element={<AdminRoute><SecurityManagement /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><CategoryManagement /></AdminRoute>} />
        <Route path="/admin/support" element={<AdminRoute><SupportTickets /></AdminRoute>} />
        <Route path="/admin/promotion" element={<AdminRoute><AdminPromotion /></AdminRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

// Firebase initialization moved to `src/firebase.ts` to avoid duplicate apps

export default App;
