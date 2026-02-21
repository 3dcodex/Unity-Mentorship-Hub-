
import React, { useState, useEffect } from 'react';
import { rolePrivileges } from '../rolePrivileges';
import { Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { signOut, updatePassword, updateEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db, storage } from '../src/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateProfessionalHeadshot } from '../services/geminiService';
import { useAuth } from '../App';

const ProfileSettings: React.FC = () => {
  // Role and privilege logic
  const userRole: Role = (localStorage.getItem('unity_user_role') as Role) || 'Domestic Student';
  const privileges = rolePrivileges[userRole] || [];
      // Resume auto-save toggle
      const [resumeAutoSave, setResumeAutoSave] = useState(localStorage.getItem('unity_resume_auto_save') === 'true');

      const handleResumeAutoSaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setResumeAutoSave(e.target.checked);
        localStorage.setItem('unity_resume_auto_save', e.target.checked ? 'true' : 'false');
      };
    // Connectivity check
    console.log("Navigator online?", navigator.onLine);
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
          {/* Role & Privilege Summary */}
          <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 border shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                {userRole} Privileges
              </h2>
              <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc ml-6">
                {privileges.map(p => (
                  <li key={p}>{p.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl">
                {userRole === 'International Student' && 'public'}
                {userRole === 'Domestic Student' && 'school'}
                {userRole === 'Alumni' && 'workspace_premium'}
                {userRole === 'Professional' && 'business_center'}
              </span>
              <span className="text-xs font-bold mt-1">
                {userRole === 'International Student' && '🌎 Global Explorer'}
                {userRole === 'Domestic Student' && '🏛 Campus Connector'}
                {userRole === 'Alumni' && '🎖 Alumni Mentor'}
                {userRole === 'Professional' && '💼 Industry Partner'}
              </span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium mt-2">Manage your account, privacy, and preferences.</p>
        </header>

        {/* Resume Auto-Save Option */}
        <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm`}> 
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">sync</span>
            Resume Auto-Save
          </h2>
          <div className="flex items-center gap-3">
            <label className="font-bold text-xs">Enable auto-save for Resume Builder</label>
            <input
              type="checkbox"
              checked={resumeAutoSave}
              onChange={handleResumeAutoSaveChange}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">When enabled, your resume will be saved automatically as you edit in Resume Builder. When disabled, you must click Save to persist changes.</p>
        </div>
        {/* Role-based Profile Section */}
        {(() => {
          const role = localStorage.getItem('unity_user_role') || 'Student';
          switch (role) {
            case 'Student': {
              const isInternational = localStorage.getItem('unity_user_international') === 'true';
              if (isInternational) {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Core Identity Section for International Student */}
                                        {/* Adjustment & Support Preferences Section */}
                                                            {/* Privacy & Safety Controls Section */}
                                                                                {/* Mentorship Preferences Section */}
                                                                                                    {/* Community Controls Section */}
                                                                                                                        {/* Notification Settings Section */}
                                                                                                                        <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm mt-8 md:col-span-3`}>
                                                                                                                          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                                                                            <span className="material-symbols-outlined text-primary">notifications</span>
                                                                                                                            Notification Settings
                                                                                                                          </h2>
                                                                                                                          <div className="space-y-6">
                                                                                                                            <div className="flex items-center gap-3">
                                                                                                                              <label className="font-bold text-xs">Visa updates</label>
                                                                                                                              <input type="checkbox" checked={localStorage.getItem('unity_notify_visa_updates') === 'true'} readOnly />
                                                                                                                            </div>
                                                                                                                            <div className="flex items-center gap-3">
                                                                                                                              <label className="font-bold text-xs">Scholarship alerts</label>
                                                                                                                              <input type="checkbox" checked={localStorage.getItem('unity_notify_scholarship_alerts') === 'true'} readOnly />
                                                                                                                            </div>
                                                                                                                            <div className="flex items-center gap-3">
                                                                                                                              <label className="font-bold text-xs">Emergency alerts</label>
                                                                                                                              <input type="checkbox" checked={localStorage.getItem('unity_notify_emergency_alerts') === 'true'} readOnly />
                                                                                                                            </div>
                                                                                                                            <div className="flex items-center gap-3">
                                                                                                                              <label className="font-bold text-xs">Event invitations</label>
                                                                                                                              <input type="checkbox" checked={localStorage.getItem('unity_notify_event_invitations') === 'true'} readOnly />
                                                                                                                            </div>
                                                                                                                          </div>
                                                                                                                        </div>
                                                                                                    <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm mt-8 md:col-span-3`}>
                                                                                                      <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                                                        <span className="material-symbols-outlined text-primary">groups</span>
                                                                                                        Community Controls
                                                                                                      </h2>
                                                                                                      <div className="space-y-6">
                                                                                                        <div>
                                                                                                          <label className="font-bold text-xs mb-2 block">Join cultural groups</label>
                                                                                                          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 text-xs text-gray-500">(Membership management coming soon)</div>
                                                                                                        </div>
                                                                                                        <div className="flex items-center gap-3">
                                                                                                          <label className="font-bold text-xs">Language exchange participation</label>
                                                                                                          <input type="checkbox" checked={localStorage.getItem('unity_community_language_exchange') === 'true'} readOnly />
                                                                                                        </div>
                                                                                                        <div className="flex items-center gap-3">
                                                                                                          <label className="font-bold text-xs">Allow peer contact</label>
                                                                                                          <input type="checkbox" checked={localStorage.getItem('unity_community_peer_contact') === 'true'} readOnly />
                                                                                                        </div>
                                                                                                      </div>
                                                                                                    </div>
                                                                                <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm mt-8 md:col-span-3`}>
                                                                                  <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                                    <span className="material-symbols-outlined text-primary">diversity_3</span>
                                                                                    Mentorship Preferences
                                                                                  </h2>
                                                                                  <div className="space-y-6">
                                                                                    <div>
                                                                                      <label className="font-bold text-xs mb-2 block">Preferred session format:</label>
                                                                                      <div className="flex gap-4">
                                                                                        <label className="flex items-center gap-2">
                                                                                          <input type="checkbox" checked={localStorage.getItem('unity_mentorship_format_video') === 'true'} readOnly /> Video
                                                                                        </label>
                                                                                        <label className="flex items-center gap-2">
                                                                                          <input type="checkbox" checked={localStorage.getItem('unity_mentorship_format_audio') === 'true'} readOnly /> Audio
                                                                                        </label>
                                                                                        <label className="flex items-center gap-2">
                                                                                          <input type="checkbox" checked={localStorage.getItem('unity_mentorship_format_chat') === 'true'} readOnly /> Chat
                                                                                        </label>
                                                                                      </div>
                                                                                    </div>
                                                                                    <div>
                                                                                      <label className="font-bold text-xs mb-2 block">Availability calendar</label>
                                                                                      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 text-xs text-gray-500">(Calendar integration coming soon)</div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-3">
                                                                                      <label className="font-bold text-xs">Priority matching</label>
                                                                                      <input type="checkbox" checked={localStorage.getItem('unity_mentorship_priority_matching') === 'true'} readOnly />
                                                                                    </div>
                                                                                  </div>
                                                                                </div>
                                                            <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm mt-8 md:col-span-3`}>
                                                              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-primary">shield_person</span>
                                                                Privacy & Safety Controls
                                                              </h2>
                                                              <div className="space-y-6">
                                                                                            case 'Alumni':
                                                                                              return (
                                                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                                                  {/* Professional Identity Section for Alumni */}
                                                                                                  <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm md:col-span-3`}>
                                                                                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                                                      <span className="material-symbols-outlined text-primary">work</span>
                                                                                                      Professional Identity
                                                                                                    </h2>
                                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Current Employer</label>
                                                                                                        <input value={localStorage.getItem('unity_alumni_employer') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Job Title</label>
                                                                                                        <input value={localStorage.getItem('unity_alumni_job_title') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Industry</label>
                                                                                                        <input value={localStorage.getItem('unity_alumni_industry') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Years of Experience</label>
                                                                                                        <input value={localStorage.getItem('unity_alumni_experience_years') || ''} type="number" min="0" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                  {/* Alumni Verification Section */}
                                                                                                  <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm md:col-span-3`}>
                                                                                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                                                      <span className="material-symbols-outlined text-primary">verified</span>
                                                                                                      Alumni Verification
                                                                                                    </h2>
                                                                                                    <div className="space-y-6">
                                                                                                      <div>
                                                                                                        <label className="font-bold text-xs mb-2 block">Upload graduation proof</label>
                                                                                                        <input type="file" accept="image/*,application/pdf" className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-3 text-sm font-medium" disabled />
                                                                                                        <div className="text-xs text-gray-500 mt-2">(Upload functionality coming soon)</div>
                                                                                                      </div>
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Alumni badge status</label>
                                                                                                        <span className={`px-3 py-1 rounded-xl font-bold text-xs ${localStorage.getItem('unity_alumni_badge_status') === 'verified' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{localStorage.getItem('unity_alumni_badge_status') === 'verified' ? 'Verified' : 'Pending'}</span>
                                                                                                      </div>
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Verified mentor badge</label>
                                                                                                        <span className={`px-3 py-1 rounded-xl font-bold text-xs ${localStorage.getItem('unity_alumni_mentor_badge') === 'true' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{localStorage.getItem('unity_alumni_mentor_badge') === 'true' ? 'Active' : 'Not Active'}</span>
                                                                                                      </div>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                  {/* Mentorship Capacity Section for Alumni */}
                                                                                                  <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm md:col-span-3`}>
                                                                                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                                                      <span className="material-symbols-outlined text-primary">diversity_3</span>
                                                                                                      Mentorship Capacity
                                                                                                    </h2>
                                                                                                    <div className="space-y-6">
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Available as mentor</label>
                                                                                                        <input type="checkbox" checked={localStorage.getItem('unity_alumni_available_mentor') === 'true'} readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="font-bold text-xs mb-2 block">Max mentees allowed</label>
                                                                                                        <input value={localStorage.getItem('unity_alumni_max_mentees') || ''} type="number" min="1" className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="font-bold text-xs mb-2 block">Areas of expertise</label>
                                                                                                        <select className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" value={localStorage.getItem('unity_alumni_expertise') || ''} disabled>
                                                                                                          <option value="">Select...</option>
                                                                                                          <option value="Career Guidance">Career Guidance</option>
                                                                                                          <option value="Industry Networking">Industry Networking</option>
                                                                                                          <option value="Resume Review">Resume Review</option>
                                                                                                          <option value="Interview Prep">Interview Prep</option>
                                                                                                          <option value="Other">Other</option>
                                                                                                        </select>
                                                                                                      </div>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                  {/* Career Opportunities Section for Alumni */}
                                                                                                  <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm md:col-span-3`}>
                                                                                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                                                      <span className="material-symbols-outlined text-primary">business_center</span>
                                                                                                      Career Opportunities
                                                                                                    </h2>
                                                                                                    <div className="space-y-6">
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Post job referrals</label>
                                                                                                        <input type="checkbox" checked={localStorage.getItem('unity_alumni_job_referral_enabled') === 'true'} readOnly />
                                                                                                        <span className="text-xs text-gray-500">(Enable to allow posting job referrals)</span>
                                                                                                      </div>
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Internship recommendation privileges</label>
                                                                                                        <span className={`px-3 py-1 rounded-xl font-bold text-xs ${localStorage.getItem('unity_alumni_internship_privileges') === 'true' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{localStorage.getItem('unity_alumni_internship_privileges') === 'true' ? 'Active' : 'Not Active'}</span>
                                                                                                      </div>
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Allow direct student outreach</label>
                                                                                                        <input type="checkbox" checked={localStorage.getItem('unity_alumni_student_outreach') === 'true'} readOnly />
                                                                                                        <span className="text-xs text-gray-500">(Toggle to allow students to contact you directly)</span>
                                                                                                      </div>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                  {/* Privacy Controls Section for Alumni */}
                                                                                                  <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm md:col-span-3`}>
                                                                                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                                                      <span className="material-symbols-outlined text-primary">shield_person</span>
                                                                                                      Privacy Controls
                                                                                                    </h2>
                                                                                                    <div className="space-y-6">
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Show company publicly</label>
                                                                                                        <input type="checkbox" checked={localStorage.getItem('unity_alumni_show_company') === 'true'} readOnly />
                                                                                                      </div>
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Allow open messages</label>
                                                                                                        <input type="checkbox" checked={localStorage.getItem('unity_alumni_open_messages') === 'true'} readOnly />
                                                                                                      </div>
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Invite-only mentoring</label>
                                                                                                        <input type="checkbox" checked={localStorage.getItem('unity_alumni_invite_only_mentoring') === 'true'} readOnly />
                                                                                                      </div>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                  {/* Analytics Section for Alumni */}
                                                                                                  <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm md:col-span-3`}>
                                                                                                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                                                                      <span className="material-symbols-outlined text-primary">analytics</span>
                                                                                                      Analytics
                                                                                                    </h2>
                                                                                                    <div className="space-y-6">
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Profile views</label>
                                                                                                        <span className="px-3 py-1 rounded-xl font-bold text-xs bg-gray-100 text-gray-700">{localStorage.getItem('unity_alumni_profile_views') || '0'}</span>
                                                                                                      </div>
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Mentee success stats</label>
                                                                                                        <span className="px-3 py-1 rounded-xl font-bold text-xs bg-green-100 text-green-700">{localStorage.getItem('unity_alumni_mentee_success_stats') || 'N/A'}</span>
                                                                                                      </div>
                                                                                                      <div className="flex items-center gap-3">
                                                                                                        <label className="font-bold text-xs">Referral impact stats</label>
                                                                                                        <span className="px-3 py-1 rounded-xl font-bold text-xs bg-blue-100 text-blue-700">{localStorage.getItem('unity_alumni_referral_impact_stats') || 'N/A'}</span>
                                                                                                      </div>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                  {/* Professional Profile Settings (Highest Tier) - Mini LinkedIn Dashboard */}
                                                                                                  <div className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-8 border shadow-lg md:col-span-3 mt-8`}>
                                                                                                    <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
                                                                                                      <span className="material-symbols-outlined text-primary">corporate_fare</span>
                                                                                                      Company Identity
                                                                                                    </h2>
                                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Company Name</label>
                                                                                                        <input value={localStorage.getItem('unity_company_name') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Company Website</label>
                                                                                                        <input value={localStorage.getItem('unity_company_website') || ''} type="url" className="w-full mt-2 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Industry</label>
                                                                                                        <input value={localStorage.getItem('unity_company_industry') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Company Size</label>
                                                                                                        <input value={localStorage.getItem('unity_company_size') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location</label>
                                                                                                        <input value={localStorage.getItem('unity_company_location') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                      <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Company Description</label>
                                                                                                      <textarea value={localStorage.getItem('unity_company_description') || ''} className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium min-h-[120px]" readOnly />
                                                                                                    </div>
                                                                                                  </div>
                                                                                                  {/* Personal Role Section for Alumni */}
                                                                                                  <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 sm:p-8 border shadow-sm md:col-span-3 mt-8`}>
                                                                                                    <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
                                                                                                      <span className="material-symbols-outlined text-primary">badge</span>
                                                                                                      Personal Role
                                                                                                    </h2>
                                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Job Title</label>
                                                                                                        <input value={localStorage.getItem('unity_personal_job_title') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Department</label>
                                                                                                        <input value={localStorage.getItem('unity_personal_department') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                      <div>
                                                                                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Years in Industry</label>
                                                                                                        <input value={localStorage.getItem('unity_personal_years_industry') || ''} type="number" min="0" className="w-full mt-2 bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                      </div>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                      <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Expertise Tags</label>
                                                                                                      <input value={localStorage.getItem('unity_personal_expertise_tags') || ''} type="text" className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly placeholder="e.g. Leadership, Data Science, Marketing" />
                                                                                                    </div>
                                                                                                  </div>
                                                                                                {/* Verification & Badges Section for Alumni */}
                                                                                                <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 sm:p-8 border shadow-sm md:col-span-3 mt-8`}>
                                                                                                  <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
                                                                                                    <span className="material-symbols-outlined text-primary">military_tech</span>
                                                                                                    Verification & Badges
                                                                                                  </h2>
                                                                                                  <div className="space-y-6">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Alumni badge status</label>
                                                                                                      <span className={`px-3 py-1 rounded-xl font-bold text-xs ${localStorage.getItem('unity_alumni_badge_status') === 'verified' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{localStorage.getItem('unity_alumni_badge_status') === 'verified' ? 'Verified' : 'Pending'}</span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Verified mentor badge</label>
                                                                                                      <span className={`px-3 py-1 rounded-xl font-bold text-xs ${localStorage.getItem('unity_alumni_mentor_badge') === 'true' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{localStorage.getItem('unity_alumni_mentor_badge') === 'true' ? 'Active' : 'Not Active'}</span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Special recognition badges</label>
                                                                                                      <span className="px-3 py-1 rounded-xl font-bold text-xs bg-yellow-100 text-yellow-700">{localStorage.getItem('unity_alumni_special_badges') || 'None'}</span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Badge application status</label>
                                                                                                      <span className={`px-3 py-1 rounded-xl font-bold text-xs ${localStorage.getItem('unity_alumni_badge_application_status') === 'approved' ? 'bg-green-100 text-green-700' : localStorage.getItem('unity_alumni_badge_application_status') === 'pending' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'}`}>{localStorage.getItem('unity_alumni_badge_application_status') === 'approved' ? 'Approved' : localStorage.getItem('unity_alumni_badge_application_status') === 'pending' ? 'Pending' : 'Rejected'}</span>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                {/* Monetization Controls Section for Alumni */}
                                                                                                <div className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 sm:p-8 border shadow-sm md:col-span-3 mt-8`}>
                                                                                                  <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
                                                                                                    <span className="material-symbols-outlined text-primary">payments</span>
                                                                                                    Monetization Controls (Future)
                                                                                                  </h2>
                                                                                                  <div className="space-y-6">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Enable paid mentorship</label>
                                                                                                      <input type="checkbox" checked={localStorage.getItem('unity_alumni_paid_mentorship') === 'true'} readOnly />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                      <label className="font-bold text-xs mb-2 block">Set hourly rate ($)</label>
                                                                                                      <input value={localStorage.getItem('unity_alumni_hourly_rate') || ''} type="number" min="0" className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                      <label className="font-bold text-xs mb-2 block">Revenue dashboard</label>
                                                                                                      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 text-xs text-gray-500">(Stripe/Payment integration coming soon)</div>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                </div>
                                                                                                {/* Analytics Dashboard Section for Alumni */}
                                                                                                <div className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 sm:p-8 border shadow-sm md:col-span-3 mt-8`}>
                                                                                                  <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
                                                                                                    <span className="material-symbols-outlined text-primary">query_stats</span>
                                                                                                    Analytics Dashboard
                                                                                                  </h2>
                                                                                                  <div className="space-y-6">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Profile views</label>
                                                                                                      <span className="px-3 py-1 rounded-xl font-bold text-xs bg-gray-100 text-gray-700">{localStorage.getItem('unity_alumni_profile_views') || '0'}</span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Internship applicants</label>
                                                                                                      <span className="px-3 py-1 rounded-xl font-bold text-xs bg-blue-100 text-blue-700">{localStorage.getItem('unity_alumni_internship_applicants') || '0'}</span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">AMA attendance stats</label>
                                                                                                      <span className="px-3 py-1 rounded-xl font-bold text-xs bg-yellow-100 text-yellow-700">{localStorage.getItem('unity_alumni_ama_attendance') || '0'}</span>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Talent pipeline insights</label>
                                                                                                      <span className="px-3 py-1 rounded-xl font-bold text-xs bg-green-100 text-green-700">{localStorage.getItem('unity_alumni_talent_pipeline') || 'N/A'}</span>
                                                                                                    </div>
                                                                                                  </div>
                                                                                                </div>
                                                                                                {/* Hosting Controls Section for Alumni */}
                                                                                                <div className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 sm:p-8 border shadow-sm md:col-span-3 mt-8`}>
                                                                                                  <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
                                                                                                    <span className="material-symbols-outlined text-primary">mic</span>
                                                                                                    Hosting Controls
                                                                                                  </h2>
                                                                                                  <div className="space-y-6">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Host AMA (enable)</label>
                                                                                                      <input type="checkbox" checked={localStorage.getItem('unity_alumni_host_ama') === 'true'} readOnly />
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Host webinars</label>
                                                                                                      <input type="checkbox" checked={localStorage.getItem('unity_alumni_host_webinars') === 'true'} readOnly />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                      <label className="font-bold text-xs mb-2 block">Create company page</label>
                                                                                                      <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 text-xs text-gray-500">(Company page creation coming soon)</div>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Post internships</label>
                                                                                                      <input type="checkbox" checked={localStorage.getItem('unity_alumni_post_internships') === 'true'} readOnly />
                                                                                                    </div>
                                                                                                  </div>
                                                                                                </div>
                                                                                                {/* Communication Controls Section for Alumni */}
                                                                                                <div className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl p-6 sm:p-8 border shadow-sm md:col-span-3 mt-8`}>
                                                                                                  <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
                                                                                                    <span className="material-symbols-outlined text-primary">lock</span>
                                                                                                    Communication Controls
                                                                                                  </h2>
                                                                                                  <div className="space-y-6">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Open DMs</label>
                                                                                                      <input type="checkbox" checked={localStorage.getItem('unity_alumni_open_dms') === 'true'} readOnly />
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Students only</label>
                                                                                                      <input type="checkbox" checked={localStorage.getItem('unity_alumni_dms_students_only') === 'true'} readOnly />
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Alumni only</label>
                                                                                                      <input type="checkbox" checked={localStorage.getItem('unity_alumni_dms_alumni_only') === 'true'} readOnly />
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-3">
                                                                                                      <label className="font-bold text-xs">Invite-only mode</label>
                                                                                                      <input type="checkbox" checked={localStorage.getItem('unity_alumni_dms_invite_only') === 'true'} readOnly />
                                                                                                    </div>
                                                                                                  </div>
                                                                                                </div>
                                                                                                </div>
                                                                                                </div>
                                                                                              );
                                                                <div className="flex items-center gap-3">
                                                                  <label className="font-bold text-xs">Show my country publicly</label>
                                                                  <input type="checkbox" checked={localStorage.getItem('unity_privacy_show_country') === 'true'} readOnly />
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                  <label className="font-bold text-xs">Show my visa status</label>
                                                                  <input type="checkbox" checked={localStorage.getItem('unity_privacy_show_visa') === 'true'} readOnly />
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                  <label className="font-bold text-xs">Anonymous question mode</label>
                                                                  <input type="checkbox" checked={localStorage.getItem('unity_privacy_anonymous_mode') !== 'false'} readOnly />
                                                                  <span className="text-xs text-gray-500">(default ON)</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                  <label className="font-bold text-xs">Safe-space mentors only filter</label>
                                                                  <input type="checkbox" checked={localStorage.getItem('unity_privacy_safe_space_mentors') === 'true'} readOnly />
                                                                </div>
                                                              </div>
                                                            </div>
                                        <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm mt-8 md:col-span-3`}>
                                          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">support_agent</span>
                                            Adjustment & Support Preferences
                                          </h2>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                              <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Need help with:</label>
                                              <div className="space-y-2">
                                                <label className="flex items-center gap-2">
                                                  <input type="checkbox" checked={localStorage.getItem('unity_help_visa') === 'true'} readOnly /> Visa
                                                </label>
                                                <label className="flex items-center gap-2">
                                                  <input type="checkbox" checked={localStorage.getItem('unity_help_housing') === 'true'} readOnly /> Housing
                                                </label>
                                                <label className="flex items-center gap-2">
                                                  <input type="checkbox" checked={localStorage.getItem('unity_help_scholarships') === 'true'} readOnly /> Scholarships
                                                </label>
                                                <label className="flex items-center gap-2">
                                                  <input type="checkbox" checked={localStorage.getItem('unity_help_cultural') === 'true'} readOnly /> Cultural integration
                                                </label>
                                                <label className="flex items-center gap-2">
                                                  <input type="checkbox" checked={localStorage.getItem('unity_help_mental_health') === 'true'} readOnly /> Mental health support
                                                </label>
                                              </div>
                                            </div>
                                            <div>
                                              <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Preferred mentor background:</label>
                                              <div className="space-y-2">
                                                <label className="flex items-center gap-2">
                                                  <input type="checkbox" checked={localStorage.getItem('unity_mentor_same_country') === 'true'} readOnly /> Same country
                                                </label>
                                                <label className="flex items-center gap-2">
                                                  <input type="checkbox" checked={localStorage.getItem('unity_mentor_same_university') === 'true'} readOnly /> Same university
                                                </label>
                                                <label className="flex items-center gap-2">
                                                  <input type="checkbox" checked={localStorage.getItem('unity_mentor_same_major') === 'true'} readOnly /> Same major
                                                </label>
                                                <label className="flex items-center gap-2">
                                                  <input type="checkbox" checked={localStorage.getItem('unity_mentor_same_language') === 'true'} readOnly /> Same language
                                                </label>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                    <div className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm text-center space-y-6 md:col-span-3`}>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">public</span>
                        Core Identity
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Full Name</label>
                          <input value={userName} onChange={e => setUserName(e.target.value)} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Country of Origin</label>
                          <input value={localStorage.getItem('unity_user_country') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                        </div>
                        <div>
                          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Current Country of Study</label>
                          <input value={localStorage.getItem('unity_user_study_country') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                        </div>
                        <div>
                          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">University</label>
                          <input value={localStorage.getItem('unity_user_university') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                        </div>
                        <div>
                          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Degree Program</label>
                          <input value={localStorage.getItem('unity_user_degree_program') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                        </div>
                        <div>
                          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Year of Study</label>
                          <input value={localStorage.getItem('unity_user_year_of_study') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                        </div>
                        <div>
                          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Languages Spoken</label>
                          <input value={localStorage.getItem('unity_user_languages_spoken') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                        </div>
                        <div>
                          <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Preferred Language</label>
                          <input value={localStorage.getItem('unity_user_preferred_language') || ''} type="text" className="w-full mt-2 bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-4 py-3 text-sm font-medium" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              // ...existing Student layout for non-international...
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Student Profile Overview */}
                  {/* ...existing left and right column code... */}
                  {/* Student-specific settings can be added here */}
                </div>
              );
            }
            case 'Mentor':
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Mentor Profile Overview */}
                  {/* ...existing left and right column code... */}
                  {/* Mentor-specific settings: mentorship toggle, achievements, communication settings */}
                </div>
              );
          }
        })()}
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
