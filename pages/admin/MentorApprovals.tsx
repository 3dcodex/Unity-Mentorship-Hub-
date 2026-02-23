import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';

interface MentorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  expertise: string[];
  credentials: string;
  experience: string;
  status: string;
  appliedAt: any;
  documents: string[];
  adminNotes: string;
}

const MentorApprovals: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<MentorApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const appsSnap = await getDocs(query(collection(db, 'mentorApplications'), where('status', '==', 'pending')));
    const appsData = appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MentorApplication));
    setApplications(appsData);
  };

  const handleApprove = async (appId: string, userId: string) => {
    await updateDoc(doc(db, 'mentorApplications', appId), {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: currentAdmin?.uid,
      adminNotes
    });
    
    await updateDoc(doc(db, 'users', userId), {
      role: 'mentor',
      mentorStatus: 'active',
      isMentor: true,
      mentorApprovedBy: currentAdmin?.uid,
      mentorApprovedAt: new Date()
    });
    
    // Log admin action
    await setDoc(doc(db, 'adminActions', `${currentAdmin?.uid}_${Date.now()}`), {
      adminId: currentAdmin?.uid,
      adminEmail: currentAdmin?.email,
      action: 'approve_mentor',
      targetUserId: userId,
      details: { applicationId: appId, notes: adminNotes },
      timestamp: new Date()
    });
    
    // Send notification to user
    await setDoc(doc(db, 'notifications', `${userId}_${Date.now()}`), {
      userId,
      type: 'mentor_approved',
      title: 'Mentor Application Approved! 🎉',
      message: 'Congratulations! Your mentor application has been approved. You can now start mentoring students.',
      read: false,
      createdAt: new Date(),
      link: '/profile'
    });
    
    setShowModal(false);
    setAdminNotes('');
    loadApplications();
  };

  const handleReject = async (appId: string) => {
    if (!selectedApp) return;
    
    await updateDoc(doc(db, 'mentorApplications', appId), {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: currentAdmin?.uid,
      adminNotes
    });
    
    await updateDoc(doc(db, 'users', selectedApp.userId), {
      mentorApplicationStatus: 'rejected'
    });
    
    // Log admin action
    await setDoc(doc(db, 'adminActions', `${currentAdmin?.uid}_${Date.now()}`), {
      adminId: currentAdmin?.uid,
      adminEmail: currentAdmin?.email,
      action: 'reject_mentor',
      targetUserId: selectedApp.userId,
      details: { applicationId: appId, notes: adminNotes },
      timestamp: new Date()
    });
    
    // Send notification to user
    await setDoc(doc(db, 'notifications', `${selectedApp.userId}_${Date.now()}`), {
      userId: selectedApp.userId,
      type: 'mentor_rejected',
      title: 'Mentor Application Update',
      message: `Your mentor application has been reviewed. ${adminNotes || 'Please contact support for more information.'}`,
      read: false,
      createdAt: new Date()
    });
    
    setShowModal(false);
    setAdminNotes('');
    loadApplications();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Mentor Approvals</h1>

        <div className="grid gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{app.name}</h3>
                  <p className="text-gray-600">{app.email}</p>
                </div>
                <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold">
                  Pending Review
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-2">Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {app.expertise?.map((exp, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-2">Applied</p>
                  <p className="text-gray-900">{app.appliedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-bold text-gray-500 mb-2">Credentials</p>
                <p className="text-gray-900">{app.credentials}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-bold text-gray-500 mb-2">Experience</p>
                <p className="text-gray-900">{app.experience}</p>
              </div>

              {app.documents && app.documents.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-500 mb-2">Documents</p>
                  <div className="flex gap-2">
                    {app.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200"
                      >
                        View Document {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedApp(app);
                    setShowModal(true);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedApp(app);
                    setShowModal(true);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {applications.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">check_circle</span>
              <p className="text-xl font-bold text-gray-600">No pending applications</p>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black mb-4">Review Application</h2>
            <p className="text-gray-600 mb-4">{selectedApp.name}</p>
            <textarea
              placeholder="Admin notes (optional)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 outline-none focus:border-green-500"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedApp.id)}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedApp.id, selectedApp.userId)}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorApprovals;
