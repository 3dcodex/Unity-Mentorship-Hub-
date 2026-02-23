import React, { useState, useEffect } from 'react';
import { rolePrivileges } from '../rolePrivileges';
import { Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { signOut, updatePassword, updateEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db, storage } from '../src/firebase';
import { doc, getDoc, updateDoc, Timestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateProfessionalHeadshot } from '../services/geminiService';
import { useAuth } from '../App';

const ProfileSettings: React.FC = () => {
      // Financial aid status
      const [financialAidStatus, setFinancialAidStatus] = useState('');
    const { user } = useAuth();
    const userRole: Role = (localStorage.getItem('unity_user_role') as Role) || 'Domestic Student';
  // user and userRole declared once below
  // Domestic Student & General Settings state
  const [campusInvolvement, setCampusInvolvement] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('');
  const [notifyCampusEvents, setNotifyCampusEvents] = useState(false);
  const [notifyMentorshipRequests, setNotifyMentorshipRequests] = useState(false);
  const [notifyCommunityUpdates, setNotifyCommunityUpdates] = useState(false);

  // International Student profile fields
  const [homeCountry, setHomeCountry] = useState('');
  const [visaStatus, setVisaStatus] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [needsHousing, setNeedsHousing] = useState(false);
  const [culturalAdjustmentHelp, setCulturalAdjustmentHelp] = useState(false);
  
  // Alumni profile fields
  const [graduationYear, setGraduationYear] = useState('');
  const [currentEmployer, setCurrentEmployer] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [availableForMentoring, setAvailableForMentoring] = useState(false);
  const [canPostJobs, setCanPostJobs] = useState(false);
  
  // Professional profile fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [professionalBio, setProfessionalBio] = useState('');
  const [offerInternships, setOfferInternships] = useState(false);
  const [hostWebinars, setHostWebinars] = useState(false);
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [clubsSocieties, setClubsSocieties] = useState('');
  const [offerPeerMentorship, setOfferPeerMentorship] = useState(false);
  const [campusBuddy, setCampusBuddy] = useState(false);
  const [maxMentees, setMaxMentees] = useState(1);
  const [expertise, setExpertise] = useState('');
  const [willingMentorIntl, setWillingMentorIntl] = useState(false);
  const [culturalFamiliarity, setCulturalFamiliarity] = useState('');
  const [eventHost, setEventHost] = useState(false);
  const [eventApproval, setEventApproval] = useState('Yes');
  const [eventModeration, setEventModeration] = useState(false);

  // Load user profile data based on role
  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(docSnap => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          
          // Common fields
          setCampusInvolvement(d.campusInvolvement || '');
          setLanguagesSpoken(d.languagesSpoken || '');
          setNotifyCampusEvents(d.notifyCampusEvents || false);
          setNotifyMentorshipRequests(d.notifyMentorshipRequests || false);
          setNotifyCommunityUpdates(d.notifyCommunityUpdates || false);
          
          // Domestic Student fields
          if (userRole === 'Domestic Student') {
            setUniversity(d.university || '');
            setMajor(d.major || '');
            setYearOfStudy(d.yearOfStudy || 1);
            setClubsSocieties(d.clubsSocieties || '');
            setOfferPeerMentorship(d.offerPeerMentorship || false);
            setCampusBuddy(d.campusBuddy || false);
            setMaxMentees(d.maxMentees || 1);
            setExpertise(d.expertise || '');
            setWillingMentorIntl(d.willingMentorIntl || false);
            setCulturalFamiliarity(d.culturalFamiliarity || '');
            setEventHost(d.eventHost || false);
            setEventApproval(d.eventApproval || 'Yes');
            setEventModeration(d.eventModeration || false);
            setFinancialAidStatus(d.financialAidStatus || '');
          }
          
          // International Student fields
          if (userRole === 'International Student') {
            setHomeCountry(d.homeCountry || '');
            setVisaStatus(d.visaStatus || '');
            setArrivalDate(d.arrivalDate || '');
            setNeedsHousing(d.needsHousing || false);
            setCulturalAdjustmentHelp(d.culturalAdjustmentHelp || false);
            setUniversity(d.university || '');
            setMajor(d.major || '');
            setYearOfStudy(d.yearOfStudy || 1);
          }
          
          // Alumni fields
          if (userRole === 'Alumni') {
            setGraduationYear(d.graduationYear || '');
            setCurrentEmployer(d.currentEmployer || '');
            setJobTitle(d.jobTitle || '');
            setIndustry(d.industry || '');
            setYearsExperience(d.yearsExperience || 0);
            setAvailableForMentoring(d.availableForMentoring || false);
            setCanPostJobs(d.canPostJobs || false);
            setMaxMentees(d.maxMentees || 1);
          }
          
          // Professional fields
          if (userRole === 'Professional') {
            setCompanyName(d.companyName || '');
            setCompanyWebsite(d.companyWebsite || '');
            setCompanyIndustry(d.companyIndustry || '');
            setCompanySize(d.companySize || '');
            setProfessionalBio(d.professionalBio || '');
            setOfferInternships(d.offerInternships || false);
            setHostWebinars(d.hostWebinars || false);
          }
        }
      });
    }
  }, [user, userRole]);
    // Save profile based on role
    const handleSaveRoleProfile = async () => {
      if (!user) return;
      setIsSaving(true);
      setError(null);
      try {
        const baseData = {
          campusInvolvement,
          languagesSpoken,
          notifyCampusEvents,
          notifyMentorshipRequests,
          notifyCommunityUpdates,
          updatedAt: Timestamp.now(),
        };
        
        let roleData = {};
        
        if (userRole === 'International Student') {
          roleData = {
            homeCountry,
            visaStatus,
            arrivalDate,
            needsHousing,
            culturalAdjustmentHelp,
            university,
            major,
            yearOfStudy,
          };
        } else if (userRole === 'Alumni') {
          roleData = {
            graduationYear,
            currentEmployer,
            jobTitle,
            industry,
            yearsExperience,
            availableForMentoring,
            canPostJobs,
            maxMentees,
          };
        } else if (userRole === 'Professional') {
          roleData = {
            companyName,
            companyWebsite,
            companyIndustry,
            companySize,
            professionalBio,
            offerInternships,
            hostWebinars,
          };
        }
        
        await setDoc(doc(db, 'users', user.uid), {
          ...baseData,
          ...roleData,
        }, { merge: true });
        
        setSuccess('Profile saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        console.error('Save role profile error:', err);
        setError(err?.message || 'Failed to save profile');
      } finally {
        setIsSaving(false);
      }
    };
    const handleSaveDomesticStudentProfile = async () => {
      if (!user) return;
      setIsSaving(true);
      setError(null);
      try {
        await setDoc(doc(db, 'users', user.uid), {
          campusInvolvement,
          languagesSpoken,
          notifyCampusEvents,
          notifyMentorshipRequests,
          notifyCommunityUpdates,
          university,
          major,
          yearOfStudy,
          clubsSocieties,
          offerPeerMentorship,
          campusBuddy,
          maxMentees,
          expertise,
          willingMentorIntl,
          culturalFamiliarity,
          eventHost,
          eventApproval,
          eventModeration,
          financialAidStatus,
          updatedAt: Timestamp.now(),
        }, { merge: true });
        setSuccess('Domestic Student profile saved!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        console.error('Save domestic student profile error:', err);
        setError(err?.message || 'Failed to save profile');
      } finally {
        setIsSaving(false);
      }
    };
  // Role and privilege logic
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
  // user declared above
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
        const name = data.name || data.displayName || localStorage.getItem('unity_user_name') || 'User';
        setUserName(name);
        setProfilePhoto(data.photoURL || null);
        setPhone(data.phone || '');
        setEmail(data.email || user.email || '');
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
      setError(null);
      
      console.log('Starting photo upload...', file.name);
      
      // Create unique filename
      const timestamp = Date.now();
      const filename = `${user.uid}_${timestamp}_${file.name}`;
      const fileRef = ref(storage, `profile-photos/${filename}`);
      
      console.log('Uploading to:', `profile-photos/${filename}`);
      
      // Upload file
      const uploadResult = await uploadBytes(fileRef, file);
      console.log('Upload complete:', uploadResult);
      
      // Get download URL
      const photoURL = await getDownloadURL(fileRef);
      console.log('Got download URL:', photoURL);
      
      // Update Firestore
      await setDoc(doc(db, 'users', user.uid), {
        photoURL,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      console.log('Firestore updated');
      
      // Update local state
      setProfilePhoto(photoURL);
      
      setSuccess('Profile photo updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setError(err?.message || 'Failed to upload photo. Please try again.');
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
        await setDoc(doc(db, 'users', user.uid), {
          photoURL: img,
          updatedAt: Timestamp.now(),
        }, { merge: true });
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
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Change password error:', err);
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

      await setDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setSuccess('Email changed successfully!');
      setShowEmailModal(false);
      setEmail(newEmail);
      setCurrentPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Change email error:', err);
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
      await setDoc(doc(db, 'users', user.uid), {
        name: userName,
        displayName: userName,
        phone,
        isMentor,
        mentorExpertise,
        mentorBio,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      localStorage.setItem('unity_user_name', userName);
      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setError(err?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Mentor toggle and fields
  const [isMentor, setIsMentor] = useState(false);
  const [mentorExpertise, setMentorExpertise] = useState('');
  const [mentorBio, setMentorBio] = useState('');
  
  // Additional profile fields for comprehensive display
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [achievements, setAchievements] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [availability, setAvailability] = useState('');

  // Load mentor status from Firestore
  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsMentor(data.isMentor || false);
          setMentorExpertise(data.mentorExpertise || '');
          setMentorBio(data.mentorBio || '');
          setBio(data.bio || '');
          setPhone(data.phone || '');
          setLocation(data.location || '');
          setWebsite(data.website || '');
          setLinkedin(data.linkedin || '');
          setGithub(data.github || '');
          setTwitter(data.twitter || '');
          setSkills(data.skills || '');
          setInterests(data.interests || '');
          setAchievements(data.achievements || '');
          setWorkExperience(data.workExperience || '');
          setEducation(data.education || '');
          setCertifications(data.certifications || '');
          setAvailability(data.availability || '');
        }
      });
    }
  }, [user]);

  const handleMentorToggle = async (checked: boolean) => {
    if (!user) return;
    setIsMentor(checked);
    setIsSaving(true);
    setError(null);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        isMentor: checked,
        mentorExpertise: checked ? mentorExpertise : '',
        mentorBio: checked ? mentorBio : '',
        updatedAt: Timestamp.now(),
      }, { merge: true });
      setSuccess(checked ? 'You are now a mentor!' : 'Mentor status removed');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Mentor toggle error:', err);
      setError(err?.message || 'Failed to update mentor status');
      setIsMentor(!checked);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMentorProfileSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        isMentor,
        mentorExpertise,
        mentorBio,
        bio,
        phone,
        location,
        website,
        linkedin,
        github,
        twitter,
        skills,
        interests,
        achievements,
        workExperience,
        education,
        certifications,
        availability,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Profile save error:', err);
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

        {/* General User Settings - Modern Card Design */}
                {/* Add some general settings from Domestic Student profile */}
                <section className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-8 border shadow-lg mb-8`}> 
                  <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl">tune</span>
                    General Preferences
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Campus involvement level */}
                    <div className="flex flex-col gap-2">
                      <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Campus Involvement Level</label>
                      <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium" value={campusInvolvement} onChange={e => setCampusInvolvement(e.target.value)}>
                        <option value="">Select...</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    {/* Languages spoken */}
                    <div className="flex flex-col gap-2">
                      <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Languages Spoken</label>
                      <input type="text" placeholder="e.g. English, Spanish" value={languagesSpoken} onChange={e => setLanguagesSpoken(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium" />
                    </div>
                    {/* Notifications */}
                    <div className="flex flex-col gap-2">
                      <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Notification Preferences</label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={notifyCampusEvents} onChange={e => setNotifyCampusEvents(e.target.checked)} /> Campus event invites
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={notifyMentorshipRequests} onChange={e => setNotifyMentorshipRequests(e.target.checked)} /> Mentorship requests
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={notifyCommunityUpdates} onChange={e => setNotifyCommunityUpdates(e.target.checked)} /> Community group updates
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button className="px-6 py-2 bg-primary hover:bg-primary-dark transition text-white rounded-xl font-bold shadow-sm" onClick={handleSaveDomesticStudentProfile} disabled={isSaving}>Save Preferences</button>
                  </div>
                </section>
        <section className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-8 border shadow-lg mb-8`}> 
          <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">person</span>
            Account Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Username</label>
              <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
            </div>
            {/* Phone Number */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Phone Number</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-primary hover:bg-primary-dark transition text-white rounded-xl font-bold shadow-sm" onClick={handleSaveProfile} disabled={isSaving}>Save Profile</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <input type="email" value={email} readOnly className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium" />
              <button className="mt-2 px-4 py-2 bg-primary hover:bg-primary-dark transition text-white rounded-xl font-bold shadow-sm" onClick={() => setShowEmailModal(true)}>Change Email</button>
            </div>
            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Change Password</label>
              <button className="mt-2 px-4 py-2 bg-primary hover:bg-primary-dark transition text-white rounded-xl font-bold shadow-sm" onClick={() => setShowPasswordModal(true)}>Change Password</button>
            </div>
            {/* Profile Photo */}
            <div className="flex flex-col gap-2 items-center">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Profile Photo</label>
              {profilePhoto && <img src={profilePhoto} alt="Profile" className="w-20 h-20 rounded-full mb-2 shadow-lg border-4 border-primary" />}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium" />
              <button className="mt-2 px-4 py-2 bg-primary hover:bg-primary-dark transition text-white rounded-xl font-bold shadow-sm" onClick={handleGenImage} disabled={isGenerating}>Generate AI Photo</button>
            </div>
          </div>
          {/* Logout & Delete Account */}
          <div className="flex gap-4 justify-end mt-6">
            <button className="px-6 py-2 bg-gray-600 hover:bg-gray-700 transition text-white rounded-xl font-bold shadow-sm" onClick={handleLogout}>Logout</button>
            <button className="px-6 py-2 bg-red-600 hover:bg-red-700 transition text-white rounded-xl font-bold shadow-sm" onClick={() => setShowDeleteModal(true)}>Delete Account</button>
          </div>
        </section>

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

        {/* Mentor Profile Section */}
        <section className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm`}>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">school</span>
            Become a Mentor
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Share your expertise and help students succeed. Apply to become an official mentor on the platform.
          </p>
          <button
            onClick={() => navigate('/become-mentor')}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">school</span>
            Apply to Become a Mentor
          </button>
        </section>

        {/* Complete Profile Section */}
        <section className={`${darkMode ? 'dark bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl sm:rounded-3xl p-6 sm:p-8 border shadow-sm`}>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">school</span>
            Complete Profile
          </h2>
          <div className="space-y-6">
            {/* Bio */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">About Me</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary min-h-[100px]"
              />
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">LinkedIn</label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">GitHub</label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Twitter</label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/username"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Skills & Interests */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Skills</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, React, Data Analysis"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Interests</label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. AI, Entrepreneurship, Music"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Professional Info */}
            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Work Experience</label>
              <textarea
                value={workExperience}
                onChange={(e) => setWorkExperience(e.target.value)}
                placeholder="List your work experience..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary min-h-[80px]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Education</label>
              <textarea
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="List your education background..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary min-h-[80px]"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Certifications</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="e.g. AWS Certified, PMP"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Achievements</label>
                <input
                  type="text"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="e.g. Dean's List, Hackathon Winner"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Availability</label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g. Weekdays 6-9 PM EST"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Mentor Toggle */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Available as Mentor</label>
                <input
                  type="checkbox"
                  checked={isMentor}
                  onChange={(e) => handleMentorToggle(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              {isMentor && (
                <>
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Mentorship Expertise</label>
                    <input
                      type="text"
                      value={mentorExpertise}
                      onChange={(e) => setMentorExpertise(e.target.value)}
                      placeholder="e.g., Computer Science, Career Guidance"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Mentor Bio</label>
                    <textarea
                      value={mentorBio}
                      onChange={(e) => setMentorBio(e.target.value)}
                      placeholder="Tell students how you can help them..."
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary min-h-[100px]"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleMentorProfileSave}
              disabled={isSaving}
              className="w-full px-6 py-3 bg-primary hover:bg-primary-dark transition text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Save Complete Profile
                </>
              )}
            </button>
          </div>
        </section>

        {/* Page Header - More meaningful and above account section */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-primary mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl">settings</span>
            Account & Profile Management
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300 font-medium">Update your account details, security, and preferences. All your general settings are below, followed by role-specific privileges and options.</p>
        </header>
        {/* Role & Privilege Summary and role-specific sections */}
                {/* Domestic Student Profile Settings */}
                {userRole === 'Domestic Student' && (
                  <section className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-8 border shadow-lg mb-8`}> 
                    <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl">school</span>
                      Domestic Student Profile
                    </h2>
                    
                    {/* Academic Information */}
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">menu_book</span>
                        Academic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">University</label>
                          <input 
                            type="text" 
                            placeholder="Your university" 
                            value={university} 
                            onChange={e => setUniversity(e.target.value)} 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" 
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Major</label>
                          <input 
                            type="text" 
                            placeholder="Your major" 
                            value={major} 
                            onChange={e => setMajor(e.target.value)} 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" 
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Year of Study</label>
                          <select 
                            value={yearOfStudy} 
                            onChange={e => setYearOfStudy(Number(e.target.value))} 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                          >
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year</option>
                            <option value={5}>5th Year+</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Financial Aid Status</label>
                          <select 
                            value={financialAidStatus} 
                            onChange={e => setFinancialAidStatus(e.target.value)} 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select...</option>
                            <option value="Not Applied">Not Applied</option>
                            <option value="Applied">Applied</option>
                            <option value="Approved">Approved</option>
                            <option value="Denied">Denied</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Campus Involvement */}
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">groups</span>
                        Campus Involvement
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Clubs & Societies</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Robotics Club, Debate Society" 
                            value={clubsSocieties} 
                            onChange={e => setClubsSocieties(e.target.value)} 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" 
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Campus Involvement Level</label>
                          <select 
                            value={campusInvolvement} 
                            onChange={e => setCampusInvolvement(e.target.value)} 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select...</option>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Languages Spoken</label>
                          <input 
                            type="text" 
                            placeholder="e.g. English, Spanish" 
                            value={languagesSpoken} 
                            onChange={e => setLanguagesSpoken(e.target.value)} 
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mentorship Preferences */}
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">diversity_3</span>
                        Mentorship Preferences
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input 
                            type="checkbox" 
                            checked={offerPeerMentorship} 
                            onChange={e => setOfferPeerMentorship(e.target.checked)} 
                            className="w-5 h-5 text-primary focus:ring-primary rounded"
                          />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Offer Peer Mentorship</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input 
                            type="checkbox" 
                            checked={campusBuddy} 
                            onChange={e => setCampusBuddy(e.target.checked)} 
                            className="w-5 h-5 text-primary focus:ring-primary rounded"
                          />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Available for Campus Buddy Program</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input 
                            type="checkbox" 
                            checked={willingMentorIntl} 
                            onChange={e => setWillingMentorIntl(e.target.checked)} 
                            className="w-5 h-5 text-primary focus:ring-primary rounded"
                          />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Willing to Mentor International Students</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input 
                            type="checkbox" 
                            checked={eventHost} 
                            onChange={e => setEventHost(e.target.checked)} 
                            className="w-5 h-5 text-primary focus:ring-primary rounded"
                          />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Can Host Campus Events</label>
                        </div>
                        {offerPeerMentorship && (
                          <>
                            <div className="flex flex-col gap-2">
                              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Max Mentees Allowed</label>
                              <input 
                                type="number" 
                                min="1" 
                                max="20" 
                                value={maxMentees} 
                                onChange={e => setMaxMentees(Number(e.target.value))} 
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" 
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Areas of Expertise</label>
                              <select 
                                value={expertise} 
                                onChange={e => setExpertise(e.target.value)} 
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Select...</option>
                                <option value="Academic Tutoring">Academic Tutoring</option>
                                <option value="Career Guidance">Career Guidance</option>
                                <option value="Leadership">Leadership</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </>
                        )}
                        {willingMentorIntl && (
                          <div className="flex flex-col gap-2">
                            <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Cultural Familiarity Level</label>
                            <select 
                              value={culturalFamiliarity} 
                              onChange={e => setCulturalFamiliarity(e.target.value)} 
                              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Select...</option>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notification Preferences */}
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">notifications</span>
                        Notification Preferences
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input 
                            type="checkbox" 
                            checked={notifyCampusEvents} 
                            onChange={e => setNotifyCampusEvents(e.target.checked)} 
                            className="w-5 h-5 text-primary focus:ring-primary rounded"
                          />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Campus Event Invites</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input 
                            type="checkbox" 
                            checked={notifyMentorshipRequests} 
                            onChange={e => setNotifyMentorshipRequests(e.target.checked)} 
                            className="w-5 h-5 text-primary focus:ring-primary rounded"
                          />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Mentorship Requests</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input 
                            type="checkbox" 
                            checked={notifyCommunityUpdates} 
                            onChange={e => setNotifyCommunityUpdates(e.target.checked)} 
                            className="w-5 h-5 text-primary focus:ring-primary rounded"
                          />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Community Group Updates</label>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button 
                        className="px-8 py-3 bg-primary hover:bg-primary/90 transition text-white rounded-xl font-bold shadow-lg flex items-center gap-2" 
                        onClick={handleSaveDomesticStudentProfile} 
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">save</span>
                            Save Profile
                          </>
                        )}
                      </button>
                    </div>
                  </section>
                )}

                {/* International Student Profile Settings */}
                {userRole === 'International Student' && (
                  <section className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-8 border shadow-lg mb-8`}>
                    <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl">public</span>
                      International Student Profile
                    </h2>
                    
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">flight</span>
                        Immigration & Status
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Home Country</label>
                          <input type="text" placeholder="Your home country" value={homeCountry} onChange={e => setHomeCountry(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Visa Status</label>
                          <select value={visaStatus} onChange={e => setVisaStatus(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary">
                            <option value="">Select...</option>
                            <option value="F-1">F-1 Student Visa</option>
                            <option value="J-1">J-1 Exchange Visitor</option>
                            <option value="M-1">M-1 Vocational Student</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Arrival Date</label>
                          <input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">school</span>
                        Academic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">University</label>
                          <input type="text" placeholder="Your university" value={university} onChange={e => setUniversity(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Major</label>
                          <input type="text" placeholder="Your major" value={major} onChange={e => setMajor(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Year of Study</label>
                          <select value={yearOfStudy} onChange={e => setYearOfStudy(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary">
                            <option value={1}>1st Year</option>
                            <option value={2}>2nd Year</option>
                            <option value={3}>3rd Year</option>
                            <option value={4}>4th Year</option>
                            <option value={5}>5th Year+</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Languages Spoken</label>
                          <input type="text" placeholder="e.g. English, Spanish, Mandarin" value={languagesSpoken} onChange={e => setLanguagesSpoken(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">support</span>
                        Support Needs
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input type="checkbox" checked={needsHousing} onChange={e => setNeedsHousing(e.target.checked)} className="w-5 h-5 text-primary focus:ring-primary rounded" />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Need Housing Assistance</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input type="checkbox" checked={culturalAdjustmentHelp} onChange={e => setCulturalAdjustmentHelp(e.target.checked)} className="w-5 h-5 text-primary focus:ring-primary rounded" />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Cultural Adjustment Support</label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button className="px-8 py-3 bg-primary hover:bg-primary/90 transition text-white rounded-xl font-bold shadow-lg flex items-center gap-2" onClick={handleSaveRoleProfile} disabled={isSaving}>
                        {isSaving ? <><span className="material-symbols-outlined animate-spin">progress_activity</span>Saving...</> : <><span className="material-symbols-outlined">save</span>Save Profile</>}
                      </button>
                    </div>
                  </section>
                )}

                {/* Alumni Profile Settings */}
                {userRole === 'Alumni' && (
                  <section className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-8 border shadow-lg mb-8`}>
                    <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
                      Alumni Profile
                    </h2>
                    
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">school</span>
                        Education Background
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Graduation Year</label>
                          <input type="text" placeholder="e.g. 2020" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">work</span>
                        Professional Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Current Employer</label>
                          <input type="text" placeholder="Company name" value={currentEmployer} onChange={e => setCurrentEmployer(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Job Title</label>
                          <input type="text" placeholder="Your position" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Industry</label>
                          <input type="text" placeholder="e.g. Technology, Finance" value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Years of Experience</label>
                          <input type="number" min="0" value={yearsExperience} onChange={e => setYearsExperience(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">diversity_3</span>
                        Mentorship & Opportunities
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input type="checkbox" checked={availableForMentoring} onChange={e => setAvailableForMentoring(e.target.checked)} className="w-5 h-5 text-primary focus:ring-primary rounded" />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Available for Mentoring</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input type="checkbox" checked={canPostJobs} onChange={e => setCanPostJobs(e.target.checked)} className="w-5 h-5 text-primary focus:ring-primary rounded" />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Can Post Job Referrals</label>
                        </div>
                        {availableForMentoring && (
                          <div className="flex flex-col gap-2">
                            <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Max Mentees</label>
                            <input type="number" min="1" max="20" value={maxMentees} onChange={e => setMaxMentees(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button className="px-8 py-3 bg-primary hover:bg-primary/90 transition text-white rounded-xl font-bold shadow-lg flex items-center gap-2" onClick={handleSaveRoleProfile} disabled={isSaving}>
                        {isSaving ? <><span className="material-symbols-outlined animate-spin">progress_activity</span>Saving...</> : <><span className="material-symbols-outlined">save</span>Save Profile</>}
                      </button>
                    </div>
                  </section>
                )}

                {/* Professional Profile Settings */}
                {userRole === 'Professional' && (
                  <section className={`${darkMode ? 'dark bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-3xl p-8 border shadow-lg mb-8`}>
                    <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl">business_center</span>
                      Professional Profile
                    </h2>
                    
                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">corporate_fare</span>
                        Company Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Company Name</label>
                          <input type="text" placeholder="Your company" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Company Website</label>
                          <input type="url" placeholder="https://company.com" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Industry</label>
                          <input type="text" placeholder="e.g. Technology, Healthcare" value={companyIndustry} onChange={e => setCompanyIndustry(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Company Size</label>
                          <select value={companySize} onChange={e => setCompanySize(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary">
                            <option value="">Select...</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501+">501+ employees</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Professional Bio
                      </h3>
                      <textarea value={professionalBio} onChange={e => setProfessionalBio(e.target.value)} placeholder="Tell students about your company and what opportunities you offer..." className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary min-h-[120px]" />
                    </div>

                    <div className="mb-8">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">handshake</span>
                        Engagement Options
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input type="checkbox" checked={offerInternships} onChange={e => setOfferInternships(e.target.checked)} className="w-5 h-5 text-primary focus:ring-primary rounded" />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Offer Internships</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <input type="checkbox" checked={hostWebinars} onChange={e => setHostWebinars(e.target.checked)} className="w-5 h-5 text-primary focus:ring-primary rounded" />
                          <label className="font-bold text-sm text-gray-700 dark:text-gray-200">Host Webinars/AMAs</label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button className="px-8 py-3 bg-primary hover:bg-primary/90 transition text-white rounded-xl font-bold shadow-lg flex items-center gap-2" onClick={handleSaveRoleProfile} disabled={isSaving}>
                        {isSaving ? <><span className="material-symbols-outlined animate-spin">progress_activity</span>Saving...</> : <><span className="material-symbols-outlined">save</span>Save Profile</>}
                      </button>
                    </div>
                  </section>
                )}
        <section>
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
        </section>
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
