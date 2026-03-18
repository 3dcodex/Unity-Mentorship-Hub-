import { SubscriptionTier } from '../../types';

export const STRIPE_PRICE_IDS: Record<SubscriptionTier, string> = {
  starter: import.meta.env.VITE_STRIPE_PRICE_STARTER || '',
  'job-ready': import.meta.env.VITE_STRIPE_PRICE_JOB_READY || '',
  'career-accelerator': import.meta.env.VITE_STRIPE_PRICE_CAREER_ACCELERATOR || '',
};

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

const resolveAppUrl = () => {
  const configured = import.meta.env.VITE_APP_URL;
  if (!configured) {
    return window.location.origin;
  }

  const isLocalConfigured = configured.includes('localhost') || configured.includes('127.0.0.1');
  const isCurrentLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalConfigured && !isCurrentLocalhost) {
    return window.location.origin;
  }

  return configured;
};

export const STRIPE_ENV_CONFIG = {
  appUrl: resolveAppUrl(),
  functionsRegion: import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1',
};

export const isPaidTier = (tier: SubscriptionTier): boolean => {
  return tier === 'job-ready' || tier === 'career-accelerator';
};

export const getPriceIdForTier = (tier: SubscriptionTier): string => {
  const priceId = STRIPE_PRICE_IDS[tier];

  if (!priceId && isPaidTier(tier)) {
    throw new Error(`Missing Stripe price ID for ${tier}. Check environment variables.`);
  }

  return priceId;
};
