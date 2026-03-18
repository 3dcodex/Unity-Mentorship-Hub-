import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, updatePassword, updateEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../src/firebase';
import { doc, getDoc, updateDoc, Timestamp, setDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../App';
import { Role } from '../types';
import { errorService } from '../services/errorService';
import { FOCUS_AREA_LABELS } from '../utils/mentorMatching';
import { CURRENT_MENTOR_APPLICATION_VERSION } from '../utils/mentorMatching';
import { useTheme } from '../contexts/ThemeContext';

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setIsDark } = useTheme();
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [userRole, setUserRole] = useState<Role>('Student');
  const [activeTab, setActiveTab] = useState('account');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [website, setWebsite] = useState('');
  
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  // Mentor fields
  const [isMentor, setIsMentor] = useState(false);
  const [mentorStatus, setMentorStatus] = useState<'none' | 'pending' | 'approved'>('none');
  const [mentorApplicationVersion, setMentorApplicationVersion] = useState<number>(0);
  const [mentorExpertise, setMentorExpertise] = useState('');
  const [mentorBio, setMentorBio] = useState('');
  const [availability, setAvailability] = useState('');
  const [mentorTags, setMentorTags] = useState<string[]>([]);
  
  // Preferences
  const [campusInvolvement, setCampusInvolvement] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('');
  const [notifyCampusEvents, setNotifyCampusEvents] = useState(true);
  const [notifyMentorshipRequests, setNotifyMentorshipRequests] = useState(true);
  const [notifyCommunityUpdates, setNotifyCommunityUpdates] = useState(true);
  const [resumeAutoSave, setResumeAutoSave] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Complete Profile
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [workExperience, setWorkExperience] = useState('');
  const [education, setEducation] = useState('');
  const [twitter, setTwitter] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdminBadge, setShowAdminBadge] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (user) {
      loadProfile();
      unsubscribe = setupRealTimeListener();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const setupRealTimeListener = () => {
    if (!user) return;
    
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setMentorStatus(d.mentorStatus || 'none');
        setMentorApplicationVersion(d.mentorApplicationVersion || 0);
        setIsMentor(d.isMentor || false);
        
        // Update other fields that might change
        if (d.role) setUserRole(d.role);
        if (d.mentorExpertise) setMentorExpertise(d.mentorExpertise);
        if (d.mentorBio) setMentorBio(d.mentorBio);
        if (d.availability) setAvailability(d.availability);
        if (d.mentorTags) setMentorTags(d.mentorTags);
      }
    });
    
    return unsubscribe;
  };

  useEffect(() => {
    setShowAdminBadge(['admin', 'super_admin', 'moderator'].includes(userRole));
  }, [userRole]);

  const toggleMentorTag = (tag: string) => {
    setMentorTags(currentTags =>
      currentTags.includes(tag)
        ? currentTags.filter(currentTag => currentTag !== tag)
        : [...currentTags, tag]
    );
  };

  const loadProfile = async () => {
    if (!user) return;
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const d = docSnap.data();
        setUserRole(d.role || 'Student');
        setFirstName(d.firstName || d.name?.split(' ')[0] || '');
        setLastName(d.lastName || d.name?.split(' ')[1] || '');
        setEmail(d.email || user.email || '');
        setPhone(d.phone || '');
        setProfilePhoto(d.photoURL || null);
        setBio(d.bio || '');
        setLocation(d.location || '');
        setLinkedin(d.linkedin || '');
        setGithub(d.github || '');
        setWebsite(d.website || '');
        setSchool(d.school || d.university || '');
        setMajor(d.major || d.programName || '');
        setYear(d.year || d.currentYear || '');
        setCompany(d.company || d.companyName || '');
        setJobTitle(d.jobTitle || '');
        setIsMentor(d.isMentor || false);
        setMentorStatus(d.mentorStatus || 'none');
        setMentorApplicationVersion(d.mentorApplicationVersion || 0);
        setMentorExpertise(d.mentorExpertise || '');
        setMentorBio(d.mentorBio || '');
        setAvailability(d.availability || '');
        setMentorTags(d.mentorTags || []);
        setCampusInvolvement(d.campusInvolvement || '');
        setLanguagesSpoken(d.languagesSpoken || '');
        setNotifyCampusEvents(d.notifyCampusEvents ?? true);
        setNotifyMentorshipRequests(d.notifyMentorshipRequests ?? true);
        setNotifyCommunityUpdates(d.notifyCommunityUpdates ?? true);
        setResumeAutoSave(d.resumeAutoSave || false);
        const savedDarkMode = d.darkMode || false;
        setDarkMode(savedDarkMode);
        setIsDark(savedDarkMode);
        setSkills(d.skills || []);
        setCertifications(d.certifications || []);
        setAchievements(d.achievements || []);
        setInterests(d.interests || []);
        setWorkExperience(d.workExperience || '');
        setEducation(d.education || '');
        setTwitter(d.twitter || '');
      }
    } catch (err) {
      errorService.handleError(err, 'Error loading profile');
    }
  };

  const performAutoSave = useCallback(async (fields: Partial<{
    firstName: string; lastName: string; bio: string; location: string;
  }>) => {
    if (!user) return;
    try {
      setAutoSaveStatus('saving');
      await setDoc(doc(db, 'users', user.uid), {
        ...fields,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
    } catch {
      setAutoSaveStatus('idle');
    }
  }, [user]);

  const triggerAutoSave = useCallback((fields: Partial<{
    firstName: string; lastName: string; bio: string; location: string;
  }>) => {
    if (!resumeAutoSave) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => performAutoSave(fields), 1500);
  }, [resumeAutoSave, performAutoSave]);

  const handleSave = async () => {
    if (!user) return;
    
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', user.uid);
      
      const updateData: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName} ${lastName}`.trim(),
        displayName: `${firstName} ${lastName}`.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        location: location.trim(),
        linkedin: linkedin.trim(),
        github: github.trim(),
        website: website.trim(),
        interests,
        updatedAt: Timestamp.now(),
      };

      if (userRole === 'Student') {
        updateData.school = school.trim();
        updateData.university = school.trim();
        updateData.major = major.trim();
        updateData.programName = major.trim();
        updateData.year = year;
        updateData.currentYear = year;
      } else if (userRole === 'Professional') {
        updateData.company = company.trim();
        updateData.companyName = company.trim();
        updateData.jobTitle = jobTitle.trim();
      }

      batch.set(userRef, updateData, { merge: true });
      await batch.commit();
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Convert image to base64 data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoURL = reader.result as string;
        
        await setDoc(doc(db, 'users', user.uid), { 
          photoURL, 
          updatedAt: Timestamp.now() 
        }, { merge: true });
        
        setProfilePhoto(photoURL);
        setSuccess('Photo updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        setIsLoading(false);
        
        // Trigger event to refresh photo across all components
        window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { photoURL } }));
      };
      
      reader.onerror = () => {
        setError('Failed to read image file.');
        setIsLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      errorService.handleError(err, 'Photo upload error');
      setError('Failed to upload photo.');
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email || !currentPassword || !newPassword || !confirmPassword) {
      setError('All fields required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess('Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorCode = err && typeof err === 'object' && 'code' in err ? err.code : null;
      setError(errorCode === 'auth/wrong-password' ? 'Incorrect current password' : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!user?.email || !currentPassword || !newEmail) {
      setError('All fields required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Invalid email format');
      return;
    }
    if (newEmail === user.email) {
      setError('New email must be different');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      await setDoc(doc(db, 'users', user.uid), { email: newEmail, updatedAt: Timestamp.now() }, { merge: true });
      setEmail(newEmail);
      setSuccess('Email changed successfully!');
      setShowEmailModal(false);
      setCurrentPassword('');
      setNewEmail('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorCode = err && typeof err === 'object' && 'code' in err ? err.code : null;
      if (errorCode === 'auth/wrong-password') setError('Incorrect password');
      else if (errorCode === 'auth/email-already-in-use') setError('Email already in use');
      else if (errorCode === 'auth/requires-recent-login') setError('Please log out and log in again');
      else setError('Failed to change email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.email || !currentPassword) {
      setError('Password is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updateDoc(doc(db, 'users', user.uid), {
        deletedAt: Timestamp.now(),
        isDeleted: true,
      }).catch(() => {});
      
      await deleteUser(user);
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      const errorCode = err && typeof err === 'object' && 'code' in err ? err.code : null;
      setError(errorCode === 'auth/wrong-password' ? 'Incorrect password' : 'Failed to delete account');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      setError('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-2 py-4 sm:px-4 sm:py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Profile Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your account and preferences</p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 sm:p-6 sticky top-2 sm:top-8 w-full">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-100 dark:border-blue-900">
                      {firstName[0] || 'U'}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={isLoading} />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                </div>
                <button
                  onClick={async () => {
                    if (!user) return;
                    setIsLoading(true);
                    try {
                      const aiPhotoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;
                      await setDoc(doc(db, 'users', user.uid), { photoURL: aiPhotoURL, updatedAt: Timestamp.now() }, { merge: true });
                      setProfilePhoto(aiPhotoURL);
                      setSuccess('AI photo generated!');
                      setTimeout(() => setSuccess(''), 3000);
                      
                      // Trigger event to refresh photo across all components
                      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { photoURL: aiPhotoURL } }));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to generate AI photo');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ✨ Generate AI Photo
                </button>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{firstName} {lastName}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{userRole}</span>
                  {showAdminBadge && (
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                      {userRole === 'super_admin' ? '👑' : userRole === 'admin' ? '⚡' : '🛡️'}
                    </span>
                  )}
                </div>
              </div>
              
              <nav className="space-y-2 w-full">
                {['account', 'profile', 'mentor', 'preferences', 'complete', 'security'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${
                      activeTab === tab
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab === 'complete' ? 'Complete Profile' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700 space-y-2 w-full">
                <button onClick={handleLogout} className="w-full px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition">
                  Logout
                </button>
                <button onClick={() => setShowDeleteModal(true)} className="w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                  Delete Account
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 sm:p-8 w-full">
              
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Account Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => { setFirstName(e.target.value); triggerAutoSave({ firstName: e.target.value, lastName, bio, location }); }}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => { setLastName(e.target.value); triggerAutoSave({ firstName, lastName: e.target.value, bio, location }); }}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          readOnly
                          className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500"
                        />
                        <button
                          onClick={() => setShowEmailModal(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {userRole === 'Student' && (
                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">School</label>
                        <input
                          type="text"
                          value={school}
                          onChange={e => setSchool(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Major</label>
                        <input
                          type="text"
                          value={major}
                          onChange={e => setMajor(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Year</label>
                        <select
                          value={year}
                          onChange={e => setYear(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Select Year</option>
                          <option value="Freshman">Freshman</option>
                          <option value="Sophomore">Sophomore</option>
                          <option value="Junior">Junior</option>
                          <option value="Senior">Senior</option>
                          <option value="Graduate">Graduate</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {userRole === 'Professional' && (
                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Company</label>
                        <input
                          type="text"
                          value={company}
                          onChange={e => setCompany(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Job Title</label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={e => setJobTitle(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    {autoSaveStatus === 'saving' && (
                      <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Auto-saving...</span>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <span className="text-sm text-green-600 dark:text-green-400">Saved automatically</span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profile Details</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                    <textarea
                      value={bio}
                      onChange={e => { setBio(e.target.value); triggerAutoSave({ firstName, lastName, bio: e.target.value, location }); }}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => { setLocation(e.target.value); triggerAutoSave({ firstName, lastName, bio, location: e.target.value }); }}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Interests</label>
                    <input
                      type="text"
                      value={interests.join(', ')}
                      onChange={e => setInterests(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="Technology, Sports, Music (comma-separated)"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Social Links</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">LinkedIn</label>
                      <input
                        type="url"
                        value={linkedin}
                        onChange={e => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">GitHub</label>
                      <input
                        type="url"
                        value={github}
                        onChange={e => setGithub(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Website</label>
                      <input
                        type="url"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!user) return;
                      setIsLoading(true);
                      setError('');
                      setSuccess('');
                      try {
                        await setDoc(doc(db, 'users', user.uid), {
                          bio: bio.trim(),
                          location: location.trim(),
                          interests,
                          linkedin: linkedin.trim(),
                          github: github.trim(),
                          website: website.trim(),
                          twitter: twitter.trim(),
                          updatedAt: Timestamp.now()
                        }, { merge: true });
                        setSuccess('Profile updated!');
                        setTimeout(() => setSuccess(''), 3000);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to update profile');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              )}

              {activeTab === 'mentor' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Mentor Profile</h2>
                  
                  {mentorStatus === 'none' && (
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Become a Mentor</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Share your knowledge and help others grow. Add your mentoring criteria so matching stays focused and accurate.</p>

                      <div className="space-y-4 mb-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Areas of Expertise</label>
                          <input
                            type="text"
                            value={mentorExpertise}
                            onChange={e => setMentorExpertise(e.target.value)}
                            placeholder="e.g., Data Science, Interview Prep, Study Strategy"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mentor Bio / Experience</label>
                          <textarea
                            value={mentorBio}
                            onChange={e => setMentorBio(e.target.value)}
                            rows={4}
                            placeholder="Briefly describe your background and how you can support mentees."
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mentor Focus Areas</label>
                          <div className="mb-3 flex flex-wrap gap-2">
                            {FOCUS_AREA_LABELS.map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleMentorTag(tag)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                  mentorTags.includes(tag)
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={mentorTags?.join(', ') || ''}
                            onChange={e => setMentorTags(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder="Optional: add custom focus areas as comma-separated text"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select one or more focus areas so mentees can find you more precisely.</p>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (!user) return;
                          if (!mentorExpertise.trim()) {
                            setError('Please add your expertise before applying.');
                            return;
                          }

                          if (mentorTags.length === 0) {
                            setError('Please select at least one mentor focus area.');
                            return;
                          }

                          setIsLoading(true);
                          try {
                            // Update user status
                            await setDoc(doc(db, 'users', user.uid), { 
                              isMentor: false,
                              mentorStatus: 'pending', 
                              mentorExpertise: mentorExpertise.trim(),
                              mentorBio: mentorBio.trim(),
                              mentorTags,
                              mentorApplicationVersion: CURRENT_MENTOR_APPLICATION_VERSION,
                              updatedAt: Timestamp.now() 
                            }, { merge: true });
                            
                            // Create mentor application for admin review
                            await setDoc(doc(db, 'mentorApplications', user.uid), {
                              userId: user.uid,
                              name: `${firstName} ${lastName}`.trim() || user.displayName || 'Unknown',
                              email: user.email,
                              expertise: mentorTags.length > 0 ? mentorTags : [mentorExpertise.trim()],
                              credentials: linkedin || website || 'Credentials not provided',
                              experience: mentorBio.trim() || bio || 'No experience provided',
                              applicationVersion: CURRENT_MENTOR_APPLICATION_VERSION,
                              status: 'pending',
                              appliedAt: Timestamp.now(),
                              documents: [],
                              adminNotes: ''
                            });
                            
                            setMentorStatus('pending');
                            setSuccess('Application submitted!');
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to submit application');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                      >
                        Apply to Become a Mentor
                      </button>
                    </div>
                  )}

                  {mentorStatus === 'pending' && (
                    <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">⏳ Application Pending</h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">Your mentor application is under review</p>
                      <button
                        onClick={async () => {
                          if (!user) return;
                          setIsLoading(true);
                          try {
                            await setDoc(doc(db, 'users', user.uid), {
                              mentorStatus: 'none',
                              isMentor: false,
                              mentorApplicationStatus: 'reset_required',
                              updatedAt: Timestamp.now(),
                            }, { merge: true });
                            setMentorStatus('none');
                            setSuccess('You can now reapply with updated mentor criteria.');
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to reset application status');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                        className="mt-4 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-sm disabled:opacity-60"
                      >
                        Reapply Now
                      </button>
                    </div>
                  )}

                  {mentorStatus === 'approved' && (
                    <div className="space-y-6">
                      {mentorApplicationVersion < CURRENT_MENTOR_APPLICATION_VERSION && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                            Mentor criteria were updated. Please reapply so your profile uses the latest focused matching model.
                          </p>
                          <button
                            onClick={async () => {
                              if (!user) return;
                              setIsLoading(true);
                              try {
                                await setDoc(doc(db, 'users', user.uid), {
                                  mentorStatus: 'none',
                                  isMentor: false,
                                  mentorApplicationStatus: 'reset_required',
                                  updatedAt: Timestamp.now(),
                                }, { merge: true });
                                setMentorStatus('none');
                                setIsMentor(false);
                                setSuccess('Mentor status reset. Please submit a new application.');
                                setTimeout(() => setSuccess(''), 3000);
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Failed to reset mentor status');
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            disabled={isLoading}
                            className="mt-3 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm disabled:opacity-60"
                          >
                            Reset and Reapply
                          </button>
                        </div>
                      )}

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300">✓ Approved Mentor</p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">Active Mentor Status</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Toggle your availability</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (!user) return;
                            const newStatus = !isMentor;
                            setIsMentor(newStatus);
                            try {
                              await setDoc(doc(db, 'users', user.uid), { isMentor: newStatus, updatedAt: Timestamp.now() }, { merge: true });
                              setSuccess(newStatus ? 'Mentor mode enabled' : 'Mentor mode disabled');
                              setTimeout(() => setSuccess(''), 3000);
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to update mentor status');
                              setIsMentor(!newStatus);
                            }
                          }}
                          className={`relative w-14 h-7 rounded-full transition ${isMentor ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${isMentor ? 'translate-x-7' : ''}`} />
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expertise Areas</label>
                        <input
                          type="text"
                          value={mentorExpertise}
                          onChange={e => setMentorExpertise(e.target.value)}
                          placeholder="e.g., Web Development, Data Science, Leadership"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This helps students find you based on your expertise</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mentor Tags</label>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {FOCUS_AREA_LABELS.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleMentorTag(tag)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                mentorTags.includes(tag)
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={mentorTags?.join(', ') || ''}
                          onChange={e => setMentorTags(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          placeholder="Add any extra mentor tags as comma-separated text"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use the structured focus areas above first. Extra tags are optional and secondary.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mentor Bio</label>
                        <textarea
                          value={mentorBio}
                          onChange={e => setMentorBio(e.target.value)}
                          rows={4}
                          placeholder="Tell mentees about your experience and what you can help with"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Availability</label>
                        <input
                          type="text"
                          value={availability}
                          onChange={e => setAvailability(e.target.value)}
                          placeholder="e.g., Weekdays 6-8 PM EST"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          if (!user) return;
                          setIsLoading(true);
                          try {
                            await setDoc(doc(db, 'users', user.uid), {
                              mentorExpertise,
                              mentorBio,
                              availability,
                              mentorTags,
                              updatedAt: Timestamp.now()
                            }, { merge: true });
                            setSuccess('Mentor profile updated!');
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to update mentor profile');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Mentor Profile'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Preferences</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Campus Involvement</label>
                    <input
                      type="text"
                      value={campusInvolvement}
                      onChange={e => setCampusInvolvement(e.target.value)}
                      placeholder="Clubs, organizations, activities"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Languages Spoken</label>
                    <input
                      type="text"
                      value={languagesSpoken}
                      onChange={e => setLanguagesSpoken(e.target.value)}
                      placeholder="e.g., English, Spanish, Mandarin"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h3>
                    
                    {[
                      { label: 'Campus Events', state: notifyCampusEvents, setState: setNotifyCampusEvents },
                      { label: 'Mentorship Requests', state: notifyMentorshipRequests, setState: setNotifyMentorshipRequests },
                      { label: 'Community Updates', state: notifyCommunityUpdates, setState: setNotifyCommunityUpdates }
                    ].map(({ label, state, setState }) => (
                      <div key={label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <span className="text-slate-700 dark:text-slate-300">{label}</span>
                        <button
                          onClick={() => setState(!state)}
                          role="switch"
                          aria-checked={state}
                          aria-label={`Toggle ${label} notifications`}
                          className={`relative w-14 h-7 rounded-full transition ${state ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${state ? 'translate-x-7' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Resume Auto-Save</span>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Automatically save profile changes</p>
                      </div>
                      <button
                        onClick={() => setResumeAutoSave(!resumeAutoSave)}
                        className={`relative w-14 h-7 rounded-full transition ${resumeAutoSave ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${resumeAutoSave ? 'translate-x-7' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Dark Mode</span>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Toggle dark theme</p>
                      </div>
                      <button
                        onClick={() => {
                          const next = !darkMode;
                          setDarkMode(next);
                          setIsDark(next);
                          if (user) {
                            setDoc(doc(db, 'users', user.uid), { darkMode: next, updatedAt: Timestamp.now() }, { merge: true });
                          }
                        }}
                        className={`relative w-14 h-7 rounded-full transition ${darkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-7' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!user) return;
                      setIsLoading(true);
                      try {
                        await setDoc(doc(db, 'users', user.uid), {
                          campusInvolvement,
                          languagesSpoken,
                          notifyCampusEvents,
                          notifyMentorshipRequests,
                          notifyCommunityUpdates,
                          resumeAutoSave,
                          darkMode,
                          updatedAt: Timestamp.now()
                        }, { merge: true });
                        setSuccess('Preferences saved!');
                        setTimeout(() => setSuccess(''), 3000);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to save preferences');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              )}

              {activeTab === 'complete' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Complete Profile</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skills</label>
                    <input
                      type="text"
                      value={skills.join(', ')}
                      onChange={e => setSkills(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="React, Python, Leadership (comma-separated)"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Certifications</label>
                    <input
                      type="text"
                      value={certifications.join(', ')}
                      onChange={e => setCertifications(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="AWS Certified, Google Analytics (comma-separated)"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Achievements</label>
                    <textarea
                      value={achievements.join('\n')}
                      onChange={e => setAchievements(e.target.value.split('\n').filter(Boolean))}
                      rows={4}
                      placeholder="One achievement per line"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Work Experience</label>
                    <textarea
                      value={workExperience}
                      onChange={e => setWorkExperience(e.target.value)}
                      rows={6}
                      placeholder="Describe your work experience, internships, and professional roles..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>workExperience: workExperience.trim(),
                          education: education.trim(),
                          

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Education</label>
                    <textarea
                      value={education}
                      onChange={e => setEducation(e.target.value)}
                      rows={6}
                      placeholder="Describe your educational background, degrees, and relevant coursework..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (!user) return;
                      setIsLoading(true);
                      try {
                        await setDoc(doc(db, 'users', user.uid), {
                          skills,
                          certifications,
                          achievements,
                          updatedAt: Timestamp.now()
                        }, { merge: true });
                        setSuccess('Profile updated!');
                        setTimeout(() => setSuccess(''), 3000);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to save complete profile');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Complete Profile'}
                  </button>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Security Settings</h2>
                  
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Email</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Current: {email}</p>
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Change Email
                    </button>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Password</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Keep your account secure with a strong password</p>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Change Password
                    </button>
                  </div>

                  <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-4">Once you delete your account, there is no going back</p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Change Email</h3>
              
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="New Email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowEmailModal(false); setError(''); setCurrentPassword(''); setNewEmail(''); }}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeEmail}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {isLoading ? 'Changing...' : 'Change'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Change Password</h3>
              
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowPasswordModal(false); setError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {isLoading ? 'Changing...' : 'Change'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Delete Account</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">This action cannot be undone. Please enter your password to confirm.</p>
              
              <input
                type="password"
                placeholder="Enter your password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none mb-4"
              />

              {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setError(''); setCurrentPassword(''); }}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;

