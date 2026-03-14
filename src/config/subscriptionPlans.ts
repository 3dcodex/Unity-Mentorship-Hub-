import { SubscriptionPlan } from '../../types';

/**
 * Subscription plan configurations for Unity Mentorship Hub
 * 
 * Business Model:
 * - Students subscribe to tiers
 * - Mentors receive 85% of subscription revenue
 * - Platform retains 15% commission
 */

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'STARTER',
    subtitle: 'Career Clarity Session',
    priceMonthly: 0,
    sessionsPerMonth: 1,
    popular: false,
    features: [
      '1 Career Clarity Session',
      'Industry pathway discussion',
      'Skills gap identification',
      'Job-readiness assessment',
      'Mentor matching guidance',
    ],
    // No Stripe price ID for free tier
  },
  {
    id: 'job-ready',
    name: 'JOB-READY',
    subtitle: 'Structured Employment Preparation',
    priceMonthly: 45,
    sessionsPerMonth: 2,
    popular: true,
    features: [
      'Biweekly 1-on-1 Mentorship Sessions (2/month)',
      'CV & LinkedIn Optimization',
      'Target Job Strategy Planning',
      'Interview Preparation',
      'Application Review & Feedback',
      'Industry Resources & Hiring Tips',
      'FREE Monthly Networking Events',
      'Job Application Accountability',
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_JOB_READY || '', // Set in .env
  },
  {
    id: 'career-accelerator',
    name: 'CAREER ACCELERATOR',
    subtitle: 'Fast-Track to Employment',
    priceMonthly: 95,
    sessionsPerMonth: 4,
    popular: false,
    features: [
      'Everything in Job-Ready PLUS:',
      'Weekly Mentorship Sessions (4/month)',
      'Personalized Career Strategy Plan',
      'Advanced CV & Portfolio Review',
      'Intensive Mock Interviews',
      'Priority Mentor Access',
      'Referral & Industry Introduction Support',
      'VIP Networking Access',
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_CAREER_ACCELERATOR || '', // Set in .env
  },
];

/**
 * Get plan configuration by tier ID
 */
export const getPlanByTier = (tier: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === tier);
};

/**
 * Calculate commission split (85% mentor, 15% platform)
 */
export const calculateCommissionSplit = (amount: number) => {
  const mentorAmount = amount * 0.85;
  const platformFee = amount * 0.15;
  
  return {
    mentorAmount: Number(mentorAmount.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
  };
};

/**
 * Commission rates
 */
export const COMMISSION_RATES = {
  MENTOR_PERCENTAGE: 0.85, // 85% to mentor
  PLATFORM_PERCENTAGE: 0.15, // 15% platform fee
} as const;

/**
 * Session quota rules
 */
export const QUOTA_RULES = {
  RESET_ON_RENEWAL: true,
  ALLOW_OVERAGE: false, // Don't allow booking when quota exhausted
  OVERAGE_PRICE_PER_SESSION: 25, // Price if we allow overages in future
} as const;

/**
 * Billing cycle constants
 */
export const BILLING_CONSTANTS = {
  TRIAL_PERIOD_DAYS: 0, // No trial for now
  GRACE_PERIOD_DAYS: 3, // Days before canceling for failed payment
  PAYOUT_SCHEDULE_DAY: 1, // 1st of each month
  MIN_PAYOUT_AMOUNT: 25, // Minimum amount to trigger payout
} as const;
