import { Timestamp } from 'firebase/firestore';

export type Role = 'Student' | 'Professional' | 'admin' | 'super_admin' | 'moderator';

export type AccountStatus = 'active' | 'suspended' | 'pending' | 'deleted';

export type MentorStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface Mentor {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  bio: string;
  imageUrl: string;
  online: boolean;
}

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  imageUrl: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: Role;
  interests: string[];
  onboardingComplete: boolean;
  photoURL?: string;
  phone?: string;
  bio?: string;
  location?: string;
  
  // Social links
  linkedin?: string;
  github?: string;
  website?: string;
  
  // Student fields
  school?: string;
  major?: string;
  university?: string;
  programName?: string;
  year?: string;
  currentYear?: string;
  
  // Professional fields
  company?: string;
  companyName?: string;
  jobTitle?: string;
  industry?: string;
  yearsExperience?: number;
  
  // Mentor fields
  isMentor?: boolean;
  mentorStatus?: MentorStatus;
  mentorExpertise?: string;
  mentorBio?: string;
  mentorPreferredTopics?: string;
  mentorYearsExperience?: number;
  mentorApplicationVersion?: number;
  availability?: string;
  mentorTags?: string[];
  
  // Preferences
  campusInvolvement?: string;
  languagesSpoken?: string;
  notifyCampusEvents?: boolean;
  notifyMentorshipRequests?: boolean;
  notifyCommunityUpdates?: boolean;
  resumeAutoSave?: boolean;
  darkMode?: boolean;
  
  // Complete profile
  skills?: string[];
  certifications?: string[];
  achievements?: string[];
  
  // Billing & Subscription fields
  stripeCustomerId?: string;
  stripeConnectedAccountId?: string; // For mentors receiving payouts
  subscriptionTier?: 'starter' | 'job-ready' | 'career-accelerator';
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'paused';
  subscriptionMentorId?: string | null;
  pendingSubscriptionTier?: 'starter' | 'job-ready' | 'career-accelerator' | null;
  pendingSubscriptionMentorId?: string | null;
  sessionsPerMonth?: number;
  sessionsUsedThisMonth?: number;
  billingSetupComplete?: boolean;
  paymentMethodOnFile?: boolean;
  subscriptionUpdatedAt?: Timestamp;
  subscriptionLastBookedAt?: Timestamp;
  
  // System fields
  accountStatus?: AccountStatus;
  status?: AccountStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActive?: Timestamp;
  deletedAt?: Timestamp;
  isDeleted?: boolean;
}

export interface MentorApplication {
  userId: string;
  name: string;
  email: string;
  expertise: string[];
  credentials: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Timestamp;
  documents: string[];
  adminNotes: string;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

export interface SecurityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  ipAddress: string;
  timestamp: Timestamp;
  status: 'success' | 'failed' | 'suspicious';
  userAgent?: string;
  details?: string;
}

export interface EmailLog {
  id: string;
  to: string[];
  from: string;
  subject: string;
  body: string;
  sentAt: Timestamp;
  sentBy: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}

export interface AdminAction {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  details: string;
  timestamp: Timestamp;
  ipAddress?: string;
}

export interface UserNote {
  id: string;
  userId: string;
  adminId: string;
  adminName: string;
  category: 'general' | 'support' | 'warning' | 'positive';
  content: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserTag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  published: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
}

export interface SessionData {
  id: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  scheduledAt: Timestamp;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: Timestamp;
}

export interface AnalyticsData {
  date: Timestamp;
  metric: string;
  value: number;
  category?: string;
}

// ===== BILLING & SUBSCRIPTION TYPES =====

export type SubscriptionTier = 'starter' | 'job-ready' | 'career-accelerator';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'paused' | 'trialing';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  mentorId: string;
  mentorName: string;
  
  // Plan details
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  priceMonthly: number; // 0, 45, 95
  sessionsPerMonth: number; // 1, 2, 4
  sessionsRemaining: number;
  
  // Stripe data
  stripeCustomerId: string;
  stripeSubscriptionId?: string; // null for free tier
  stripePriceId?: string;
  
  // Billing period
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  billingCycleAnchor: Timestamp;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastPaymentDate?: Timestamp;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  subtitle: string;
  priceMonthly: number;
  sessionsPerMonth: number;
  features: string[];
  popular: boolean;
  stripePriceId?: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  mentorId: string;
  mentorName: string;
  
  // Amounts (in dollars)
  totalAmount: number; // Full subscription price
  mentorAmount: number; // 85% to mentor
  platformFee: number; // 15% to platform
  
  // Stripe
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  stripeInvoiceId?: string;
  
  // Status
  status: PaymentStatus;
  failureReason?: string;
  refundReason?: string;
  refundedAmount?: number;
  
  // Billing period this payment covers
  billingPeriodStart: Timestamp;
  billingPeriodEnd: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  paidAt?: Timestamp;
  refundedAt?: Timestamp;
}

export interface MentorPayout {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  
  // Amounts
  totalAmount: number; // Sum of all mentorAmount from payments
  paymentIds: string[]; // References to payment documents
  subscriptionCount: number; // Number of active subscriptions
  
  // Stripe Connect
  stripeConnectedAccountId: string;
  stripePayoutId?: string;
  stripeDestination?: string; // bank account last4
  
  // Status
  status: PayoutStatus;
  failureReason?: string;
  
  // Payout period
  periodStart: Timestamp;
  periodEnd: Timestamp;
  scheduledDate: Timestamp;
  paidDate?: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SessionBooking {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  mentorId: string;
  mentorName: string;
  
  // Session details
  sessionType: string;
  sessionDuration: number; // in minutes
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  studentNotes?: string;
  
  // Pricing (for one-time payments outside subscriptions)
  price?: number;
  platformFee?: number;
  totalAmount?: number;
  
  // Status
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  
  // Subscription linkage
  subscriptionId?: string; // Link to subscription if booked through one
  deductedFromQuota: boolean;
  quotaDeductedAt?: Timestamp;
  
  // Additional
  meetingLink?: string;
  paymentIntentId?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelledAt?: Timestamp;
  completedAt?: Timestamp;
  cancellationReason?: string;
  
  // Reminders
  reminderSent24h?: boolean;
  reminderSent1h?: boolean;
}

export interface BillingTransaction {
  id: string;
  userId: string;
  type: 'subscription' | 'session' | 'refund' | 'payout';
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  stripeReference?: string;
  subscriptionId?: string;
  paymentId?: string;
  createdAt: Timestamp;
}

// Error handling types
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: Timestamp;
}

// Form error type for better error handling
export type FormError = {
  field: string;
  message: string;
} | null;
