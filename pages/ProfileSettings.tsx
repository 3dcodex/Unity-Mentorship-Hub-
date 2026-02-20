
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, updatePassword, updateEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db, storage } from '../src/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateProfessionalHeadshot } from '../services/geminiService';
import { useAuth } from '../App';

const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('unity_dark_mode') === 'true');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState(email);
  const [passwordToDelete, setPasswordToDelete] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load user profile from Firestore
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserName(data.displayName || localStorage.getItem('unity_user_name') || 'User');
        setProfilePhoto(data.photoURL || null);
      } else {
        setUserName(localStorage.getItem('unity_user_name') || 'User');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setUserName(localStorage.getItem('unity_user_name') || 'User');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsSaving(true);
      const fileRef = ref(storage, `profile-photos/${user.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const photoURL = await getDownloadURL(fileRef);
      
      setProfilePhoto(photoURL);
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL,
        updatedAt: Timestamp.now(),
      });
      
      setSuccess('Profile photo updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload photo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenImage = async () => {
    if (!user) return;
    setIsGenerating(true);
    setError(null);
    try {
      const img = await generateProfessionalHeadshot(`a professional student mentor with friendly expression`);
      if (img) {
        setProfilePhoto(img);
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: img,
          updatedAt: Timestamp.now(),
        });
        setSuccess('AI-generated photo set successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError('Failed to generate photo');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    setError(null);
    try {
      if (!user || !user.email) throw new Error('User not found');
      
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setSuccess('Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !currentPassword) {
      setError('Email and password are required');
      return;
    }
    if (!newEmail.includes('@')) {
      setError('Invalid email address');
      return;
    }

    setIsChangingEmail(true);
    setError(null);
    try {
      if (!user || !user.email) throw new Error('User not found');
      
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);

      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        updatedAt: Timestamp.now(),
      });
      
      setSuccess('Email changed successfully!');
      setShowEmailModal(false);
      setEmail(newEmail);
      setCurrentPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to change email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!passwordToDelete) {
      setError('Password is required to delete account');
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      if (!user || !user.email) throw new Error('User not found');
      
      const credential = EmailAuthProvider.credential(user.email, passwordToDelete);
      await reauthenticateWithCredential(user, credential);
      
      deleteUser(user);
      await updateDoc(doc(db, 'users', user.uid), {
        deletedAt: Timestamp.now(),
        isDeleted: true,
      }).catch(() => {});
      
      localStorage.removeItem('unity_onboarding_complete');
      localStorage.removeItem('unity_user_name');
      localStorage.removeItem('unity_user_role');
      
      navigate('/login');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('unity_onboarding_complete');
      localStorage.removeItem('unity_user_name');
      localStorage.removeItem('unity_user_role');
      navigate('/login');
    } catch (err: any) {
      setError(err?.message || 'Failed to logout');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: userName,
        updatedAt: Timestamp.now(),
      });
      
      localStorage.setItem('unity_user_name', userName);
      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
        
        {/* Alerts */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <header>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium mt-2">Manage your account, privacy, and preferences.</p>
        </header>

        {/* Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm text-center space-y-6`}>
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-blue-600 mx-auto border-4 border-white dark:border-gray-700 shadow-xl relative group">
              {profilePhoto ? (
                <img src={profilePhoto} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-black text-4xl">
                  {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isSaving} className="hidden" />
              </label>
            </div>
            
            <div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{userName}</h3>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{user?.email}</p>
            </div>

            <div className="space-y-2">
              <button 
                onClick={handleGenImage}
                disabled={isGenerating}
                className="w-full py-2.5 sm:py-3 bg-primary/10 dark:bg-primary/20 text-primary font-black rounded-xl text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">auto_awesome</span>
                )}
                {isGenerating ? 'Generating...' : 'AI Photo'}
              </button>
              
              <label className="w-full block">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isSaving} className="hidden" />
                <div className="py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-600 transition-all cursor-pointer text-center disabled:opacity-50">
                  Upload Photo
                </div>
              </label>
            </div>
          </div>

          <div className={`md:col-span-2 ${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6`}>
            <div className="space-y-4">
              <div>
                <label className="text-xs sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Full Name</label>
                <input 
                  value={userName} 
                  onChange={e => setUserName(e.target.value)} 
                  type="text" 
                  className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email Address</label>
                <div className="flex gap-2 mt-2">
                  <input 
                    value={email} 
                    disabled 
                    type="email" 
                    className="flex-1 bg-gray-50 dark:bg-gray-700 dark:text-gray-400 border-none rounded-xl px-4 py-3 text-sm font-medium opacity-60 cursor-not-allowed"
                  />
                  <button 
                    onClick={() => setShowEmailModal(!showEmailModal)}
                    className="px-4 py-3 bg-primary/10 dark:bg-primary/20 text-primary font-black rounded-xl text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Security</h3>
              <button 
                onClick={() => setShowPasswordModal(!showPasswordModal)}
                className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <span className="material-symbols-outlined text-primary">lock_reset</span>
                <span className="flex-1 text-left text-sm font-bold text-primary">Change Password</span>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">chevron_right</span>
              </button>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Session</h3>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">logout</span>
                <span className="flex-1 text-left text-sm font-bold text-blue-600 dark:text-blue-400">Log Out</span>
              </button>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Preferences</h3>
              <button 
                onClick={() => {
                  setDarkMode(!darkMode);
                  localStorage.setItem('unity_dark_mode', (!darkMode).toString());
                }}
                className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">dark_mode</span>
                <span className="flex-1 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
                <div className={`w-10 h-6 bg-gray-300 rounded-full flex items-center transition-all ${darkMode ? 'bg-primary' : ''}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </button>
            </div>

            <div className="pt-6 flex gap-3">
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 py-3 bg-primary text-white font-black rounded-xl shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-black rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <PasswordModal 
          onClose={() => setShowPasswordModal(false)}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          onSubmit={handleChangePassword}
          isLoading={isChangingPassword}
          darkMode={darkMode}
        />
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal
          onClose={() => setShowEmailModal(false)}
          newEmail={newEmail}
          setNewEmail={setNewEmail}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          onSubmit={handleChangeEmail}
          isLoading={isChangingEmail}
          darkMode={darkMode}
        />
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          password={passwordToDelete}
          setPassword={setPasswordToDelete}
          onSubmit={handleDeleteAccount}
          isLoading={isDeleting}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

const PasswordModal: React.FC<any> = ({ onClose, currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, onSubmit, isLoading, darkMode }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className={`${darkMode ? 'dark bg-gray-800' : 'bg-white'} rounded-3xl p-8 max-w-md w-full space-y-6`}>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white">Change Password</h2>
      <div className="space-y-4">
        <input placeholder="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20" />
        <input placeholder="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20" />
        <input placeholder="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20" />
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} disabled={isLoading} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-black rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Cancel</button>
        <button onClick={onSubmit} disabled={isLoading} className="flex-1 py-3 bg-primary text-white font-black rounded-xl hover:scale-105 transition-all disabled:opacity-50">{isLoading ? 'Updating...' : 'Update'}</button>
      </div>
    </div>
  </div>
);

const EmailModal: React.FC<any> = ({ onClose, newEmail, setNewEmail, currentPassword, setCurrentPassword, onSubmit, isLoading, darkMode }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className={`${darkMode ? 'dark bg-gray-800' : 'bg-white'} rounded-3xl p-8 max-w-md w-full space-y-6`}>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white">Change Email</h2>
      <div className="space-y-4">
        <input placeholder="New Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20" />
        <input placeholder="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20" />
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} disabled={isLoading} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-black rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Cancel</button>
        <button onClick={onSubmit} disabled={isLoading} className="flex-1 py-3 bg-primary text-white font-black rounded-xl hover:scale-105 transition-all disabled:opacity-50">{isLoading ? 'Updating...' : 'Update'}</button>
      </div>
    </div>
  </div>
);

const DeleteAccountModal: React.FC<any> = ({ onClose, password, setPassword, onSubmit, isLoading, darkMode }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className={`${darkMode ? 'dark bg-gray-800' : 'bg-white'} rounded-3xl p-8 max-w-md w-full space-y-6`}>
      <h2 className="text-2xl font-black text-red-600 dark:text-red-400">Delete Account</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone. All your data will be permanently deleted.</p>
      <div>
        <input placeholder="Enter your password to confirm" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-red-500/20" />
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} disabled={isLoading} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-black rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Cancel</button>
        <button onClick={onSubmit} disabled={isLoading} className="flex-1 py-3 bg-red-600 dark:bg-red-700 text-white font-black rounded-xl hover:scale-105 transition-all disabled:opacity-50">{isLoading ? 'Deleting...' : 'Delete'}</button>
      </div>
    </div>
  </div>
);

export default ProfileSettings;
