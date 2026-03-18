import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, getDocs, query, where, orderBy, limit, Timestamp, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { errorService } from '../services/errorService';
import { stripeService } from '../services/stripeService';
import { SubscriptionTier } from '../types';
import { SUBSCRIPTION_PLANS } from '../src/config/subscriptionPlans';
import Toast from '../components/Toast';

const SELECTED_MENTOR_STORAGE_KEY = 'unity_selected_mentor_id';

interface Transaction {
  id: string;
  date: Timestamp | Date | null;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  type: 'session' | 'subscription' | 'refund';
  stripeInvoiceId?: string;
}

interface MentorOption {
  id: string;
  name: string;
  expertise: string;
}

const Billing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState<SubscriptionTier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('starter');
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [availableMentors, setAvailableMentors] = useState<MentorOption[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  
  // Check if coming from mentorship booking
  const searchParams = new URLSearchParams(location.search);
  const mentorIdFromQuery = searchParams.get('mentor');
  const mentorId = mentorIdFromQuery || sessionStorage.getItem(SELECTED_MENTOR_STORAGE_KEY);
  const sessionCost = searchParams.get('cost') || '25';
  const billingStatus = searchParams.get('status');

  useEffect(() => {
    if (mentorIdFromQuery) {
      sessionStorage.setItem(SELECTED_MENTOR_STORAGE_KEY, mentorIdFromQuery);
      return;
    }

    if (billingStatus === 'success' || billingStatus === 'cancelled') {
      return;
    }
  }, [billingStatus, mentorIdFromQuery]);

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadUserPlan();
      loadMentors();
    }
  }, [user]);

  useEffect(() => {
    if (mentorIdFromQuery) {
      setSelectedMentorId(mentorIdFromQuery);
      return;
    }

    if (mentorId) {
      setSelectedMentorId(mentorId);
    }
  }, [mentorId, mentorIdFromQuery]);

  useEffect(() => {
    if (billingStatus === 'success') {
      syncSubscriptionAfterCheckout();
    }

    if (billingStatus === 'cancelled') {
      setToastMessage('Checkout was cancelled. You can try again any time.');
      navigate('/billing', { replace: true });
    }
  }, [billingStatus, navigate]);

  const pollAttemptsRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 5;
  const POLL_INTERVAL_MS = 2500;

  const syncSubscriptionAfterCheckout = useCallback(async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();

      const activeSubSnapshot = await getDocs(
        query(
          collection(db, 'subscriptions'),
          where('userId', '==', user.uid),
          where('status', '==', 'active'),
          limit(1)
        )
      );

      if (!activeSubSnapshot.empty) {
        const activeSub = activeSubSnapshot.docs[0].data() as Record<string, any>;

        await setDoc(userRef, {
          subscriptionTier: activeSub.tier || userData.subscriptionTier || 'starter',
          subscriptionStatus: 'active',
          subscriptionMentorId: activeSub.mentorId || userData.subscriptionMentorId || null,
          sessionsPerMonth: activeSub.sessionsPerMonth || userData.sessionsPerMonth || 1,
          pendingSubscriptionMentorId: null,
          pendingSubscriptionTier: null,
          subscriptionUpdatedAt: Timestamp.now(),
        }, { merge: true });

        setToastMessage('Payment confirmed. Your plan is now active.');
        loadUserPlan();
        loadTransactions();
        navigate('/mentorship/history', { replace: true });
        return;
      }

      // Webhook may not have fired yet — retry with polling
      if (pollAttemptsRef.current < MAX_POLL_ATTEMPTS) {
        pollAttemptsRef.current += 1;
        setToastMessage(`Confirming payment with Stripe... (attempt ${pollAttemptsRef.current}/${MAX_POLL_ATTEMPTS})`);
        setTimeout(() => syncSubscriptionAfterCheckout(), POLL_INTERVAL_MS);
        return;
      }

      // Max retries reached — check if at least billing setup completed
      const refreshedUserDoc = await getDoc(userRef);
      const refreshedUser = refreshedUserDoc.data() || {};
      const setupComplete = Boolean(refreshedUser.billingSetupComplete || refreshedUser.paymentMethodOnFile);

      if (setupComplete) {
        await setDoc(userRef, {
          subscriptionTier: refreshedUser.subscriptionTier || 'starter',
          subscriptionStatus: 'active',
          pendingSubscriptionMentorId: null,
          pendingSubscriptionTier: null,
          subscriptionUpdatedAt: Timestamp.now(),
        }, { merge: true });
        setToastMessage('Card details saved. Billing setup is complete.');
      } else {
        setToastMessage('Payment submitted. It may take a moment to activate — please refresh shortly.');
      }

      loadUserPlan();
      loadTransactions();
      navigate('/mentorship/history', { replace: true });
    } catch (err) {
      errorService.handleError(err, 'Error syncing subscription after checkout');
      setToastMessage('We could not verify activation yet. Please refresh in a moment.');
      navigate('/billing', { replace: true });
    }
  }, [user, navigate]);

  const normalizePlan = (rawPlan: unknown): SubscriptionTier => {
    switch (rawPlan) {
      case 'starter':
      case 'free':
        return 'starter';
      case 'job-ready':
      case 'basic':
        return 'job-ready';
      case 'career-accelerator':
      case 'premium':
        return 'career-accelerator';
      default:
        return 'starter';
    }
  };

  const loadUserPlan = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const plan = normalizePlan(userData?.subscriptionTier || userData?.subscriptionPlan);
        setSelectedPlan(plan);
      }
    } catch (err) {
      errorService.handleError(err, 'Error loading user plan');
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Primary source: payments collection from billing system
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);

      if (!paymentsSnapshot.empty) {
        const paymentTxns: Transaction[] = paymentsSnapshot.docs.map(paymentDoc => {
          const payment = paymentDoc.data();
          return {
            id: paymentDoc.id,
            date: payment.createdAt || null,
            description: `${payment.tier || 'Subscription'} payment`,
            amount: payment.totalAmount || 0,
            status:
              payment.status === 'succeeded'
                ? 'paid'
                : payment.status === 'pending'
                ? 'pending'
                : 'failed',
            type: 'subscription',
          };
        });
        setTransactions(paymentTxns);
        return;
      }

      // Fallback: legacy transactions collection
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(10)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const txns = transactionsSnapshot.docs.map(txnDoc => ({ id: txnDoc.id, ...txnDoc.data() })) as Transaction[];
      setTransactions(txns);
    } catch (err) {
      errorService.handleError(err, 'Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadMentors = async () => {
    try {
      const mentorsQuery = query(
        collection(db, 'users'),
        where('isMentor', '==', true),
        where('mentorStatus', '==', 'approved'),
        limit(50)
      );
      const mentorsSnapshot = await getDocs(mentorsQuery);
      const mentors = mentorsSnapshot.docs.map((mentorDoc) => {
        const data = mentorDoc.data() as Record<string, any>;
        return {
          id: mentorDoc.id,
          name: String(data.displayName || data.name || 'Mentor'),
          expertise: String(data.mentorExpertise || 'Mentorship'),
        };
      });

      setAvailableMentors(mentors);

      if (!selectedMentorId && mentors.length > 0) {
        const storedMentorId = sessionStorage.getItem(SELECTED_MENTOR_STORAGE_KEY) || '';
        const resolvedMentorId = mentors.find((m) => m.id === storedMentorId)?.id || mentors[0].id;
        setSelectedMentorId(resolvedMentorId);
        sessionStorage.setItem(SELECTED_MENTOR_STORAGE_KEY, resolvedMentorId);
      }
    } catch (err) {
      errorService.handleError(err, 'Error loading mentors for billing');
    }
  };

  const startSecureCheckout = (tier: SubscriptionTier) => {
    if (!selectedMentorId) {
      setToastMessage('Select a mentor first to continue to secure card entry.');
      return;
    }

    sessionStorage.setItem(SELECTED_MENTOR_STORAGE_KEY, selectedMentorId);
    navigate(`/billing/checkout?tier=${tier}&mentor=${selectedMentorId}`);
  };

  const handleSelectPlan = async (planId: SubscriptionTier) => {
    if (!user) return;

    try {
      setPlanLoading(planId);

      // Starter is free — switch directly without checkout
      if (planId === 'starter') {
        await updateDoc(doc(db, 'users', user.uid), {
          subscriptionTier: 'starter',
          subscriptionStatus: 'active',
          subscriptionUpdatedAt: Timestamp.now(),
        });
        setSelectedPlan('starter');
        setToastMessage('Switched to Starter plan.');
        return;
      }

      if (!selectedMentorId) {
        setToastMessage('Select a mentor first so billing can be linked correctly.');
        return;
      }

      sessionStorage.setItem(SELECTED_MENTOR_STORAGE_KEY, selectedMentorId);
      navigate(`/billing/checkout?tier=${planId}&mentor=${selectedMentorId}`);
    } catch (err) {
      errorService.handleError(err, 'Plan selection error');
      setToastMessage('Unable to start checkout. Please try again.');
    } finally {
      setPlanLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      setPortalLoading(true);
      const portal = await stripeService.createBillingPortalSession();
      window.location.href = portal.url;
    } catch (err) {
      errorService.handleError(err, 'Billing portal error');

      const message = String((err as any)?.message || '').toLowerCase();
      const missingCustomer =
        message.includes('no stripe customer found') ||
        message.includes('failed-precondition') ||
        message.includes('customer');

      if (missingCustomer) {
        if (!selectedMentorId) {
          setToastMessage('Select a mentor first, then choose a paid plan to enter card details.');
          return;
        }

        const setupTier: SubscriptionTier = selectedPlan === 'career-accelerator' ? 'career-accelerator' : 'job-ready';
        navigate(`/billing/checkout?tier=${setupTier}&mentor=${selectedMentorId}`);
        return;
      }

      setToastMessage('Unable to open billing portal right now.');
    } finally {
      setPortalLoading(false);
    }
  };

  const formatTransactionDate = (date: Timestamp | Date | null): string => {
    if (!date) return 'N/A';
    if (date instanceof Date) return date.toLocaleDateString();
    if (date instanceof Timestamp) return date.toDate().toLocaleDateString();
    return 'N/A';
  };

  const plans = SUBSCRIPTION_PLANS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">payments</span>
            <span className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">Billing & Payments</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">Manage Your Plan</h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
            {mentorId ? 'Complete your payment to book this mentorship session' : 'Choose the perfect plan for your mentorship journey'}
          </p>
          {!mentorId && (
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400 max-w-2xl mx-auto">
              Paid plans require a selected mentor so the subscription can be attached correctly.
            </p>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-sm font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-60 transition"
            >
              {portalLoading ? 'Opening Portal...' : 'Manage Subscription'}
            </button>
            <button
              onClick={() => navigate('/billing/manage')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition"
            >
              Subscription Center
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">person_search</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Select Mentor For Paid Plans</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Card details are entered securely on Stripe after you choose a paid plan.</p>
            </div>
          </div>

          <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Linked Mentor</label>
          <select
            value={selectedMentorId}
            onChange={(e) => {
              setSelectedMentorId(e.target.value);
              sessionStorage.setItem(SELECTED_MENTOR_STORAGE_KEY, e.target.value);
            }}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200"
          >
            <option value="">Select a mentor</option>
            {availableMentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>{mentor.name} - {mentor.expertise}</option>
            ))}
          </select>
        </div>

        {/* Session Payment (if coming from booking) */}
        {mentorId && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">event_available</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Secure Payment Required</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Card details are entered on Stripe and charges are processed there.</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Session Cost</span>
                <span className="text-3xl font-black text-gray-900 dark:text-white">${sessionCost}</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Card entry is secure and hosted by Stripe</span>
                  <span className="font-bold">PCI Compliant</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-700">
                  <span className="font-bold text-gray-900 dark:text-white">Activation</span>
                  <span className="font-black text-gray-900 dark:text-white">After successful charge</span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={() => startSecureCheckout('job-ready')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-blue-500/30 dark:shadow-blue-900/30 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">lock</span>
                Enter Card Details - Job-Ready
              </button>
              <button
                onClick={() => startSecureCheckout('career-accelerator')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-purple-500/30 dark:shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">workspace_premium</span>
                Enter Card Details - Career Accelerator
              </button>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border-2 transition-all hover:scale-105 ${
                plan.popular
                  ? 'border-blue-500 dark:border-blue-400 relative'
                  : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-6`}>
                <span className="material-symbols-outlined text-white text-3xl">workspace_premium</span>
              </div>

              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">{plan.subtitle}</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-gray-900 dark:text-white">${plan.priceMonthly}</span>
                <span className="text-gray-500 dark:text-gray-400 font-bold">/{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-green-500 text-xl flex-shrink-0">check_circle</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={planLoading !== null}
                className={`w-full py-3 rounded-xl font-black transition-all ${
                  selectedPlan === plan.id
                    ? `bg-gradient-to-r ${plan.color} text-white shadow-lg`
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                } disabled:opacity-60`}
              >
                {planLoading === plan.id
                  ? 'Processing...'
                  : selectedPlan === plan.id
                  ? 'Current Plan'
                  : plan.id === 'starter'
                  ? 'Switch to Starter'
                  : 'Continue to Card Entry'}
              </button>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">receipt_long</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Transaction History</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your recent payments and invoices</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">receipt</span>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {formatTransactionDate(txn.date)}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-gray-900 dark:text-white">{txn.description}</td>
                      <td className="py-4 px-4 text-sm font-black text-gray-900 dark:text-white">${txn.amount.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            txn.status === 'paid'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : txn.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleManageSubscription()}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">credit_card</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Payment Methods</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your payment options</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-6 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
              <p className="text-sm font-black text-gray-900 dark:text-white mb-2">Secure Card Entry</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Card details and saved payment methods are managed directly in Stripe's secure portal.
              </p>
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black disabled:opacity-60"
              >
                {portalLoading ? 'Opening Portal...' : 'Open Stripe Billing Portal'}
              </button>
            </div>

            <div className="rounded-2xl p-6 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
              <p className="text-sm font-black text-gray-900 dark:text-white mb-2">Subscription Management</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                View current plan, mentor linkage, usage, and billing history in one place.
              </p>
              <button
                onClick={() => navigate('/billing/manage')}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black"
              >
                Go To Subscription Center
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
