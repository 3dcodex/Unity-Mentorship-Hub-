import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useAuth } from '../App';
import { useToast } from './AdminToast';
import LoadingSpinner from './LoadingSpinner';

interface SuspensionModalProps {
  userId: string;
  userName: string;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SuspensionModal: React.FC<SuspensionModalProps> = ({
  userId,
  userName,
  userEmail,
  onClose,
  onSuccess
}) => {
  const { user: currentAdmin } = useAuth();
  const [reason, setReason] = useState('');
  const [durationType, setDurationType] = useState<'permanent' | 'temporary'>('permanent');
  const [duration, setDuration] = useState(24); // hours
  const [blockIP, setBlockIP] = useState(false);
  const [blockDevice, setBlockDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const handleSuspend = async () => {
    if (!reason.trim()) {
      showToast('Please provide a reason for suspension', 'error');
      return;
    }

    setLoading(true);
    try {
      const now = Timestamp.now();
      const expiresAt = durationType === 'temporary' 
        ? Timestamp.fromDate(new Date(Date.now() + duration * 60 * 60 * 1000))
        : null;

      // Update user status
      await updateDoc(doc(db, 'users', userId), {
        status: 'suspended',
        suspendedAt: now,
        suspendedBy: currentAdmin?.uid,
        suspendedReason: reason,
        suspensionExpires: expiresAt,
        suspensionType: durationType
      });

      // Log suspension history
      await addDoc(collection(db, 'suspensionHistory'), {
        userId,
        userName,
        userEmail,
        reason,
        durationType,
        duration: durationType === 'temporary' ? duration : null,
        suspendedBy: currentAdmin?.uid,
        suspendedByName: currentAdmin?.email || 'Admin',
        suspendedAt: now,
        expiresAt,
        blockIP,
        blockDevice,
        status: 'active'
      });

      // Log admin action
      await addDoc(collection(db, 'adminActions'), {
        adminId: currentAdmin?.uid,
        adminName: currentAdmin?.email || 'Admin',
        action: 'suspend_user',
        targetUserId: userId,
        targetUserName: userName,
        details: JSON.stringify({
          reason,
          durationType,
          duration: durationType === 'temporary' ? duration : null,
          blockIP,
          blockDevice
        }),
        timestamp: now
      });

      // TODO: Implement IP/Device blocking if needed
      if (blockIP) {
        // Add IP to blacklist
        console.log('IP blocking would be implemented here');
      }

      if (blockDevice) {
        // Add device to blacklist
        console.log('Device blocking would be implemented here');
      }

      showToast(`User suspended successfully${durationType === 'temporary' ? ` for ${duration} hours` : ''}`, 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error suspending user:', error);
      showToast('Failed to suspend user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {ToastComponent}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Suspend User</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {userName} ({userEmail})
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Suspension Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Suspension Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDurationType('permanent')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    durationType === 'permanent'
                      ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-600">block</span>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 dark:text-white">Permanent</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Until manually lifted</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setDurationType('temporary')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    durationType === 'temporary'
                      ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-yellow-600">schedule</span>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 dark:text-white">Temporary</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Auto-expires</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Duration (if temporary) */}
            {durationType === 'temporary' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Duration (hours)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 24, 72, 168].map((hours) => (
                    <button
                      key={hours}
                      onClick={() => setDuration(hours)}
                      className={`px-4 py-3 rounded-xl font-bold transition-all ${
                        duration === hours
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {hours < 24 ? `${hours}h` : `${hours / 24}d`}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-2 w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Custom hours..."
                  min="1"
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Reason for Suspension <span className="text-red-600">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                rows={4}
                placeholder="Explain why this user is being suspended..."
                required
              />
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Additional Security Measures
              </label>
              
              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600">
                <input
                  type="checkbox"
                  checked={blockIP}
                  onChange={(e) => setBlockIP(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-white">Block IP Address</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Prevent access from user's current IP address
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600">
                <input
                  type="checkbox"
                  checked={blockDevice}
                  onChange={(e) => setBlockDevice(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-white">Block Device</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Prevent access from user's current device
                  </p>
                </div>
              </label>
            </div>

            {/* Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
                <div>
                  <p className="font-bold text-red-900 dark:text-red-400">Warning</p>
                  <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                    This action will immediately prevent the user from accessing the platform.
                    {durationType === 'temporary' && ` The suspension will automatically expire in ${duration} hours.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSuspend}
              disabled={loading || !reason.trim()}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  Suspending...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">block</span>
                  Suspend User
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuspensionModal;
