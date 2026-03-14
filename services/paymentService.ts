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
import { Payment } from '../types';
import { calculateCommissionSplit } from '../src/config/subscriptionPlans';
import { errorService } from './errorService';

/**
 * Payment Service
 * Handles payment recording, tracking, and commission calculations
 */

export const paymentService = {
  /**
   * Record a successful payment
   */
  async recordPayment(
    subscriptionId: string,
    stripePaymentIntentId: string,
    amount: number,
    stripeInvoiceId?: string
  ): Promise<Payment> {
    try {
      // Get subscription details
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));

      if (!subDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subDoc.data();

      // Calculate commission split (85% mentor, 15% platform)
      const { mentorAmount, platformFee } = calculateCommissionSplit(amount);

      // Create payment record
      const paymentRef = doc(collection(db, 'payments'));
      const payment: Payment = {
        id: paymentRef.id,
        subscriptionId,
        userId: subscription.userId,
        userName: subscription.userName,
        userEmail: subscription.userEmail,
        mentorId: subscription.mentorId,
        mentorName: subscription.mentorName,
        totalAmount: amount,
        mentorAmount,
        platformFee,
        stripePaymentIntentId,
        stripeInvoiceId,
        status: 'succeeded',
        billingPeriodStart: subscription.currentPeriodStart,
        billingPeriodEnd: subscription.currentPeriodEnd,
        createdAt: Timestamp.now(),
        paidAt: Timestamp.now(),
      };

      await setDoc(paymentRef, payment);

      // Update subscription with last payment date
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        lastPaymentDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create notification for user
      await setDoc(doc(collection(db, 'notifications')), {
        userId: subscription.userId,
        type: 'success',
        title: 'Payment Successful',
        message: `Your payment of $${amount.toFixed(2)} for ${subscription.tier} subscription has been processed.`,
        read: false,
        createdAt: Timestamp.now(),
        actionUrl: '/subscription',
      });

      return payment;
    } catch (error) {
      errorService.handleError(error, 'Error recording payment');
      throw error;
    }
  },

  /**
   * Record a failed payment
   */
  async recordFailedPayment(
    subscriptionId: string,
    stripePaymentIntentId: string,
    amount: number,
    failureReason: string
  ): Promise<void> {
    try {
      const subDoc = await getDoc(doc(db, 'subscriptions', subscriptionId));

      if (!subDoc.exists()) {
        throw new Error('Subscription not found');
      }

      const subscription = subDoc.data();
      const { mentorAmount, platformFee } = calculateCommissionSplit(amount);

      // Record failed payment
      const paymentRef = doc(collection(db, 'payments'));
      const payment: Payment = {
        id: paymentRef.id,
        subscriptionId,
        userId: subscription.userId,
        userName: subscription.userName,
        userEmail: subscription.userEmail,
        mentorId: subscription.mentorId,
        mentorName: subscription.mentorName,
        totalAmount: amount,
        mentorAmount,
        platformFee,
        stripePaymentIntentId,
        status: 'failed',
        failureReason,
        billingPeriodStart: subscription.currentPeriodStart,
        billingPeriodEnd: subscription.currentPeriodEnd,
        createdAt: Timestamp.now(),
      };

      await setDoc(paymentRef, payment);

      // Update subscription status to past_due
      await updateDoc(doc(db, 'subscriptions', subscriptionId), {
        status: 'past_due',
        updatedAt: Timestamp.now(),
      });

      // Notify user of failed payment
      await setDoc(doc(collection(db, 'notifications')), {
        userId: subscription.userId,
        type: 'error',
        title: 'Payment Failed',
        message: `Your payment of $${amount.toFixed(2)} failed. Please update your payment method.`,
        read: false,
        createdAt: Timestamp.now(),
        actionUrl: '/billing',
      });
    } catch (error) {
      errorService.handleError(error, 'Error recording failed payment');
      throw error;
    }
  },

  /**
   * Process a refund
   */
  async processRefund(
    paymentId: string,
    refundAmount: number,
    refundReason: string
  ): Promise<void> {
    try {
      const paymentDoc = await getDoc(doc(db, 'payments', paymentId));

      if (!paymentDoc.exists()) {
        throw new Error('Payment not found');
      }

      const payment = paymentDoc.data() as Payment;

      // Update payment record
      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'refunded',
        refundedAmount: refundAmount,
        refundReason,
        refundedAt: Timestamp.now(),
      });

      // Notify user
      await setDoc(doc(collection(db, 'notifications')), {
        userId: payment.userId,
        type: 'info',
        title: 'Refund Processed',
        message: `A refund of $${refundAmount.toFixed(2)} has been processed to your account.`,
        read: false,
        createdAt: Timestamp.now(),
        actionUrl: '/billing',
      });
    } catch (error) {
      errorService.handleError(error, 'Error processing refund');
      throw error;
    }
  },

  /**
   * Get payment history for a user
   */
  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Payment);
    } catch (error) {
      errorService.handleError(error, 'Error fetching user payments');
      throw error;
    }
  },

  /**
   * Calculate mentor earnings for a specific period
   */
  async calculateMentorEarnings(
    mentorId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      const q = query(
        collection(db, 'payments'),
        where('mentorId', '==', mentorId),
        where('status', '==', 'succeeded'),
        where('paidAt', '>=', Timestamp.fromDate(startDate)),
        where('paidAt', '<=', Timestamp.fromDate(endDate))
      );

      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map(doc => doc.data() as Payment);

      const totalEarnings = payments.reduce(
        (sum, payment) => sum + payment.mentorAmount,
        0
      );

      const totalPlatformFees = payments.reduce(
        (sum, payment) => sum + payment.platformFee,
        0
      );

      return {
        totalEarnings,
        totalPlatformFees,
        paymentCount: payments.length,
        payments,
        averagePayment: payments.length > 0 ? totalEarnings / payments.length : 0,
      };
    } catch (error) {
      errorService.handleError(error, 'Error calculating mentor earnings');
      throw error;
    }
  },

  /**
   * Get payment statistics for admin dashboard
   */
  async getPaymentStats(startDate?: Date, endDate?: Date) {
    try {
      let q = query(
        collection(db, 'payments'),
        where('status', '==', 'succeeded')
      );

      if (startDate) {
        q = query(q, where('paidAt', '>=', Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where('paidAt', '<=', Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map(doc => doc.data() as Payment);

      const totalRevenue = payments.reduce(
        (sum, p) => sum + p.totalAmount,
        0
      );

      const totalMentorEarnings = payments.reduce(
        (sum, p) => sum + p.mentorAmount,
        0
      );

      const totalPlatformFees = payments.reduce(
        (sum, p) => sum + p.platformFee,
        0
      );

      return {
        totalRevenue,
        totalMentorEarnings,
        totalPlatformFees,
        paymentCount: payments.length,
        averagePayment: payments.length > 0 ? totalRevenue / payments.length : 0,
      };
    } catch (error) {
      errorService.handleError(error, 'Error fetching payment stats');
      throw error;
    }
  },

  /**
   * Get pending payments (payments that need to be collected)
   */
  async getPendingPayments(): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, 'payments'),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Payment);
    } catch (error) {
      errorService.handleError(error, 'Error fetching pending payments');
      throw error;
    }
  },

  /**
   * Get failed payments that need attention
   */
  async getFailedPayments(): Promise<Payment[]> {
    try {
      const q = query(
        collection(db, 'payments'),
        where('status', '==', 'failed'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Payment);
    } catch (error) {
      errorService.handleError(error, 'Error fetching failed payments');
      throw error;
    }
  },
};
