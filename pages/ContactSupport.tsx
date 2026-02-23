import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useAuth } from '../App';

const ContactSupport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a support ticket');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'supportTickets'), {
        userId: user.uid,
        userEmail: user.email,
        userName: localStorage.getItem('unity_user_name') || user.email,
        subject,
        category,
        message,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        responses: []
      });

      alert('Support ticket submitted successfully! We will respond within 24 hours.');
      navigate('/help');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <button onClick={() => navigate('/help')} className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6">
        <span className="material-symbols-outlined">arrow_back</span>
        <span className="font-bold">Back to Help Center</span>
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Contact Support</h1>
        <p className="text-gray-600 mb-8">Submit a ticket and our team will respond within 24 hours</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
              required
            >
              <option value="general">General Inquiry</option>
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing & Payments</option>
              <option value="account">Account Issue</option>
              <option value="mentor">Mentor Related</option>
              <option value="session">Session Issue</option>
              <option value="report">Report Abuse</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide detailed information about your issue..."
              rows={8}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-lg disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactSupport;
