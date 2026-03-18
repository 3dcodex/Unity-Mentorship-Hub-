import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../App';
import { db } from '../src/firebase';
import { SubscriptionTier } from '../types';
import { SUBSCRIPTION_PLANS } from '../src/config/subscriptionPlans';
import { stripeService } from '../services/stripeService';
import { errorService } from '../services/errorService';
import Toast from '../components/Toast';

const BillingCheckout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mentorName, setMentorName] = useState('Selected mentor');
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const tierParam = searchParams.get('tier') || '';
  const mentorId = searchParams.get('mentor') || '';

  const selectedTier = useMemo<SubscriptionTier | null>(() => {
    if (tierParam === 'starter' || tierParam === 'job-ready' || tierParam === 'career-accelerator') {
      return tierParam;
    }
    return null;
  }, [tierParam]);

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedTier);
  const selectedPrice = selectedPlan?.priceMonthly ?? null;

  useEffect(() => {
    if (!selectedTier || !mentorId) {
      setToastMessage('Missing checkout details. Please select a plan again.');
      return;
    }

    // Starter is free — redirect back, no checkout needed
    if (selectedTier === 'starter') {
      setToastMessage('Starter plan is free — no checkout required.');
      navigate('/billing', { replace: true });
      return;
    }

    const loadMentor = async () => {
      try {
        const mentorDoc = await getDoc(doc(db, 'users', mentorId));
        if (!mentorDoc.exists()) return;
        const mentorData = mentorDoc.data() as Record<string, any>;
        setMentorName(String(mentorData.displayName || mentorData.name || 'Selected mentor'));
      } catch (err) {
        errorService.handleError(err, 'Error loading mentor details for checkout');
      }
    };

    loadMentor();
  }, [mentorId, selectedTier, navigate]);

  const startCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedTier || !mentorId) {
      setToastMessage('Invalid checkout request. Please choose a plan again.');
      return;
    }

    try {
      setProcessing(true);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          pendingSubscriptionTier: selectedTier,
          pendingSubscriptionMentorId: mentorId,
          subscriptionUpdatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      const checkout = selectedTier === 'starter'
        ? await stripeService.createSetupSession({ mentorId })
        : await stripeService.createCheckoutSession({
            tier: selectedTier,
            mentorId,
            promotionCode: promoCode.trim() || undefined,
          });

      if (!checkout.checkoutUrl) {
        throw new Error('Checkout URL was not returned by Stripe session setup.');
      }

      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      errorService.handleError(err, 'Checkout redirect error');
      const message = String((err as any)?.message || '').toLowerCase();
      if (message.includes('missing stripe price configuration')) {
        setToastMessage('Billing is not fully configured yet. Please contact support to enable card checkout.');
      } else if (message.includes('unauthenticated')) {
        setToastMessage('Please sign in again, then retry checkout.');
      } else if (message.includes('mentor')) {
        setToastMessage('Selected mentor is not eligible for paid checkout. Choose another mentor.');
      } else if (message.includes('promotion code')) {
        setToastMessage('Promo code is invalid, expired, or not eligible for this plan.');
      } else {
        setToastMessage('Unable to open secure card entry. Please try again.');
      }
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-10 px-4">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white">credit_card</span>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Secure Checkout</p>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">Enter Card Details</h1>
            </div>
          </div>

          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">
            Card details are handled on Stripe's secure hosted page. Click continue to open card entry and complete your subscription.
          </p>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 mb-6 bg-gray-50 dark:bg-slate-900">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Plan</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{selectedPlan?.name || selectedTier || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Mentor</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">{mentorName}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Monthly Price</span>
              <span className="text-sm font-black text-gray-900 dark:text-white">
                {selectedPrice !== null ? `$${selectedPrice}/month` : 'N/A'}
              </span>
            </div>
          </div>

          {selectedTier !== 'starter' && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 mb-6">
              <p className="text-sm font-black text-emerald-800 dark:text-emerald-300 mb-3">Enter promo code (or coupon ID) to validate and apply before redirecting to Stripe.</p>
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="w-full rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/billing')}
              className="sm:flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 font-black text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              Back To Billing
            </button>
            <button
              onClick={startCheckout}
              disabled={processing || !selectedTier || !mentorId}
              className="sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition"
            >
              {processing ? 'Opening Stripe...' : 'Continue To Secure Card Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingCheckout;
