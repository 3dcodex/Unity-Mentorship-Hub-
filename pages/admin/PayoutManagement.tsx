import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';

interface Payout {
  id: string;
  mentorId: string;
  mentorName: string;
  amount: number;
  status: string;
  requestedAt: any;
  completedAt?: any;
  method: string;
}

const PayoutManagement: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    const payoutsSnap = await getDocs(collection(db, 'payouts'));
    const payoutsData = payoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payout));
    setPayouts(payoutsData);
  };

  const handleCompletePayout = async (payoutId: string) => {
    await updateDoc(doc(db, 'payouts', payoutId), {
      status: 'completed',
      completedAt: new Date()
    });
    loadPayouts();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Payout Management</h1>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Mentor</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Method</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Requested</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-t border-gray-100">
                  <td className="px-6 py-4 font-bold">{payout.mentorName}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">${payout.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">{payout.method}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                      payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {payout.requestedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {payout.status === 'pending' && (
                      <button
                        onClick={() => handleCompletePayout(payout.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200"
                      >
                        Mark Paid
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

export default PayoutManagement;
