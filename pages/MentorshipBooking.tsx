import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../src/firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs, Timestamp, updateDoc, limit, runTransaction, increment } from 'firebase/firestore';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { errorService } from '../services/errorService';
import { useToast } from '../components/AdminToast';
import { stripeService } from '../services/stripeService';
import type { SubscriptionTier } from '../types';

const SELECTED_MENTOR_STORAGE_KEY = 'unity_selected_mentor_id';

interface MentorProfile {
  id: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  role?: string;
  mentorExpertise?: string;
  mentorBio?: string;
  mentorStatus?: string;
  isMentor?: boolean;
  status?: string;
}

const MentorshipBooking: React.FC = () => {
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [mentorSearch, setMentorSearch] = useState('');
  const [allMentors, setAllMentors] = useState<MentorProfile[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [sessionType, setSessionType] = useState<'video' | 'voice' | 'chat'>('video');
  const [durationMinutes, setDurationMinutes] = useState<30 | 60>(60);
  const [sessionGoal, setSessionGoal] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [endDate, setEndDate] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessReason, setAccessReason] = useState('');
  const [accessReasonCode, setAccessReasonCode] = useState('unknown');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userPlan, setUserPlan] = useState<SubscriptionTier>('starter');
  const [planMentorId, setPlanMentorId] = useState<string | null>(null);
  const [sessionsUsedThisMonth, setSessionsUsedThisMonth] = useState(0);
  const [sessionQuota, setSessionQuota] = useState(1);
  const [sessionsRemaining, setSessionsRemaining] = useState<number | null>(null);
  const [activeSubscriptionId, setActiveSubscriptionId] = useState<string | null>(null);
  const [cycleEndsAt, setCycleEndsAt] = useState<Date | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { showToast, ToastComponent } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const mentorIdFromQuery = queryParams.get('mentor') || '';
  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const resyncAttemptedRef = useRef(false);

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const planLimits: Record<SubscriptionTier, number> = {
    starter: 1,
    'job-ready': 2,
    'career-accelerator': 4,
  };
  const currentPlanLimit = planLimits[userPlan] ?? 1;
  const isPaidPlan = userPlan !== 'starter';

  const normalizeTier = (value: unknown): SubscriptionTier => {
    if (value === 'job-ready' || value === 'career-accelerator' || value === 'starter') return value;
    if (value === 'basic') return 'job-ready';
    if (value === 'premium') return 'career-accelerator';
    return 'starter';
  };

  const formatTime = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const formatDateHuman = (dateValue: string) => {
    if (!dateValue) return 'Not selected';
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toDateValue = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  useEffect(() => {
    if (user) {
      checkAccess();
    }
  }, [user]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    if (mentorIdFromQuery) {
      setSelectedMentorId(mentorIdFromQuery);
    }
  }, [mentorIdFromQuery]);

  useEffect(() => {
    if (hasAccess) {
      loadMentors();
    }
  }, [hasAccess]);

  useEffect(() => {
    if (selectedMentorId && hasAccess) {
      getDoc(doc(db, 'users', selectedMentorId)).then(docSnap => {
        if (docSnap.exists()) setMentor({ id: docSnap.id, ...(docSnap.data() as Omit<MentorProfile, 'id'>) });
      });
    } else {
      setMentor(null);
    }
  }, [selectedMentorId, hasAccess]);

  useEffect(() => {
    if (isPaidPlan && planMentorId) {
      setSelectedMentorId(planMentorId);
    }
  }, [isPaidPlan, planMentorId]);

  useEffect(() => {
    if (selectedMentorId) {
      sessionStorage.setItem(SELECTED_MENTOR_STORAGE_KEY, selectedMentorId);
    }
  }, [selectedMentorId]);

  const loadMentors = async () => {
    try {
      const mentorQuery = query(collection(db, 'users'), where('isMentor', '==', true));
      const mentorSnapshot = await getDocs(mentorQuery);
      const mentors = mentorSnapshot.docs
        .map((snap) => ({ id: snap.id, ...(snap.data() as Omit<MentorProfile, 'id'>) }))
        .filter((m) => m.status !== 'suspended' && (m.mentorStatus === 'approved' || m.mentorStatus === undefined));

      setAllMentors(mentors);

      if (!selectedMentorId && mentors.length > 0) {
        const fromStorage = sessionStorage.getItem(SELECTED_MENTOR_STORAGE_KEY) || '';
        const firstChoice = mentors.find((m) => m.id === fromStorage)?.id || mentors[0].id;
        setSelectedMentorId(firstChoice);
      }
    } catch (err) {
      errorService.handleError(err, 'Error loading mentors');
      showToast('Failed to load available mentors', 'error');
    }
  };

  const checkAccess = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      let activeSub: Record<string, any> | null = null;
      let activeSubDocId: string | null = null;
      const paidLikeStatuses = new Set(['active', 'trialing']);
      const blockedPaidStatuses = new Set(['past_due', 'incomplete', 'unpaid', 'canceled', 'cancelled', 'incomplete_expired']);

      // Try multiple query strategies — Firestore rules require userId match.
      try {
        // First try: query with status == 'active' (most common, rule-safe)
        let subSnapshot = await getDocs(
          query(
            collection(db, 'subscriptions'),
            where('userId', '==', user.uid),
            where('status', '==', 'active'),
            limit(5)
          )
        );

        // Second try: also check 'trialing' status (Stripe may set this)
        if (subSnapshot.empty) {
          subSnapshot = await getDocs(
            query(
              collection(db, 'subscriptions'),
              where('userId', '==', user.uid),
              where('status', '==', 'trialing'),
              limit(5)
            )
          );
        }

        if (!subSnapshot.empty) {
          const rankedSubs = subSnapshot.docs
            .map((subDoc) => ({ id: subDoc.id, ...(subDoc.data() as Record<string, any>) })) as Array<Record<string, any> & { id: string }>;

          rankedSubs.sort((a, b) => {
              const aUpdated = toDateValue(a['updatedAt'])?.getTime() || 0;
              const bUpdated = toDateValue(b['updatedAt'])?.getTime() || 0;
              return bUpdated - aUpdated;
            });

          activeSubDocId = rankedSubs[0].id;
          activeSub = rankedSubs[0];
        }
      } catch (subErr) {
        errorService.handleError(subErr, 'Unable to read active subscription; using user profile fallback');
      }

      const entitlement = userData?.entitlementSnapshot || null;
      const plan = normalizeTier(activeSub?.tier || entitlement?.plan || userData?.subscriptionTier || userData?.subscriptionPlan);
      const hasFreeAccess = userData?.hasFreeAccess || false;
      const subscriptionStatusRaw = activeSub?.status || entitlement?.status || userData?.subscriptionStatus || 'active';
      const subscriptionStatus = String(subscriptionStatusRaw).toLowerCase();
      const linkedMentor = userData?.subscriptionMentorId || activeSub?.mentorId || entitlement?.mentorId || null;
      const sessionsPerMonth = Number(activeSub?.sessionsPerMonth || entitlement?.sessionsPerMonth || userData?.sessionsPerMonth || planLimits[plan]);
      const activeCycleEnd = toDateValue(activeSub?.currentPeriodEnd || entitlement?.cycleEnd || userData?.subscriptionCurrentPeriodEnd);
      const activeCycleStart = toDateValue(activeSub?.currentPeriodStart || entitlement?.cycleStart || userData?.subscriptionCurrentPeriodStart);
      const billingSetupComplete = Boolean(
        userData?.billingSetupComplete ||
        userData?.paymentMethodOnFile ||
        userData?.stripeCustomerId ||
        activeSub ||
        (plan !== 'starter' && paidLikeStatuses.has(subscriptionStatus)) ||
        userData?.stripeSubscriptionId ||
        entitlement?.status === 'active' ||
        entitlement?.status === 'trialing'
      );

      const hasPaidFootprint = Boolean(
        userData?.pendingSubscriptionTier ||
        userData?.subscriptionTier === 'job-ready' ||
        userData?.subscriptionTier === 'career-accelerator' ||
        userData?.subscriptionPlan === 'job-ready' ||
        userData?.subscriptionPlan === 'career-accelerator' ||
        entitlement?.plan === 'job-ready' ||
        entitlement?.plan === 'career-accelerator' ||
        activeSub?.stripeSubscriptionId ||
        userData?.stripeSubscriptionId
      );

      const shouldAttemptSelfResync = Boolean(
        userData?.stripeCustomerId &&
        !resyncAttemptedRef.current &&
        (
          (!activeSub && (plan !== 'starter' || hasPaidFootprint || blockedPaidStatuses.has(subscriptionStatus))) ||
          (plan !== 'starter' && blockedPaidStatuses.has(subscriptionStatus)) ||
          (plan !== 'starter' && paidLikeStatuses.has(subscriptionStatus) && activeCycleEnd && new Date() > activeCycleEnd)
        )
      );

      if (shouldAttemptSelfResync) {
        resyncAttemptedRef.current = true;
        try {
          await stripeService.resyncMySubscription();
          return checkAccess();
        } catch (resyncErr) {
          errorService.handleError(resyncErr, 'Self-service subscription resync failed in booking access check');
        }
      }

      const applyAccessDecision = (allow: boolean, reason: string, code: string) => {
        setHasAccess(allow);
        setAccessReason(reason);
        setAccessReasonCode(code);
        console.info('[BookingAccessDecision]', {
          userId: user.uid,
          allow,
          reason,
          code,
          plan,
          subscriptionStatus,
          sessionsPerMonth,
          activeSubDocId,
          billingSetupComplete,
          resolvedMentorId: linkedMentor,
          cycleEnd: activeCycleEnd?.toISOString?.() || null,
        });
      };

      setUserPlan(plan);
      setPlanMentorId(linkedMentor);
      setSessionQuota(sessionsPerMonth);
      setActiveSubscriptionId(activeSubDocId);
      setCycleEndsAt(activeCycleEnd);

      if (activeSub) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            subscriptionTier: plan,
            subscriptionPlan: plan,
            subscriptionStatus: subscriptionStatusRaw,
            subscriptionMentorId: linkedMentor,
            sessionsPerMonth,
            billingSetupComplete: true,
            paymentMethodOnFile: true,
            subscriptionUpdatedAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        } catch (syncErr) {
          // Do not block booking access if profile sync write fails.
          errorService.handleError(syncErr, 'Non-blocking subscription profile sync failed during access check');
        }
      }

      // Count sessions used in current cycle for quota checks.
      const now = new Date();
      const cycleStart = activeCycleStart || new Date(now.getFullYear(), now.getMonth(), 1);
      const cycleEnd = activeCycleEnd || new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const bookingSnapshots = await Promise.all([
        getDocs(query(collection(db, 'bookings'), where('studentId', '==', user.uid))),
        getDocs(query(collection(db, 'bookings'), where('menteeId', '==', user.uid))),
      ]);

      const combined = [...bookingSnapshots[0].docs, ...bookingSnapshots[1].docs]
        .filter((snap, index, arr) => arr.findIndex((d) => d.id === snap.id) === index)
        .map((snap) => snap.data());

      const usedThisCycle = combined.filter((b: any) => {
        const dateRaw = b.scheduledDate || b.slotDate;
        const fallbackDate = b.createdAt?.toDate ? b.createdAt.toDate() : null;
        const bookingDate = dateRaw ? new Date(`${dateRaw}T00:00:00`) : fallbackDate;
        if (!bookingDate) return false;
        if (b.status === 'cancelled') return false;
        return bookingDate >= cycleStart && bookingDate < cycleEnd;
      }).length;
      setSessionsUsedThisMonth(usedThisCycle);

      const resolvedRemaining =
        plan === 'starter'
          ? Math.max(1 - usedThisCycle, 0)
          : Number(
              activeSub?.sessionsRemaining ??
                Math.max(sessionsPerMonth - usedThisCycle, 0)
            );
      setSessionsRemaining(Number.isFinite(resolvedRemaining) ? resolvedRemaining : 0);

      if (hasFreeAccess) {
        applyAccessDecision(true, 'Access granted by admin override.', 'admin_override');
        return;
      }

      if (!billingSetupComplete && plan === 'starter') {
        applyAccessDecision(false, 'Billing setup is required. Add card details before booking sessions.', 'billing_setup_missing');
        return;
      }

      // Paid users with a stripeCustomerId but no active sub doc — try resync before blocking
      if (!billingSetupComplete && plan !== 'starter') {
        applyAccessDecision(false, 'Your subscription is being verified. Please visit Billing to confirm your payment status.', 'billing_verification_pending');
        return;
      }

      if (plan === 'starter') {
        if (resolvedRemaining <= 0) {
          applyAccessDecision(false, 'Starter plan quota is exhausted for this month. Access will reset next cycle.', 'starter_quota_exhausted');
          return;
        }
        applyAccessDecision(true, 'Starter plan is active with card on file: 1 session per month with any mentor.', 'starter_ok');
        return;
      }

      if (!paidLikeStatuses.has(subscriptionStatus) && !activeSub && !entitlement) {
        applyAccessDecision(false, 'Your paid subscription is not active. Please update billing.', 'paid_subscription_not_active');
        return;
      }

      if (blockedPaidStatuses.has(subscriptionStatus)) {
        applyAccessDecision(false, 'Your subscription payment needs attention. Please update billing to continue booking sessions.', 'payment_attention_required');
        return;
      }

      if (activeCycleEnd && now > activeCycleEnd) {
        applyAccessDecision(false, 'Your billing cycle has ended. Waiting for automatic renewal payment confirmation.', 'cycle_expired');
        return;
      }

      if (resolvedRemaining <= 0) {
        applyAccessDecision(false, 'Your session quota is exhausted for the current billing cycle. Access resumes after renewal.', 'paid_quota_exhausted');
        return;
      }

      if (!linkedMentor) {
        // Do not hard-lock active subscribers if mentor linkage is temporarily missing.
        applyAccessDecision(true, 'Your paid plan is active. Mentor linkage is missing, so you can book while billing sync catches up.', 'mentor_link_missing_but_allowed');
        return;
      }

      applyAccessDecision(true, 'Paid plans can book only with the mentor linked in billing.', 'paid_ok');
    } catch (err) {
      errorService.handleError(err, 'Error checking access');
      setHasAccess(false);
      setAccessReason('Unable to verify subscription access. Please try again.');
      setAccessReasonCode('access_check_failed');
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = () => {
    if (!selectedMentorId) {
      showToast('Please select a mentor first', 'warning');
      return;
    }
    if (!selectedDate || !selectedTime) {
      showToast('Please select date and time', 'warning');
      return;
    }
    if (isRecurring && !endDate) {
      showToast('Please select an end date for recurring sessions', 'warning');
      return;
    }
    if (isRecurring && endDate < selectedDate) {
      showToast('Recurring end date must be after booking date', 'warning');
      return;
    }
    const remainingQuota = isPaidPlan ? (sessionsRemaining ?? 0) : Math.max(currentPlanLimit - sessionsUsedThisMonth, 0);
    if (remainingQuota <= 0) {
      showToast(
        isPaidPlan
          ? 'You have reached your paid plan quota for this billing cycle.'
          : `You have reached your ${userPlan.toUpperCase()} plan limit for this month.`,
        'warning'
      );
      return;
    }
    if (isPaidPlan && planMentorId && selectedMentorId !== planMentorId) {
      showToast('Your paid plan is linked to a specific mentor. Please book that mentor.', 'warning');
      return;
    }
    if (isRecurring && userPlan === 'starter') {
      showToast('Recurring sessions are available on paid plans only.', 'warning');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!user || !selectedMentorId || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const bookingPayload = {
        studentId: user.uid,
        menteeId: user.uid,
        mentorId: selectedMentorId,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        slotDate: selectedDate,
        slot: formatTime(selectedTime),
        date: new Date(`${selectedDate}T00:00:00`).getDate(),
        sessionType,
        durationMinutes,
        sessionGoal: sessionGoal.trim() || null,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : null,
        endDate: isRecurring ? endDate : null,
        status: 'confirmed',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      let bookedSessionId = '';

      if (isPaidPlan && activeSubscriptionId) {
        const bookingRef = doc(collection(db, 'bookings'));
        const subRef = doc(db, 'subscriptions', activeSubscriptionId);

        await runTransaction(db, async (tx) => {
          const subSnap = await tx.get(subRef);
          if (!subSnap.exists()) throw new Error('SUBSCRIPTION_NOT_FOUND');

          const subData = subSnap.data() as Record<string, any>;
          const subStatus = String(subData.status || 'inactive');
          const subRemaining = Number(subData.sessionsRemaining || 0);
          const subPeriodEnd = toDateValue(subData.currentPeriodEnd);

          if (subStatus !== 'active') throw new Error('SUBSCRIPTION_INACTIVE');
          if (subPeriodEnd && new Date() > subPeriodEnd) throw new Error('SUBSCRIPTION_CYCLE_ENDED');
          if (subRemaining <= 0) throw new Error('SUBSCRIPTION_QUOTA_EXHAUSTED');

          tx.update(subRef, {
            sessionsRemaining: subRemaining - 1,
            updatedAt: Timestamp.now(),
          });
          tx.set(bookingRef, bookingPayload);
        });

        bookedSessionId = bookingRef.id;
        setSessionsRemaining((prev) => (typeof prev === 'number' ? Math.max(prev - 1, 0) : prev));
      } else {
        const sessionDoc = await addDoc(collection(db, 'bookings'), bookingPayload);
        bookedSessionId = sessionDoc.id;
      }
      
      // Create connection and conversation
      const { createConnection, createConversation } = await import('../services/messagingService');
      await createConnection(user.uid, selectedMentorId, bookedSessionId);
      await createConversation(user.uid, selectedMentorId, bookedSessionId);

      // Update usage counter for quick feedback in UI.
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          sessionsUsedThisMonth: increment(1),
          subscriptionLastBookedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        setSessionsUsedThisMonth((prev) => prev + 1);
      } catch (counterErr) {
        errorService.handleError(counterErr, 'Error updating session usage counter');
      }
      
      // Create notification for mentor
      try {
        const { getDoc, doc: firestoreDoc } = await import('firebase/firestore');
        const menteeDoc = await getDoc(firestoreDoc(db, 'users', user.uid));
        const menteeName = menteeDoc.data()?.displayName || menteeDoc.data()?.name || 'A student';
        const menteePhoto = menteeDoc.data()?.photoURL || '';
        
        await addDoc(collection(db, 'notifications'), {
          userId: selectedMentorId,
          type: 'booking',
          title: 'New Session Booked',
          message: `${menteeName} booked a ${durationMinutes}-minute ${sessionType} session on ${formatDateHuman(selectedDate)} at ${formatTime(selectedTime)}.`,
          read: false,
          createdAt: Timestamp.now(),
          actionUrl: `/mentorship/history`,
          fromUser: user.uid,
          fromUserName: menteeName,
          fromUserPhoto: menteePhoto,
        });
        
        // Create confirmation notification for mentee
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          type: 'booking',
          title: 'Session Confirmed',
          message: `Your ${durationMinutes}-minute ${sessionType} session with ${mentor?.displayName || mentor?.name || 'your mentor'} is confirmed for ${formatDateHuman(selectedDate)} at ${formatTime(selectedTime)}.`,
          read: false,
          createdAt: Timestamp.now(),
          actionUrl: `/mentorship/history`,
          fromUser: selectedMentorId,
          fromUserName: mentor?.displayName || 'Mentor',
          fromUserPhoto: mentor?.photoURL || '',
        });
      } catch (err) {
        errorService.handleError(err, 'Error creating notifications');
      }

      showToast('Session booked successfully. Redirecting to chat…', 'success');
      setTimeout(() => {
        navigate(`/quick-chat?user=${selectedMentorId}`);
      }, 2000);
    } catch (err) {
      errorService.handleError(err, 'Booking error');
      const code = String((err as any)?.message || '');
      if (code === 'SUBSCRIPTION_QUOTA_EXHAUSTED') {
        showToast('Your paid plan quota is exhausted for this billing cycle.', 'warning');
      } else if (code === 'SUBSCRIPTION_CYCLE_ENDED') {
        showToast('Billing cycle ended. Waiting for auto-renewal payment confirmation.', 'warning');
      } else if (code === 'SUBSCRIPTION_INACTIVE') {
        showToast('Subscription is not active. Update billing to continue booking.', 'warning');
      } else {
        showToast('Failed to book session. Please try again.', 'error');
      }
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const filteredMentors = allMentors.filter((m) => {
    if (isPaidPlan && planMentorId && m.id !== planMentorId) {
      return false;
    }
    const q = mentorSearch.trim().toLowerCase();
    if (!q) return true;
    const name = (m.displayName || m.name || '').toLowerCase();
    const expertise = (m.mentorExpertise || '').toLowerCase();
    return name.includes(q) || expertise.includes(q);
  });

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center space-y-4">
          <div className="size-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  const accessReasonLower = accessReason.toLowerCase();
  const hasBillingIssue =
    accessReasonLower.includes('billing setup') ||
    accessReasonLower.includes('not active') ||
    accessReasonLower.includes('payment needs attention') ||
    accessReasonLower.includes('update billing');
  const accessTitle = hasBillingIssue ? 'Access Restricted' : 'Booking Temporarily Unavailable';
  const accessDescription = hasBillingIssue
    ? 'We need to confirm your billing eligibility before booking.'
    : 'Your plan is detected, but booking is paused due to cycle or quota rules.';
  const primaryActionPath = hasBillingIssue
    ? (selectedMentorId ? `/billing?mentor=${selectedMentorId}` : '/billing')
    : '/billing/manage';
  const primaryActionLabel = hasBillingIssue ? 'Go to Billing' : 'Manage Subscription';

  if (!hasAccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className={`max-w-2xl w-full rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center space-y-4 sm:space-y-6 shadow-2xl backdrop-blur-xl relative z-10 border animate-in zoom-in duration-500 ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
          <div className="size-24 bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/50 animate-bounce">
            <span className="material-symbols-outlined text-white text-5xl">lock</span>
          </div>
          <h1 className={`text-2xl sm:text-4xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent`}>{accessTitle}</h1>
          <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {accessDescription}
          </p>
          {accessReason && (
            <div className="space-y-1">
              <p className={`text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{accessReason}</p>
              <p className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Reason code: {accessReasonCode}</p>
            </div>
          )}
          <div className={`rounded-2xl p-6 backdrop-blur-sm ${isDark ? 'bg-slate-700/50 border border-slate-600' : 'bg-blue-50/50 border border-blue-100'}`}>
            <p className={`text-sm font-bold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{hasBillingIssue ? 'To restore access:' : 'To continue booking:'}</p>
            <ul className={`space-y-2 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <li className="flex items-center gap-3 animate-in slide-in-from-left-4" style={{animationDelay: '100ms'}}>
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>{hasBillingIssue ? 'Confirm your payment method and subscription status' : 'Check your remaining sessions for this cycle'}</span>
              </li>
              <li className="flex items-center gap-3 animate-in slide-in-from-left-4" style={{animationDelay: '200ms'}}>
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>{hasBillingIssue ? 'Ensure your paid plan (Job-Ready or Career Accelerator) is active' : 'Verify your renewal date and billing cycle status'}</span>
              </li>
              <li className="flex items-center gap-3 animate-in slide-in-from-left-4" style={{animationDelay: '300ms'}}>
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
                <span>{hasBillingIssue ? 'Retry checkout if payment is still processing' : 'Use Manage Subscription to adjust your plan if needed'}</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => navigate(primaryActionPath)}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black shadow-2xl shadow-blue-500/50 hover:scale-105 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="material-symbols-outlined relative z-10">payments</span>
              <span className="relative z-10">{primaryActionLabel}</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-black border-2 transition-all hover:scale-105 ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-slate-700 hover:border-gray-500'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
              }`}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-4 sm:py-8 px-3 sm:px-4 relative overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border animate-pulse ${
            isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'
          }`}>
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl animate-bounce">event</span>
            <span className={`text-xs font-black uppercase tracking-wider bg-gradient-to-r ${userPlan === 'career-accelerator' ? 'from-purple-600 to-pink-600' : 'from-blue-600 to-indigo-600'} bg-clip-text text-transparent`}>
              {userPlan === 'career-accelerator' ? '🚀 Career Accelerator' : userPlan === 'job-ready' ? '⭐ Job-Ready' : '🎯 Starter'}
            </span>
          </div>
          <h1 className={`text-2xl sm:text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent`}>Book Mentorship Session</h1>
          <p className={`font-medium max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Professional scheduling with mentor selection, validated timing, and instant confirmation.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Booking Area */}
          <div className={`lg:col-span-2 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl backdrop-blur-sm border animate-in fade-in slide-in-from-left-8 duration-700 ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50'}`}>
            {/* Mentor Selector */}
            <div className="mb-8 pb-8 border-b border-gray-100 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Choose Mentor</h3>
                <button
                  onClick={() => selectedMentorId && navigate(`/profile-view/${selectedMentorId}`)}
                  disabled={!selectedMentorId}
                  className="text-sm font-bold text-blue-600 disabled:opacity-50"
                >
                  View Profile
                </button>
              </div>

              <input
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
                placeholder={isPaidPlan ? 'Search your linked mentor' : 'Search by mentor name or expertise'}
                className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none ${
                  isDark ? 'bg-slate-700 text-gray-200 border border-gray-600' : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              />

              {isPaidPlan && planMentorId && (
                <p className={`text-xs font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Your plan is linked to one mentor for this billing cycle.
                </p>
              )}

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {filteredMentors.map((m) => {
                  const isSelected = selectedMentorId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMentorId(m.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-lg'
                          : isDark
                          ? 'bg-slate-700 hover:bg-slate-600 text-gray-200'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="size-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {m.photoURL
                          ? <img src={m.photoURL} className="w-full h-full object-cover" alt={m.displayName || m.name || 'Mentor'} />
                          : (m.displayName || m.name || 'M')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{m.displayName || m.name || 'Mentor'}</p>
                        <p className={`text-xs truncate ${isSelected ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {m.mentorExpertise || 'Mentorship'}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {filteredMentors.length === 0 && (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No mentors matched your search.</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div>
                <h4 className={`text-sm font-black mb-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>Session Date</h4>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl font-semibold outline-none ${
                    isDark ? 'bg-slate-700 text-gray-200 border border-gray-600' : 'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                />
              </div>

              <div>
                <h4 className={`text-sm font-black mb-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>Session Type</h4>
                <div className="grid grid-cols-3 gap-2">
                  {(['video', 'voice', 'chat'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSessionType(type)}
                      className={`py-3 rounded-xl font-bold text-sm capitalize ${
                        sessionType === type
                          ? 'bg-blue-600 text-white'
                          : isDark
                          ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className={`text-sm font-black mb-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>Available Time Slots</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-4 rounded-xl font-bold transition-all hover:scale-105 relative overflow-hidden group ${
                      selectedTime === time
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/50'
                        : isDark
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:shadow-lg'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:shadow-lg'
                    }`}
                  >
                    {selectedTime === time && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    )}
                    <span className="relative z-10">{formatTime(time)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div>
                <h4 className={`text-sm font-black mb-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>Duration</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[30, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDurationMinutes(mins as 30 | 60)}
                      className={`py-3 rounded-xl font-bold text-sm ${
                        durationMinutes === mins
                          ? 'bg-blue-600 text-white'
                          : isDark
                          ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className={`text-sm font-black mb-2 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>Session Goal (optional)</h4>
                <input
                  value={sessionGoal}
                  onChange={(e) => setSessionGoal(e.target.value)}
                  placeholder="What do you want to accomplish?"
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium outline-none ${
                    isDark ? 'bg-slate-700 text-gray-200 border border-gray-600' : 'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                />
              </div>
            </div>

            {/* Recurring Options */}
            <div className={`pt-8 border-t space-y-4 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`size-6 rounded flex items-center justify-center transition-all ${
                    isRecurring ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700' : 'bg-gray-100'
                  }`}
                >
                  {isRecurring && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
                <label className={`font-bold cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-900'}`} onClick={() => setIsRecurring(!isRecurring)}>
                  Make this a recurring session
                </label>
              </div>

              {isRecurring && (
                <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                  <div>
                    <label className={`text-xs font-black mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Frequency</label>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setRecurrenceType(type)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                            recurrenceType === type
                              ? 'bg-blue-600 text-white'
                              : isDark
                              ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs font-black mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full py-2 px-4 rounded-lg font-bold outline-none ${
                        isDark
                          ? 'bg-slate-700 text-gray-300 border border-gray-600'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={openConfirm}
              disabled={submitting}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-5 rounded-2xl font-black shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="material-symbols-outlined relative z-10">event_available</span>
              <span className="relative z-10">Review & Confirm</span>
            </button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className={`rounded-3xl p-6 relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900' : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'} text-white shadow-2xl`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
              <div className="size-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 animate-pulse relative z-10">
                <span className="material-symbols-outlined text-2xl">info</span>
              </div>
              <h3 className="text-xl font-black mb-2 relative z-10">Session Details ✨</h3>
              <div className="space-y-3 text-sm relative z-10">
                <div className="flex justify-between">
                  <span className="opacity-80">Date:</span>
                  <span className="font-bold">{formatDateHuman(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Time:</span>
                  <span className="font-bold">{formatTime(selectedTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Mentor:</span>
                  <span className="font-bold max-w-[180px] text-right truncate">{mentor?.displayName || mentor?.name || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Type:</span>
                  <span className="font-bold capitalize">{sessionType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Duration:</span>
                  <span className="font-bold">{durationMinutes} minutes</span>
                </div>
                {isRecurring && (
                  <div className="flex justify-between">
                    <span className="opacity-80">Recurring:</span>
                    <span className="font-bold capitalize">{recurrenceType}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-3xl p-6 backdrop-blur-sm border ${isDark ? 'bg-slate-800/80 border-gray-700' : 'bg-white/80 border-white/50 shadow-xl'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-green-500 text-2xl animate-pulse">verified</span>
                <h3 className={`font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent`}>Your Plan</h3>
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {userPlan === 'career-accelerator'
                  ? '4 sessions/month, linked to your selected mentor'
                  : userPlan === 'job-ready'
                  ? '2 sessions/month, linked to your selected mentor'
                  : '1 session/month with any available mentor'}
              </p>
              <p className={`mt-2 text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {isPaidPlan ? 'Used this cycle' : 'Used this month'}: {sessionsUsedThisMonth}/{sessionQuota}
              </p>
              {isPaidPlan && (
                <p className={`mt-1 text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Remaining this cycle: {sessionsRemaining ?? Math.max(sessionQuota - sessionsUsedThisMonth, 0)}
                </p>
              )}
              {isPaidPlan && cycleEndsAt && (
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Cycle renews on: {cycleEndsAt.toLocaleDateString()}
                </p>
              )}
              {accessReason && (
                <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{accessReason}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-lg rounded-2xl border p-6 ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Confirm Booking</h3>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Review your session details before confirming.
            </p>

            <div className={`mt-4 rounded-xl p-4 space-y-2 ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <div className="flex justify-between text-sm"><span className="opacity-70">Mentor</span><span className="font-bold">{mentor?.displayName || mentor?.name || 'Not selected'}</span></div>
              <div className="flex justify-between text-sm"><span className="opacity-70">Date</span><span className="font-bold">{formatDateHuman(selectedDate)}</span></div>
              <div className="flex justify-between text-sm"><span className="opacity-70">Time</span><span className="font-bold">{formatTime(selectedTime)}</span></div>
              <div className="flex justify-between text-sm"><span className="opacity-70">Type</span><span className="font-bold capitalize">{sessionType}</span></div>
              <div className="flex justify-between text-sm"><span className="opacity-70">Duration</span><span className="font-bold">{durationMinutes} min</span></div>
              {isRecurring && <div className="flex justify-between text-sm"><span className="opacity-70">Recurring</span><span className="font-bold capitalize">{recurrenceType} until {endDate || 'not set'}</span></div>}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className={`px-4 py-2 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="px-4 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
              >
                {submitting ? 'Booking…' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ToastComponent}
    </div>
  );
};

export default MentorshipBooking;
