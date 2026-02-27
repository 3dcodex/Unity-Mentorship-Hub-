import React, { useState, useEffect } from 'react';
import { db } from '../../src/firebase';
import { collection, getDocs, addDoc, Timestamp, query, orderBy } from 'firebase/firestore';

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: any;
  status: string;
}

const NewsletterManagement: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      const q = query(collection(db, 'newsletter_subscribers'), orderBy('subscribedAt', 'desc'));
      const snapshot = await getDocs(q);
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subscriber[];
      setSubscribers(subs);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setSending(true);
    setStatusMessage('');

    try {
      await addDoc(collection(db, 'newsletters'), {
        subject,
        message,
        sentAt: Timestamp.now(),
        recipientCount: subscribers.filter(s => s.status === 'active').length,
        status: 'sent'
      });

      setStatusMessage('Newsletter sent successfully!');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error sending newsletter:', error);
      setStatusMessage('Failed to send newsletter.');
    } finally {
      setSending(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Newsletter Management</h1>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
            {subscribers.filter(s => s.status === 'active').length} Active Subscribers
          </div>
        </div>

        {/* Send Newsletter */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Send Newsletter</h2>
          <form onSubmit={handleSendNewsletter} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Newsletter'}
            </button>
            {statusMessage && (
              <p className={`text-sm font-medium ${statusMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {statusMessage}
              </p>
            )}
          </form>
        </div>

        {/* Subscribers List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Subscribers</h2>
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase">Subscribed</th>
                    <th className="text-left py-3 px-4 text-xs font-black text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{sub.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {sub.subscribedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          sub.status === 'active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {sub.status}
                        </span>
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

export default NewsletterManagement;
