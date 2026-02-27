import React, { useState, useEffect } from 'react';
import { db } from '../src/firebase';
import { collection, query, getDocs, doc, updateDoc, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../App';

interface MentorApplication {
  id: string;
  userId: string;
  userName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: any;
  userRole: string;
}

const AdminMentorRequests: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [darkMode] = useState(localStorage.getItem('unity_dark_mode') === 'true');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const q = query(collection(db, 'mentorApplications'));
      const snapshot = await getDocs(q);
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MentorApplication[];
      setApplications(apps.sort((a, b) => b.appliedAt?.seconds - a.appliedAt?.seconds));
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId: string, userId: string) => {
    setProcessing(appId);
    try {
      await updateDoc(doc(db, 'mentorApplications', appId), {
        status: 'approved',
        reviewedAt: Timestamp.now(),
        reviewedBy: user?.uid,
      });
      await updateDoc(doc(db, 'users', userId), {
        isMentor: true,
        mentorApprovedAt: Timestamp.now(),
      });
      
      // Create notification for user
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        userId,
        type: 'mentor_approved',
        title: '🎉 Mentor Application Approved!',
        message: 'Congratulations! Your mentor application has been approved. You can now start mentoring students.',
        read: false,
        createdAt: Timestamp.now(),
      });
      
      await loadApplications();
    } catch (err) {
      console.error('Error approving:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (appId: string) => {
    setProcessing(appId);
    try {
      await updateDoc(doc(db, 'mentorApplications', appId), {
        status: 'rejected',
        reviewedAt: Timestamp.now(),
        reviewedBy: user?.uid,
      });
      await loadApplications();
    } catch (err) {
      console.error('Error rejecting:', err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Mentor Applications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Review and manage mentor applications</p>
        </div>

        <div className="grid gap-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl">
              <span className="material-symbols-outlined text-6xl text-gray-400">inbox</span>
              <p className="mt-4 text-gray-600 dark:text-gray-400">No applications yet</p>
            </div>
          ) : (
            applications.map(app => (
              <div key={app.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border ${
                app.status === 'pending' ? 'border-yellow-200 dark:border-yellow-700' :
                app.status === 'approved' ? 'border-green-200 dark:border-green-700' :
                'border-red-200 dark:border-red-700'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{app.userName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        app.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-semibold">Email:</span> {app.email}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-semibold">Role:</span> {app.userRole}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-semibold">User ID:</span> {app.userId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Applied: {app.appliedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </p>
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(app.id, app.userId)}
                        disabled={processing === app.id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={processing === app.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMentorRequests;
