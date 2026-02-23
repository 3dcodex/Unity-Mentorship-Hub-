import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../src/firebase';

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  type: string;
  reason: string;
  description: string;
  status: string;
  createdAt: any;
  adminNotes?: string;
}

const ReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const reportsSnap = await getDocs(collection(db, 'reports'));
    const reportsData = reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
    setReports(reportsData);
  };

  const handleResolve = async (reportId: string, action: string) => {
    await updateDoc(doc(db, 'reports', reportId), {
      status: 'resolved',
      resolution: action,
      adminNotes,
      resolvedAt: new Date()
    });
    
    setShowModal(false);
    setAdminNotes('');
    loadReports();
  };

  const handleDismiss = async (reportId: string) => {
    await updateDoc(doc(db, 'reports', reportId), {
      status: 'dismissed',
      adminNotes,
      dismissedAt: new Date()
    });
    
    setShowModal(false);
    setAdminNotes('');
    loadReports();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Reports & Disputes</h1>

        <div className="grid gap-6">
          {reports.filter(r => r.status === 'open').map((report) => (
            <div key={report.id} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    report.type === 'mentor_misconduct' ? 'bg-red-100 text-red-700' :
                    report.type === 'student_misconduct' ? 'bg-orange-100 text-orange-700' :
                    report.type === 'payment_issue' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {report.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                  {report.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">Reporter</p>
                  <p className="font-bold text-gray-900">{report.reporterName}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">Reported User</p>
                  <p className="font-bold text-gray-900">{report.reportedUserName}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-bold text-gray-500 mb-1">Reason</p>
                <p className="text-gray-900">{report.reason}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-bold text-gray-500 mb-1">Description</p>
                <p className="text-gray-900">{report.description}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-bold text-gray-500 mb-1">Reported On</p>
                <p className="text-gray-600">{report.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setShowModal(true);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                >
                  Review & Resolve
                </button>
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setShowModal(true);
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}

          {reports.filter(r => r.status === 'open').length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">check_circle</span>
              <p className="text-xl font-bold text-gray-600">No open reports</p>
            </div>
          )}
        </div>

        {reports.filter(r => r.status !== 'open').length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Resolved Reports</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Reporter</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Reported User</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.filter(r => r.status !== 'open').map((report) => (
                    <tr key={report.id} className="border-t border-gray-100">
                      <td className="px-6 py-4 text-sm">{report.type}</td>
                      <td className="px-6 py-4">{report.reporterName}</td>
                      <td className="px-6 py-4">{report.reportedUserName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {report.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black mb-4">Resolve Report</h2>
            <textarea
              placeholder="Admin notes..."
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
                onClick={() => handleDismiss(selectedReport.id)}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleResolve(selectedReport.id, 'resolved')}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;
