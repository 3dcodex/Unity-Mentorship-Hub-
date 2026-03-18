import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db, app } from '../../src/firebase';
import { COMMISSION_RATES } from '../../src/config/subscriptionPlans';
import { errorService } from '../../services/errorService';
import Toast from '../../components/Toast';

interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  mentorId: string;
  mentorName: string;
  totalAmount: number;
  mentorAmount: number;
  platformFee: number;
  status: string;
  tier?: string;
  stripePaymentIntentId?: string;
  createdAt: Timestamp | null;
  failureReason?: string;
}

const functions = getFunctions(app);

const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const paymentsQuery = query(
        collection(db, 'payments'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(paymentsQuery);
      const data = snap.docs.map(d => {
        const raw = d.data() as Record<string, any>;
        return {
          id: d.id,
          userId: raw.userId || '',
          userName: raw.userName || 'Unknown',
          userEmail: raw.userEmail || '',
          mentorId: raw.mentorId || '',
          mentorName: raw.mentorName || '',
          totalAmount: Number(raw.totalAmount || 0),
          mentorAmount: Number(raw.mentorAmount || 0),
          platformFee: Number(raw.platformFee || 0),
          status: String(raw.status || 'pending'),
          tier: raw.tier,
          stripePaymentIntentId: raw.stripePaymentIntentId,
          createdAt: (raw.createdAt as Timestamp) || null,
          failureReason: raw.failureReason,
        } as PaymentRecord;
      });
      setPayments(data);
    } catch (err) {
      errorService.handleError(err, 'Error loading payments');
      setToastMessage('Failed to load payment data.');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const succeeded = payments.filter(p => p.status === 'succeeded');
    const totalRevenue = succeeded.reduce((s, p) => s + p.totalAmount, 0);
    const platformCommission = succeeded.reduce((s, p) => s + p.platformFee, 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.totalAmount, 0);
    const refunded = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.totalAmount, 0);
    const failed = payments.filter(p => p.status === 'failed').length;
    return { totalRevenue, platformCommission, pendingPayments, refunded, failed };
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.userName.toLowerCase().includes(term) ||
        p.userEmail.toLowerCase().includes(term) ||
        p.mentorName.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
      );
    });
  }, [payments, searchTerm, statusFilter]);

  const handleRefund = async (payment: PaymentRecord) => {
    if (!payment.stripePaymentIntentId) {
      setToastMessage('Cannot refund: no Stripe payment intent linked to this payment.');
      return;
    }

    const confirmed = window.confirm(
      `Refund $${payment.totalAmount.toFixed(2)} to ${payment.userName}?\n\nThis will process a real refund through Stripe and cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setRefundingId(payment.id);
      const processRefund = httpsCallable(functions, 'processStripeRefund');
      await processRefund({
        paymentId: payment.id,
        paymentIntentId: payment.stripePaymentIntentId,
        amount: payment.totalAmount,
        reason: 'requested_by_admin',
      });
      setToastMessage(`Refund of $${payment.totalAmount.toFixed(2)} processed successfully.`);
      await loadPayments();
    } catch (err) {
      errorService.handleError(err, 'Refund processing error');
      setToastMessage('Refund failed. Check Stripe dashboard for details.');
    } finally {
      setRefundingId(null);
    }
  };

  const formatDate = (ts: Timestamp | null) => {
    if (!ts) return 'N/A';
    return ts.toDate().toLocaleDateString();
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      succeeded: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Payment & Billing Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Platform commission: {COMMISSION_RATES.PLATFORM_PERCENTAGE * 100}% · Mentor share: {COMMISSION_RATES.MENTOR_PERCENTAGE * 100}%
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">${stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Platform Commission</p>
            <p className="text-2xl font-black text-green-600 dark:text-green-400">${stats.platformCommission.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">${stats.pendingPayments.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Refunded</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">${stats.refunded.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Failed</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.failed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex-shrink-0">All Payments</h2>
            <div className="flex-1" />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-gray-200 w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-900 text-sm font-bold text-gray-800 dark:text-gray-200"
            >
              <option value="all">All Statuses</option>
              <option value="succeeded">Succeeded</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading payments...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">receipt_long</span>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {payments.length === 0 ? 'No payments recorded yet.' : 'No payments match your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mentor</th>
                    <th className="px-5 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-5 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform Fee</th>
                    <th className="px-5 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(p.createdAt)}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{p.userName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.userEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">{p.mentorName || '—'}</td>
                      <td className="px-5 py-4 text-sm font-black text-gray-900 dark:text-white">${p.totalAmount.toFixed(2)}</td>
                      <td className="px-5 py-4 text-sm font-bold text-green-600 dark:text-green-400">${p.platformFee.toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${statusBadge(p.status)}`}>
                          {p.status}
                        </span>
                        {p.failureReason && (
                          <p className="text-xs text-red-500 mt-1 truncate max-w-[160px]" title={p.failureReason}>{p.failureReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {p.status === 'succeeded' && (
                          <button
                            onClick={() => handleRefund(p)}
                            disabled={refundingId === p.id}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-black hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition"
                          >
                            {refundingId === p.id ? 'Processing...' : 'Refund'}
                          </button>
                        )}
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

export default PaymentManagement;
