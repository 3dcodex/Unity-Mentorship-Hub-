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
  orderBy,
} from 'firebase/firestore';
import { MentorPayout, PayoutStatus } from '../types';
import { paymentService } from './paymentService';
import { BILLING_CONSTANTS } from '../src/config/subscriptionPlans';
import { errorService } from './errorService';

/**
 * Payout Service
 * Handles mentor payout creation, processing, and tracking
 */

export const payoutService = {
  /**
   * Create a payout for a mentor for a specific period
   */
  async createPayout(
    mentorId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<MentorPayout | null> {
    try {
      // Get mentor data
      const mentorDoc = await getDoc(doc(db, 'users', mentorId));

      if (!mentorDoc.exists()) {
        throw new Error('Mentor not found');
      }

      const mentorData = mentorDoc.data();

      if (!mentorData.isMentor || mentorData.mentorStatus !== 'approved') {
        throw new Error('User is not an approved mentor');
      }

      // Calculate earnings for the period
      const earnings = await paymentService.calculateMentorEarnings(
        mentorId,
        periodStart,
        periodEnd
      );

      // Check if earnings meet minimum payout threshold
      if (earnings.totalEarnings < BILLING_CONSTANTS.MIN_PAYOUT_AMOUNT) {
        console.log(
          `Mentor ${mentorId} earnings ($${earnings.totalEarnings}) below minimum threshold ($${BILLING_CONSTANTS.MIN_PAYOUT_AMOUNT})`
        );
        return null;
      }

      // Check if mentor has Stripe Connect account
      if (!mentorData.stripeConnectedAccountId) {
        // Notify mentor to complete Stripe onboarding
        await setDoc(doc(collection(db, 'notifications')), {
          userId: mentorId,
          type: 'warning',
          title: 'Complete Payout Setup',
          message: `You have $${earnings.totalEarnings.toFixed(2)} pending. Please complete your Stripe account setup to receive payouts.`,
          read: false,
          createdAt: Timestamp.now(),
          actionUrl: '/mentor/earnings',
        });
        throw new Error('Mentor has not connected Stripe account');
      }

      // Get count of unique subscriptions
      const uniqueSubscriptions = new Set(
        earnings.payments.map(p => p.subscriptionId)
      );

      // Create payout record
      const payoutRef = doc(collection(db, 'mentorPayouts'));
      const payout: MentorPayout = {
        id: payoutRef.id,
        mentorId,
        mentorName: mentorData.name || mentorData.displayName,
        mentorEmail: mentorData.email,
        totalAmount: earnings.totalEarnings,
        paymentIds: earnings.payments.map(p => p.id),
        subscriptionCount: uniqueSubscriptions.size,
        stripeConnectedAccountId: mentorData.stripeConnectedAccountId,
        status: 'pending',
        periodStart: Timestamp.fromDate(periodStart),
        periodEnd: Timestamp.fromDate(periodEnd),
        scheduledDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(payoutRef, payout);

      // Notify mentor of pending payout
      await setDoc(doc(collection(db, 'notifications')), {
        userId: mentorId,
        type: 'info',
        title: 'Payout Scheduled',
        message: `Your payout of $${earnings.totalEarnings.toFixed(2)} for ${uniqueSubscriptions.size} subscription(s) is being processed.`,
        read: false,
        createdAt: Timestamp.now(),
        actionUrl: '/mentor/earnings',
      });

      return payout;
    } catch (error) {
      errorService.handleError(error, 'Error creating payout');
      throw error;
    }
  },

  /**
   * Update payout status (called by webhook or manual admin action)
   */
  async updatePayoutStatus(
    payoutId: string,
    status: PayoutStatus,
    stripePayoutId?: string,
    failureReason?: string
  ): Promise<void> {
    try {
      const payoutDoc = await getDoc(doc(db, 'mentorPayouts', payoutId));

      if (!payoutDoc.exists()) {
        throw new Error('Payout not found');
      }

      const payout = payoutDoc.data() as MentorPayout;

      const updates: Partial<MentorPayout> = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (stripePayoutId) {
        updates.stripePayoutId = stripePayoutId;
      }

      if (status === 'paid') {
        updates.paidDate = Timestamp.now();
      }

      if (status === 'failed' && failureReason) {
        updates.failureReason = failureReason;
      }

      await updateDoc(doc(db, 'mentorPayouts', payoutId), updates);

      // Notify mentor of status change
      const notificationMessages = {
        paid: `Your payout of $${payout.totalAmount.toFixed(2)} has been successfully transferred to your account.`,
        failed: `Your payout of $${payout.totalAmount.toFixed(2)} failed. ${failureReason || 'Please contact support.'}`,
        processing: `Your payout of $${payout.totalAmount.toFixed(2)} is being processed.`,
      };

      if (status !== 'pending') {
        await setDoc(doc(collection(db, 'notifications')), {
          userId: payout.mentorId,
          type: status === 'paid' ? 'success' : status === 'failed' ? 'error' : 'info',
          title: status === 'paid' ? 'Payout Complete' : status === 'failed' ? 'Payout Failed' : 'Payout Processing',
          message: notificationMessages[status] || 'Payout status updated',
          read: false,
          createdAt: Timestamp.now(),
          actionUrl: '/mentor/earnings',
        });
      }
    } catch (error) {
      errorService.handleError(error, 'Error updating payout status');
      throw error;
    }
  },

  /**
   * Get all payouts for a mentor
   */
  async getMentorPayouts(mentorId: string): Promise<MentorPayout[]> {
    try {
      const q = query(
        collection(db, 'mentorPayouts'),
        where('mentorId', '==', mentorId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as MentorPayout);
    } catch (error) {
      errorService.handleError(error, 'Error fetching mentor payouts');
      throw error;
    }
  },

  /**
   * Get pending payouts (admin view)
   */
  async getPendingPayouts(): Promise<MentorPayout[]> {
    try {
      const q = query(
        collection(db, 'mentorPayouts'),
        where('status', '==', 'pending'),
        orderBy('scheduledDate', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as MentorPayout);
    } catch (error) {
      errorService.handleError(error, 'Error fetching pending payouts');
      throw error;
    }
  },

  /**
   * Get all payouts (admin view with optional filters)
   */
  async getAllPayouts(status?: PayoutStatus): Promise<MentorPayout[]> {
    try {
      let q = query(collection(db, 'mentorPayouts'), orderBy('createdAt', 'desc'));

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as MentorPayout);
    } catch (error) {
      errorService.handleError(error, 'Error fetching all payouts');
      throw error;
    }
  },

  /**
   * Process monthly payouts for all mentors
   * This should be called by a scheduled Cloud Function on the 1st of each month
   */
  async processMonthlyPayouts(): Promise<{
    successful: number;
    failed: number;
    skipped: number;
  }> {
    try {
      // Calculate last month's date range
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Get all active mentors
      const mentorsQuery = query(
        collection(db, 'users'),
        where('isMentor', '==', true),
        where('mentorStatus', '==', 'approved')
      );

      const mentorsSnapshot = await getDocs(mentorsQuery);

      let successful = 0;
      let failed = 0;
      let skipped = 0;

      // Process each mentor
      for (const mentorDoc of mentorsSnapshot.docs) {
        try {
          const payout = await this.createPayout(
            mentorDoc.id,
            lastMonthStart,
            lastMonthEnd
          );

          if (payout) {
            successful++;
          } else {
            skipped++; // Below minimum threshold or no earnings
          }
        } catch (error) {
          failed++;
          errorService.handleError(
            error,
            `Failed to create payout for mentor ${mentorDoc.id}`
          );
        }
      }

      return { successful, failed, skipped };
    } catch (error) {
      errorService.handleError(error, 'Error processing monthly payouts');
      throw error;
    }
  },

  /**
   * Calculate total mentor earnings statistics
   */
  async getMentorEarningsStats(mentorId: string) {
    try {
      // Get all payouts for mentor
      const payouts = await this.getMentorPayouts(mentorId);

      const paidPayouts = payouts.filter(p => p.status === 'paid');
      const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'processing');

      const totalEarnings = paidPayouts.reduce((sum, p) => sum + p.totalAmount, 0);
      const pendingEarnings = pendingPayouts.reduce((sum, p) => sum + p.totalAmount, 0);

      // Get current month earnings (not yet in payout)
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const currentMonthEarnings = await paymentService.calculateMentorEarnings(
        mentorId,
        monthStart,
        new Date()
      );

      return {
        totalEarningsAllTime: totalEarnings,
        pendingPayouts: pendingEarnings,
        currentMonthEarnings: currentMonthEarnings.totalEarnings,
        totalPayoutsCount: paidPayouts.length,
        nextPayoutEstimate: currentMonthEarnings.totalEarnings, // What they'll get next month
      };
    } catch (error) {
      errorService.handleError(error, 'Error fetching mentor earnings stats');
      throw error;
    }
  },

  /**
   * Get payout statistics for admin dashboard
   */
  async getPayoutStats() {
    try {
      const allPayouts = await getDocs(collection(db, 'mentorPayouts'));
      const payouts = allPayouts.docs.map(doc => doc.data() as MentorPayout);

      const paidPayouts = payouts.filter(p => p.status === 'paid');
      const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'processing');
      const failedPayouts = payouts.filter(p => p.status === 'failed');

      const totalPaidOut = paidPayouts.reduce((sum, p) => sum + p.totalAmount, 0);
      const totalPending = pendingPayouts.reduce((sum, p) => sum + p.totalAmount, 0);

      return {
        totalPayouts: payouts.length,
        paidCount: paidPayouts.length,
        pendingCount: pendingPayouts.length,
        failedCount: failedPayouts.length,
        totalPaidOut,
        totalPending,
        averagePayoutAmount: paidPayouts.length > 0 ? totalPaidOut / paidPayouts.length : 0,
      };
    } catch (error) {
      errorService.handleError(error, 'Error fetching payout stats');
      throw error;
    }
  },
};
