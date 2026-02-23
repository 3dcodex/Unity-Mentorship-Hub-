import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';

const NotificationsManagement: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [type, setType] = useState('announcement');

  const handleSendNotification = async () => {
    if (!title || !message) {
      alert('Please fill in all fields');
      return;
    }

    await addDoc(collection(db, 'notifications'), {
      title,
      message,
      targetAudience,
      type,
      createdAt: new Date(),
      sentBy: 'admin'
    });

    alert('Notification sent successfully!');
    setTitle('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Notification Management</h1>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Send Notification</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Notification message..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="mentors">Mentors Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                >
                  <option value="announcement">Announcement</option>
                  <option value="alert">Alert</option>
                  <option value="promotion">Promotion</option>
                  <option value="update">Update</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSendNotification}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700"
            >
              Send Notification
            </button>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
          <h3 className="text-xl font-black text-gray-900 mb-4">Quick Templates</h3>
          <div className="grid gap-3">
            <button
              onClick={() => {
                setTitle('Platform Maintenance');
                setMessage('We will be performing scheduled maintenance on [DATE] from [TIME] to [TIME]. The platform may be temporarily unavailable during this period.');
                setType('alert');
              }}
              className="text-left px-4 py-3 bg-white rounded-xl hover:shadow-lg transition-all"
            >
              <p className="font-bold text-gray-900">Maintenance Notice</p>
              <p className="text-sm text-gray-600">Scheduled maintenance announcement</p>
            </button>
            
            <button
              onClick={() => {
                setTitle('New Feature Launch');
                setMessage('We\'re excited to announce a new feature! Check out [FEATURE NAME] to enhance your experience.');
                setType('announcement');
              }}
              className="text-left px-4 py-3 bg-white rounded-xl hover:shadow-lg transition-all"
            >
              <p className="font-bold text-gray-900">Feature Announcement</p>
              <p className="text-sm text-gray-600">New feature launch notification</p>
            </button>
            
            <button
              onClick={() => {
                setTitle('Special Promotion');
                setMessage('Limited time offer! Get [DISCOUNT]% off on all mentorship sessions. Use code: [CODE]');
                setType('promotion');
              }}
              className="text-left px-4 py-3 bg-white rounded-xl hover:shadow-lg transition-all"
            >
              <p className="font-bold text-gray-900">Promotion Campaign</p>
              <p className="text-sm text-gray-600">Special offer notification</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsManagement;
