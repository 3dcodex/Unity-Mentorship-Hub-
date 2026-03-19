import { db } from '../src/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { Subscription, SubscriptionTier } from '../types';
import { getPlanByTier } from '../src/config/subscriptionPlans';
import { errorService } from './errorService';

/**
 * Subscription Service
 * Handles all subscription-related operations
 */

export const subscriptionService = {
  /**
   * Create a new subscription
   */
  async createSubscription(
    userId: string,
    mentorId: string,
    tier: SubscriptionTier
  ): Promise<Subscription> {
    try {
      // Get user and mentor data
      const userDoc = await getDoc(doc(db, 'users', userId));
      const mentorDoc = await getDoc(doc(db, 'users', mentorId));

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      if (!mentorDoc.exists()) {
        throw new Error('Mentor not found');
      }

      const userData = userDoc.data();
      const mentorData = mentorDoc.data();

      // Get plan configuration
      const plan = getPlanByTier(tier);
      if (!plan) {
        throw new Error(`Invalid subscription tier: ${tier}`);
      }

      // Calculate billing period (current month)
      const now = Timestamp.now();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Create subscription document
      const subscriptionRef = doc(collection(db, 'subscriptions'));
      const subscription: Subscription = {
        id: subscriptionRef.id,
        userId,
        userName: userData.name || userData.displayName || 'Unknown User',
        userEmail: userData.email,
        mentorId,
        mentorName: mentorData.name || mentorData.displayName || 'Unknown Mentor',
        tier,
        status: 'active',
        priceMonthly: plan.priceMonthly,
        sessionsPerMonth: plan.sessionsPerMonth,
        sessionsRemaining: plan.sessionsPerMonth,
        stripeCustomerId: userData.stripeCustomerId || '',
        stripeSubscriptionId: undefined,
        stripePriceId: plan.stripePriceId,
        currentPeriodStart: now,
        currentPeriodEnd: Timestamp.fromDate(periodEnd),
        billingCycleAnchor: now,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(subscriptionRef, subscription);

      // Update user profile with subscription info
      await updateDoc(doc(db, 'users', userId), {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        updatedAt: now,
      });

      return subscription;
    } catch (error) {
      errorService.handleError(error, 'Error creating subscription');
      throw error;
    }
  },

  /**
   * Get active subscription for a user
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      // Check active first, then trialing
      let snapshot = await getDocs(
        query(
          collection(db, 'subscriptions'),
          where('userId', '==', userId),
          where('status', '==', 'active')
        )
      );

      if (snapshot.empty) {
        snapshot = await getDocs(
          query(
            collection(db, 'subscriptions'),
            where('userId', '==', userId),
            where('status', '==', 'trialing')
          )
        );
      }

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as Subscription;
    } catch (error) {
      errorService.handleError(error, 'Error fetching user subscription');
      throw error;
    }
  },

  /**
   * Get all subscriptions for a mentor
   */
  async getMentorSubscriptions(mentorId: string): Promise<Subscription[]> {
    try {
      const q = query(
        collection(db, 'subscriptions'),
        where('mentorId', '==', mentorId),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Subscription);
    } catch (error) {
      errorService.handleError(error, 'Error fetching mentor subscriptions');
      throw error;
    }
  },

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediate: boolean = false,
    reason?: string
  ): Promise<void> {
    try {
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));

      if (!subDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subDoc.data() as Subscription;

      // Update subscription status
      const updates: Partial<Subscription> = {
        cancelAtPeriodEnd: !immediate,
        updatedAt: Timestamp.now(),
        cancellationReason: reason,
      };

      if (immediate) {
        updates.status = 'cancelled';
        updates.cancelledAt = Timestamp.now();
      }

      await updateDoc(doc(db, 'subscriptions', subscriptionId), updates);

      // Update user profile if cancelled immediately
      if (immediate) {
        await updateDoc(doc(db, 'users', subscription.userId), {
          subscriptionStatus: 'cancelled',
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      errorService.handleError(error, 'Error cancelling subscription');
      throw error;
    }
  },

  /**
   * Upgrade or downgrade subscription tier.
   * Prorates remaining sessions instead of resetting to prevent mid-cycle exploit.
   */
  async changeSubscriptionTier(
    subscriptionId: string,
    newTier: SubscriptionTier
  ): Promise<void> {
    try {
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));

      if (!subDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subDoc.data() as Subscription;
      const newPlan = getPlanByTier(newTier);

      if (!newPlan) {
        throw new Error(`Invalid tier: ${newTier}`);
      }

      const oldMax = subscription.sessionsPerMonth;
      const used = oldMax - subscription.sessionsRemaining;
      const newRemaining = Math.max(newPlan.sessionsPerMonth - used, 0);

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        tier: newTier,
        priceMonthly: newPlan.priceMonthly,
        sessionsPerMonth: newPlan.sessionsPerMonth,
        sessionsRemaining: newRemaining,
        stripePriceId: newPlan.stripePriceId,
        updatedAt: Timestamp.now(),
      });

      await updateDoc(doc(db, 'users', subscription.userId), {
        subscriptionTier: newTier,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      errorService.handleError(error, 'Error changing subscription tier');
      throw error;
    }
  },

  /**
   * Consume a session from the subscription quota
   */
  async consumeSession(
    subscriptionId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));

      if (!subDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subDoc.data() as Subscription;

      if (subscription.sessionsRemaining <= 0) {
        throw new Error('No sessions remaining in subscription quota');
      }

      // Decrement session count
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        sessionsRemaining: subscription.sessionsRemaining - 1,
        updatedAt: Timestamp.now(),
      });

      // Mark session as deducted from quota
      await updateDoc(doc(db, 'sessions', sessionId), {
        subscriptionId,
        deductedFromQuota: true,
        quotaDeductedAt: Timestamp.now(),
      });
    } catch (error) {
      errorService.handleError(error, 'Error consuming session');
      throw error;
    }
  },

  /**
   * Renew subscription (reset quota, update billing period)
   * Called automatically on successful payment or monthly cycle
   */
  async renewSubscription(subscriptionId: string): Promise<void> {
    try {
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));

      if (!subDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subDoc.data() as Subscription;

      // Calculate next billing period
      const now = new Date();
      const nextPeriodEnd = new Date(now);
      nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        currentPeriodStart: Timestamp.now(),
        currentPeriodEnd: Timestamp.fromDate(nextPeriodEnd),
        sessionsRemaining: subscription.sessionsPerMonth, // Reset quota
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      errorService.handleError(error, 'Error renewing subscription');
      throw error;
    }
  },

  /**
   * Check if user can book a session based on subscription quota
   */
  async canBookSession(userId: string): Promise<{ canBook: boolean; reason?: string }> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return {
          canBook: false,
          reason: 'No active subscription found',
        };
      }

      if (subscription.status !== 'active') {
        return {
          canBook: false,
          reason: `Subscription is ${subscription.status}`,
        };
      }

      if (subscription.sessionsRemaining <= 0) {
        return {
          canBook: false,
          reason: 'No sessions remaining this month',
        };
      }

      return { canBook: true };
    } catch (error) {
      errorService.handleError(error, 'Error checking session eligibility');
      return {
        canBook: false,
        reason: 'Error checking subscription status',
      };
    }
  },

  /**
   * Get subscription statistics (only fetches active subscriptions)
   */
  async getSubscriptionStats() {
    try {
      const activeQuery = query(
        collection(db, 'subscriptions'),
        where('status', '==', 'active')
      );
      const activeSubs = await getDocs(activeQuery);

      const tierCounts: Record<SubscriptionTier, number> = {
        starter: 0,
        'job-ready': 0,
        'career-accelerator': 0,
      };

      let totalRevenue = 0;

      activeSubs.docs.forEach(d => {
        const sub = d.data() as Subscription;
        if (sub.tier in tierCounts) tierCounts[sub.tier]++;
        totalRevenue += sub.priceMonthly;
      });

      return {
        totalSubscriptions: activeSubs.size,
        tierCounts,
        monthlyRecurringRevenue: totalRevenue,
        averageRevenuePerUser: activeSubs.size > 0 ? totalRevenue / activeSubs.size : 0,
      };
    } catch (error) {
      errorService.handleError(error, 'Error fetching subscription stats');
      throw error;
    }
  },
};
