import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../src/firebase';

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('unity_onboarding_complete');
      localStorage.removeItem('unity_user_name');
      localStorage.removeItem('unity_user_role');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-12 border border-amber-200 dark:border-slate-700">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full shadow-lg">
            <span className="material-symbols-outlined text-white text-5xl">pending</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
              Account Pending Approval
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              Thank you for signing up as a Working Professional!
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-amber-200 dark:border-slate-600">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Your account is currently under review by our admin team. This process typically takes 24-48 hours. 
              You'll receive an email notification once your account has been approved and you can start mentoring students.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3 text-left">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-1">check_circle</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Profile Created</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your professional profile has been successfully created</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-1">schedule</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Under Review</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admin team is verifying your credentials</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left opacity-50">
              <span className="material-symbols-outlined text-gray-400 mt-1">verified</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Approval & Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">You'll receive full access once approved</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-black shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
