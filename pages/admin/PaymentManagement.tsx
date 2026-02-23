import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: string;
  status: string;
  paymentMethod: string;
  createdAt: any;
  sessionId?: string;
}

const PaymentManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformCommission: 0,
    pendingPayments: 0,
    refunded: 0
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const transSnap = await getDocs(collection(db, 'transactions'));
    const transData = transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    setTransactions(transData);
    
    const totalRevenue = transData.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
    const platformCommission = totalRevenue * 0.1;
    const pendingPayments = transData.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
    const refunded = transData.filter(t => t.status === 'refunded').reduce((sum, t) => sum + t.amount, 0);
    
    setStats({ totalRevenue, platformCommission, pendingPayments, refunded });
  };

  const handleRefund = async (transactionId: string) => {
    if (!confirm('Are you sure you want to issue a refund?')) return;
    
    await updateDoc(doc(db, 'transactions', transactionId), {
      status: 'refunded',
      refundedAt: new Date(),
      refundedBy: 'admin'
    });
    
    loadTransactions();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Payment & Billing Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-gray-500 mb-2">Total Revenue</p>
            <p className="text-3xl font-black text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-gray-500 mb-2">Platform Commission</p>
            <p className="text-3xl font-black text-green-600">${stats.platformCommission.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-gray-500 mb-2">Pending Payments</p>
            <p className="text-3xl font-black text-yellow-600">${stats.pendingPayments.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm font-bold text-gray-500 mb-2">Refunded</p>
            <p className="text-3xl font-black text-red-600">${stats.refunded.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-black text-gray-900">All Transactions</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Transaction ID</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((trans) => (
                <tr key={trans.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {trans.id.substring(0, 12)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{trans.userName}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ${trans.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {trans.type}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      trans.status === 'completed' ? 'bg-green-100 text-green-700' :
                      trans.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      trans.status === 'refunded' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {trans.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {trans.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {trans.status === 'completed' && (
                      <button
                        onClick={() => handleRefund(trans.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;
