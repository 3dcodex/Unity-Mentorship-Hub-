import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, getDocs, query, where, orderBy, limit, addDoc, Timestamp } from 'firebase/firestore';

interface Transaction {
  id: string;
  date: any;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  type: 'session' | 'subscription' | 'refund';
}

const Billing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'basic' | 'premium'>('free');
  
  // Check if coming from mentorship booking
  const searchParams = new URLSearchParams(location.search);
  const mentorId = searchParams.get('mentor');
  const sessionCost = searchParams.get('cost') || '25';

  useEffect(() => {
    if (user) {
      loadTransactions();
      loadUserPlan();
    }
  }, [user]);

  const loadUserPlan = async () => {
    if (!user) return;
    try {
      const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(firestoreDoc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const plan = userDoc.data()?.subscriptionPlan || 'free';
        setSelectedPlan(plan);
      }
    } catch (err) {
      console.error('Error loading user plan:', err);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const txns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      setTransactions(txns);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (amount: number, description: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount,
        description,
        status: 'paid',
        type: 'session',
        date: Timestamp.now(),
      });
      
      // Create payment notification
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: 'payment',
        title: 'Payment Confirmed',
        message: `Payment of $${amount.toFixed(2)} for ${description} was successful`,
        read: false,
        createdAt: Timestamp.now(),
        actionUrl: '/billing',
      });
      
      alert('Payment successful!');
      if (mentorId) {
        navigate(`/quick-chat?user=${mentorId}`);
      } else {
        loadTransactions();
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment failed. Please try again.');
    }
  };

  const handleSelectPlan = async (planId: 'free' | 'basic' | 'premium') => {
    if (!user) return;
    try {
      const { doc: firestoreDoc, setDoc } = await import('firebase/firestore');
      await setDoc(firestoreDoc(db, 'users', user.uid), {
        subscriptionPlan: planId,
        subscriptionUpdatedAt: Timestamp.now(),
      }, { merge: true });
      setSelectedPlan(planId);
      alert(`Successfully subscribed to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan!`);
    } catch (err) {
      console.error('Plan selection error:', err);
      alert('Failed to update plan. Please try again.');
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      features: ['1 mentor session/month', 'Community access', 'Basic resources', 'Email support'],
      color: 'from-gray-500 to-gray-600',
      popular: false,
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      period: 'month',
      features: ['5 mentor sessions/month', 'Priority matching', 'All resources', 'Chat support', 'Resume reviews'],
      color: 'from-blue-500 to-indigo-600',
      popular: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 79,
      period: 'month',
      features: ['Unlimited sessions', 'Dedicated mentor', 'Career coaching', '24/7 support', 'Mock interviews', 'Job referrals'],
      color: 'from-purple-500 to-pink-600',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
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
        </div>

        {/* Session Payment (if coming from booking) */}
        {mentorId && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">event_available</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Session Payment</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Complete payment to confirm your booking</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Session Cost</span>
                <span className="text-3xl font-black text-gray-900 dark:text-white">${sessionCost}</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Platform Fee (10%)</span>
                  <span className="font-bold">${(parseFloat(sessionCost) * 0.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-700">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-black text-gray-900 dark:text-white">${(parseFloat(sessionCost) * 1.1).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePayment(parseFloat(sessionCost) * 1.1, 'Mentorship Session')}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-500/30 dark:shadow-green-900/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">lock</span>
              Pay Securely
            </button>
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

              <div className={`size-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-6`}>
                <span className="material-symbols-outlined text-white text-3xl">workspace_premium</span>
              </div>

              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl font-black text-gray-900 dark:text-white">${plan.price}</span>
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
                onClick={() => handleSelectPlan(plan.id as any)}
                className={`w-full py-3 rounded-xl font-black transition-all ${
                  selectedPlan === plan.id
                    ? `bg-gradient-to-r ${plan.color} text-white shadow-lg`
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {selectedPlan === plan.id ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
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
              <div className="size-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
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
                        {txn.date?.toDate?.().toLocaleDateString() || 'N/A'}
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
                        <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-bold flex items-center gap-1">
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
            <div className="size-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">credit_card</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Payment Methods</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your payment options</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-xs font-bold opacity-80 mb-4">Primary Card</p>
                <p className="text-2xl font-black mb-6 tracking-wider">•••• •••• •••• 4242</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-80">Expires</p>
                    <p className="font-black">12/25</p>
                  </div>
                  <span className="material-symbols-outlined text-4xl opacity-20">credit_card</span>
                </div>
              </div>
            </div>

            <button className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col items-center justify-center gap-3 group">
              <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">add_circle</span>
              <span className="font-bold text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Add New Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
