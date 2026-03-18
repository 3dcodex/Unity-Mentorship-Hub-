import { SubscriptionPlan } from '../../types';

/**
 * Subscription plan configurations for Unity Mentorship Hub
 *
 * Business Model:
 * - Students subscribe to tiers
 * - Mentors receive 85% of subscription revenue
 * - Platform retains 15% commission
 */

export interface SubscriptionPlanUI extends SubscriptionPlan {
  color: string;
  period: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanUI[] = [
  {
    id: 'starter',
    name: 'STARTER',
    subtitle: 'Career Clarity Session',
    priceMonthly: 0,
    sessionsPerMonth: 1,
    popular: false,
    color: 'from-gray-500 to-gray-600',
    period: 'month',
    features: [
      '1 Career Clarity Session',
      'Industry pathway discussion',
      'Skills gap identification',
      'Job-readiness assessment',
      'Mentor matching guidance',
    ],
  },
  {
    id: 'job-ready',
    name: 'JOB-READY',
    subtitle: 'Structured Employment Preparation',
    priceMonthly: 45,
    sessionsPerMonth: 2,
    popular: true,
    color: 'from-blue-500 to-indigo-600',
    period: 'month',
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
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_JOB_READY || '',
  },
  {
    id: 'career-accelerator',
    name: 'CAREER ACCELERATOR',
    subtitle: 'Fast-Track to Employment',
    priceMonthly: 95,
    sessionsPerMonth: 4,
    popular: false,
    color: 'from-purple-500 to-pink-600',
    period: 'month',
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
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_CAREER_ACCELERATOR || '',
  },
];

/**
 * Get plan configuration by tier ID
 */
export const getPlanByTier = (tier: string): SubscriptionPlanUI | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === tier);
};

/**
 * Commission rates
 */
export const COMMISSION_RATES = {
  MENTOR_PERCENTAGE: 0.85,
  PLATFORM_PERCENTAGE: 0.15,
} as const;

/**
 * Calculate commission split (85% mentor, 15% platform)
 */
export const calculateCommissionSplit = (amount: number) => {
  const mentorAmount = amount * COMMISSION_RATES.MENTOR_PERCENTAGE;
  const platformFee = amount * COMMISSION_RATES.PLATFORM_PERCENTAGE;

  return {
    mentorAmount: Number(mentorAmount.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
  };
};

/**
 * Session quota rules
 */
export const QUOTA_RULES = {
  RESET_ON_RENEWAL: true,
  ALLOW_OVERAGE: false,
  OVERAGE_PRICE_PER_SESSION: 25,
} as const;

/**
 * Billing cycle constants
 */
export const BILLING_CONSTANTS = {
  TRIAL_PERIOD_DAYS: 0,
  GRACE_PERIOD_DAYS: 3,
  PAYOUT_SCHEDULE_DAY: 1,
  MIN_PAYOUT_AMOUNT: 25,
} as const;
