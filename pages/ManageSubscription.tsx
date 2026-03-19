import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '../App';
import { db } from '../src/firebase';
import { stripeService } from '../services/stripeService';
import { errorService } from '../services/errorService';
import { SubscriptionTier } from '../types';
import { SUBSCRIPTION_PLANS } from '../src/config/subscriptionPlans';
import Toast from '../components/Toast';

interface BillingTxn {
  id: string;
  description: string;
  amount: number;
  status: string;
  date: Timestamp | null;
}

const formatTier = (tier: SubscriptionTier | string | null | undefined) => {
  return SUBSCRIPTION_PLANS.find(p => p.id === tier)?.name || 'Starter';
};

const ManageSubscription: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('starter');
  const [subscriptionStatus, setSubscriptionStatus] = useState('active');
  const [mentorName, setMentorName] = useState('Not linked');
  const [linkedMentorId, setLinkedMentorId] = useState('');
  const [sessionsPerMonth, setSessionsPerMonth] = useState(1);
  const [sessionsUsedThisMonth, setSessionsUsedThisMonth] = useState(0);
  const [transactions, setTransactions] = useState<BillingTxn[]>([]);

  useEffect(() => {
    if (user) {
      loadBillingData();
    }
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const userRef = doc(db, 'users', user.uid);
      let activeSubSnap = await getDocs(
        query(
          collection(db, 'subscriptions'),
          where('userId', '==', user.uid),
          where('status', '==', 'active'),
          limit(1)
        )
      );

      if (activeSubSnap.empty) {
        activeSubSnap = await getDocs(
          query(
            collection(db, 'subscriptions'),
            where('userId', '==', user.uid),
            where('status', '==', 'trialing'),
            limit(1)
          )
        );
      }

      const [userSnap] = await Promise.all([getDoc(userRef)]);

      const activeSub = activeSubSnap.empty ? null : (activeSubSnap.docs[0].data() as Record<string, any>);

      if (userSnap.exists()) {
        const data = userSnap.data() as Record<string, any>;
        const tier = ((activeSub?.tier || data.subscriptionTier || data.subscriptionPlan || 'starter') as SubscriptionTier);
        const resolvedMentorId = String(data.subscriptionMentorId || activeSub?.mentorId || '');

        setSubscriptionTier(tier);
        setSubscriptionStatus(String(activeSub?.status || data.subscriptionStatus || 'active'));
        setSessionsPerMonth(Number(activeSub?.sessionsPerMonth || data.sessionsPerMonth || (tier === 'career-accelerator' ? 4 : tier === 'job-ready' ? 2 : 1)));
        setSessionsUsedThisMonth(Number(data.sessionsUsedThisMonth || 0));

        if (resolvedMentorId) {
          setLinkedMentorId(resolvedMentorId);
          const mentorSnap = await getDoc(doc(db, 'users', resolvedMentorId));
          if (mentorSnap.exists()) {
            const mentorData = mentorSnap.data() as Record<string, any>;
            setMentorName(String(mentorData.displayName || mentorData.name || 'Linked mentor'));
          }
        }
      }

      const paymentsSnap = await getDocs(
        query(
          collection(db, 'payments'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(8)
        )
      );

      const txns: BillingTxn[] = paymentsSnap.docs.map((paymentDoc) => {
        const payment = paymentDoc.data() as Record<string, any>;
        return {
          id: paymentDoc.id,
          description: `${String(payment.tier || 'Subscription')} payment`,
          amount: Number(payment.totalAmount || 0),
          status: String(payment.status || 'pending'),
          date: (payment.createdAt as Timestamp) || null,
        };
      });
      setTransactions(txns);
    } catch (err) {
      errorService.handleError(err, 'Error loading subscription center');
      setToastMessage('Unable to load subscription details right now.');
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    try {
      setPortalLoading(true);
      const portal = await stripeService.createBillingPortalSession(`${window.location.origin}/billing/manage`);
      window.location.assign(portal.url);
    } catch (err) {
      errorService.handleError(err, 'Error opening billing portal');

      const message = String((err as any)?.message || '').toLowerCase();
      const missingCustomer =
        message.includes('no stripe customer found') ||
        message.includes('failed-precondition') ||
        message.includes('customer');

      if (missingCustomer && linkedMentorId) {
        const setupTier: SubscriptionTier = subscriptionTier === 'career-accelerator' ? 'career-accelerator' : 'job-ready';
        navigate(`/billing/checkout?tier=${setupTier}&mentor=${linkedMentorId}`);
        return;
      }

      if (missingCustomer) {
        navigate('/billing');
        setToastMessage('No payment profile yet. Choose a paid plan to enter card details.');
        return;
      }

      setToastMessage('Unable to open Stripe billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (value: Timestamp | null) => {
    if (!value) return 'N/A';
    return value.toDate().toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Billing</p>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Subscription Center</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your plan, payment method, and billing history.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/billing')}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-black text-gray-700 dark:text-gray-200"
              >
                Change Plan
              </button>
              {linkedMentorId && (
                <button
                  onClick={() => {
                    const setupTier: SubscriptionTier = subscriptionTier === 'career-accelerator' ? 'career-accelerator' : 'job-ready';
                    navigate(`/billing/checkout?tier=${setupTier}&mentor=${linkedMentorId}`);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black"
                >
                  Enter Card Details
                </button>
              )}
              <button
                onClick={openBillingPortal}
                disabled={portalLoading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black disabled:opacity-60"
              >
                {portalLoading ? 'Opening...' : 'Manage Card & Invoices'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Current Plan</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">{formatTier(subscriptionTier)}</p>
            <button
              onClick={() => navigate('/billing')}
              className="mt-4 text-sm font-black text-blue-600 dark:text-blue-400 hover:underline"
            >
              Change or compare plans
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</p>
            <p className={`text-2xl font-black mt-2 ${
              subscriptionStatus === 'active' ? 'text-green-600 dark:text-green-400' :
              subscriptionStatus === 'past_due' ? 'text-yellow-600 dark:text-yellow-400' :
              subscriptionStatus === 'cancelled' ? 'text-red-600 dark:text-red-400' :
              'text-gray-900 dark:text-white'
            }`}>{subscriptionStatus}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Linked Mentor</p>
            <p className="text-lg font-black text-gray-900 dark:text-white mt-2 truncate">{mentorName}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Usage</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">{sessionsUsedThisMonth}/{sessionsPerMonth}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Recent Billing Activity</h2>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading billing activity...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</th>
                    <th className="text-left py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="text-left py-3 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="py-3 text-sm font-medium text-gray-600 dark:text-gray-400">{formatDate(txn.date)}</td>
                      <td className="py-3 text-sm font-bold text-gray-900 dark:text-white">{txn.description}</td>
                      <td className="py-3 text-sm font-black text-gray-900 dark:text-white">${txn.amount.toFixed(2)}</td>
                      <td className="py-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          txn.status === 'succeeded' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          txn.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          txn.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                          txn.status === 'refunded' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                          'bg-gray-100 text-gray-700'
                        }`}>{txn.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageSubscription;
