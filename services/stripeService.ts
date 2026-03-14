import { httpsCallable, getFunctions } from 'firebase/functions';
import { app } from '../src/firebase';
import { SubscriptionTier } from '../types';
import { STRIPE_ENV_CONFIG, getPriceIdForTier, isPaidTier } from '../src/config/stripe';
import { errorService } from './errorService';

interface CreateCheckoutSessionPayload {
  tier: SubscriptionTier;
  mentorId: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl?: string;
}

interface BillingPortalResponse {
  url: string;
}

interface ConnectOnboardingResponse {
  url: string;
}

const functions = getFunctions(app, STRIPE_ENV_CONFIG.functionsRegion);

export const stripeService = {
  /**
   * Creates Stripe Checkout for paid tiers.
   */
  async createCheckoutSession(payload: CreateCheckoutSessionPayload): Promise<CheckoutSessionResponse> {
    try {
      if (!isPaidTier(payload.tier)) {
        throw new Error('Checkout is only required for paid tiers');
      }

      const callable = httpsCallable<CreateCheckoutSessionPayload & { priceId: string }, CheckoutSessionResponse>(
        functions,
        'createStripeCheckoutSession'
      );

      const result = await callable({
        ...payload,
        priceId: getPriceIdForTier(payload.tier),
        successUrl: payload.successUrl || `${STRIPE_ENV_CONFIG.appUrl}/billing?status=success`,
        cancelUrl: payload.cancelUrl || `${STRIPE_ENV_CONFIG.appUrl}/billing?status=cancelled`,
      });

      return result.data;
    } catch (error) {
      errorService.handleError(error, 'createStripeCheckoutSession');
      throw error;
    }
  },

  /**
   * Creates a Stripe Billing Portal session for subscription management.
   */
  async createBillingPortalSession(returnUrl?: string): Promise<BillingPortalResponse> {
    try {
      const callable = httpsCallable<{ returnUrl: string }, BillingPortalResponse>(
        functions,
        'createStripeBillingPortalSession'
      );

      const result = await callable({
        returnUrl: returnUrl || `${STRIPE_ENV_CONFIG.appUrl}/billing`,
      });

      return result.data;
    } catch (error) {
      errorService.handleError(error, 'createStripeBillingPortalSession');
      throw error;
    }
  },

  /**
   * Creates a Stripe Connect onboarding link for mentors.
   */
  async createMentorOnboardingLink(returnUrl?: string, refreshUrl?: string): Promise<ConnectOnboardingResponse> {
    try {
      const callable = httpsCallable<
        { returnUrl: string; refreshUrl: string },
        ConnectOnboardingResponse
      >(functions, 'createStripeConnectOnboardingLink');

      const result = await callable({
        returnUrl: returnUrl || `${STRIPE_ENV_CONFIG.appUrl}/mentor/earnings?onboarding=complete`,
        refreshUrl: refreshUrl || `${STRIPE_ENV_CONFIG.appUrl}/mentor/earnings?onboarding=refresh`,
      });

      return result.data;
    } catch (error) {
      errorService.handleError(error, 'createStripeConnectOnboardingLink');
      throw error;
    }
  },
};
