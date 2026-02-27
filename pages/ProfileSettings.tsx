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
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole: Role = (localStorage.getItem('unity_user_role') as Role) || 'Domestic Student';
  const privileges = rolePrivileges[userRole] || [];
  
  // Dark mode
  const [darkMode, setDarkMode] = useState(localStorage.getItem('unity_dark_mode') === 'true');
  
  // Basic profile state
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  
  // Student fields
  const [school, setSchool] = useState('');
  const [programName, setProgramName] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  
  // Professional fields
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Password/Email change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState(email);
  const [passwordToDelete, setPasswordToDelete] = useState('');
  
  // Alert states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Mentor fields
  const [isMentor, setIsMentor] = useState(false);
  const [mentorExpertise, setMentorExpertise] = useState('');
  const [mentorBio, setMentorBio] = useState('');
  const [mentorApplicationStatus, setMentorApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  
  // Additional profile fields
  const [bio, setBio] = useState('');
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
  
  // General Settings state
  const [campusInvolvement, setCampusInvolvement] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('');
  const [notifyCampusEvents, setNotifyCampusEvents] = useState(false);
  const [notifyMentorshipRequests, setNotifyMentorshipRequests] = useState(false);
  const [notifyCommunityUpdates, setNotifyCommunityUpdates] = useState(false);
  const [financialAidStatus, setFinancialAidStatus] = useState('');

  // International Student profile fields
  const [homeCountry, setHomeCountry] = useState('');
  const [visaStatus, setVisaStatus] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [needsHousing, setNeedsHousing] = useState(false);
  const [culturalAdjustmentHelp, setCulturalAdjustmentHelp] = useState(false);
  
  // Alumni profile fields
  const [graduationYear, setGraduationYear] = useState('');
  const [currentEmployer, setCurrentEmployer] = useState('');
  const [industry, setIndustry] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [availableForMentoring, setAvailableForMentoring] = useState(false);
  const [canPostJobs, setCanPostJobs] = useState(false);
  
  // Professional profile fields
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [professionalBio, setProfessionalBio] = useState('');
  const [offerInternships, setOfferInternships] = useState(false);
  const [hostWebinars, setHostWebinars] = useState(false);
  
  // Domestic Student fields
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
  const [resumeAutoSave, setResumeAutoSave] = useState(localStorage.getItem('unity_resume_auto_save') === 'true');

  const handleResumeAutoSaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeAutoSave(e.target.checked);
    localStorage.setItem('unity_resume_auto_save', e.target.checked ? 'true' : 'false');
  };

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
        setError('Failed to save profile');
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
        setError('Failed to save profile');
      } finally {
        setIsSaving(false);
      }
    };


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
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setProfilePhoto(data.photoURL || null);
        setPhone(data.phone || '');
        setEmail(data.email || user.email || '');
        setSchool(data.school || '');
        setProgramName(data.programName || '');
        setCurrentYear(data.currentYear || '');
        setCompanyName(data.companyName || '');
        setJobTitle(data.jobTitle || '');
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
      
      // Create unique filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${user.uid}_${timestamp}_${sanitizedFileName}`;
      const fileRef = ref(storage, `profile-photos/${filename}`);
      
      // Upload file
      const uploadResult = await uploadBytes(fileRef, file);
      
      // Get download URL
      const photoURL = await getDownloadURL(fileRef);
      
      // Update Firestore
      await setDoc(doc(db, 'users', user.uid), {
        photoURL,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      // Update local state
      setProfilePhoto(photoURL);
      
      setSuccess('Profile photo updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setError('Failed to upload photo. Please try again.');
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
      setError('Failed to change password');
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
      setError('Failed to change email');
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
      const updateData: any = {
        name: userName,
        displayName: userName,
        firstName,
        lastName,
        phone,
        isMentor,
        mentorExpertise,
        mentorBio,
        updatedAt: Timestamp.now(),
      };
      
      if (userRole === 'Domestic Student' || userRole === 'International Student') {
        updateData.school = school;
        updateData.programName = programName;
        updateData.currentYear = currentYear;
      } else if (userRole === 'Professional') {
        updateData.companyName = companyName;
        updateData.jobTitle = jobTitle;
      }
      
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      
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
      
      // Check mentor application status
      getDoc(doc(db, 'mentorApplications', user.uid)).then(appSnap => {
        if (appSnap.exists()) {
          const appData = appSnap.data();
          setMentorApplicationStatus(appData.status || 'none');
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

  const handleApplyMentor = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      await setDoc(doc(db, 'mentorApplications', user.uid), {
        userId: user.uid,
        userName: userName,
        email: user.email,
        status: 'pending',
        appliedAt: Timestamp.now(),
        userRole,
      });
      setSuccess('Mentor application submitted! Admin will review your request.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Apply mentor error:', err);
      setError('Failed to submit application');
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Manage your account, preferences, and role-specific settings all in one place
          </p>
        </div>
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

        {/* General Preferences */}
        <section className={`${darkMode ? 'dark bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 border-slate-700/30' : 'bg-gradient-to-br from-white via-blue-50/30 to-white border-blue-100'} backdrop-blur-2xl rounded-3xl p-8 border-2 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden group`}> 
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                        <span className="material-symbols-outlined text-white text-3xl">tune</span>
                      </div>
                      <div>
                        <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">General Preferences</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your experience</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all">
                        <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-blue-500">groups</span>
                          Campus Involvement Level
                        </label>
                        <select className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-semibold focus:ring-2 focus:ring-blue-500 transition-all" value={campusInvolvement} onChange={e => setCampusInvolvement(e.target.value)}>
                          <option value="">Select...</option>
                          <option value="Low">🌱 Low</option>
                          <option value="Medium">🌿 Medium</option>
                          <option value="High">🌳 High</option>
                        </select>
                      </div>
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-400 dark:hover:border-purple-500 transition-all">
                        <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-purple-500">language</span>
                          Languages Spoken
                        </label>
                        <input type="text" placeholder="e.g. English, Spanish, Mandarin" value={languagesSpoken} onChange={e => setLanguagesSpoken(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-semibold focus:ring-2 focus:ring-purple-500 transition-all" />
                      </div>
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-pink-400 dark:hover:border-pink-500 transition-all md:col-span-2">
                        <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-pink-500">notifications_active</span>
                          Notification Preferences
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                            <input type="checkbox" checked={notifyCampusEvents} onChange={e => setNotifyCampusEvents(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                            <span className="text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">🎉 Campus Events</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group">
                            <input type="checkbox" checked={notifyMentorshipRequests} onChange={e => setNotifyMentorshipRequests(e.target.checked)} className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500" />
                            <span className="text-sm font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">🤝 Mentorship</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all group">
                            <input type="checkbox" checked={notifyCommunityUpdates} onChange={e => setNotifyCommunityUpdates(e.target.checked)} className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500" />
                            <span className="text-sm font-semibold group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">💬 Community</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-6">
                      <button className="px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2" onClick={handleSaveDomesticStudentProfile} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">save</span>
                            Save Preferences
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </section>
        {/* Account Overview */}
        <section className={`${darkMode ? 'dark bg-slate-900/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-3xl p-8 border shadow-2xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-4xl">account_circle</span>
              Account Overview
            </h2>

            {/* Profile Photo Section - Centered & Prominent */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="relative w-32 h-32 rounded-full shadow-2xl border-4 border-white dark:border-gray-700 object-cover" />
                ) : (
                  <div className="relative w-32 h-32 rounded-full shadow-2xl border-4 border-white dark:border-gray-700 bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-5xl font-black">
                    {userName[0] || 'U'}
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <div className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Upload Photo
                  </div>
                </label>
                <button 
                  onClick={handleGenImage} 
                  disabled={isGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  {isGenerating ? 'Generating...' : 'AI Photo'}
                </button>
              </div>
            </div>

            {/* Account Info Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* First Name Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">person</span>
                  </div>
                  <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">First Name</label>
                </div>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                />
              </div>

              {/* Last Name Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">badge</span>
                  </div>
                  <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Name</label>
                </div>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                />
              </div>

              {/* Phone Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400">phone</span>
                  </div>
                  <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Phone Number</label>
                </div>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                />
              </div>

              {/* Email Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">email</span>
                  </div>
                  <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email Address</label>
                </div>
                <input 
                  type="email" 
                  value={email} 
                  readOnly 
                  className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-lg font-bold text-gray-500 dark:text-gray-400 mb-3" 
                />
                <button 
                  onClick={() => setShowEmailModal(true)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Change Email
                </button>
              </div>

              {/* Password Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">lock</span>
                  </div>
                  <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Password</label>
                </div>
                <div className="text-gray-400 dark:text-gray-500 text-sm mb-3 font-medium">••••••••••••</div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Change Password
                </button>
              </div>
              
              {/* Student-specific fields */}
              {(userRole === 'Domestic Student' || userRole === 'International Student') && (
                <>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">school</span>
                      </div>
                      <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">School</label>
                    </div>
                    <input 
                      type="text" 
                      value={school} 
                      onChange={e => setSchool(e.target.value)} 
                      className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-teal-600 dark:text-teal-400">menu_book</span>
                      </div>
                      <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Program Name</label>
                    </div>
                    <input 
                      type="text" 
                      value={programName} 
                      onChange={e => setProgramName(e.target.value)} 
                      className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400">calendar_today</span>
                      </div>
                      <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Current Year</label>
                    </div>
                    <input 
                      type="text" 
                      value={currentYear} 
                      onChange={e => setCurrentYear(e.target.value)} 
                      className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                </>
              )}
              
              {/* Professional-specific fields */}
              {userRole === 'Professional' && (
                <>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">business</span>
                      </div>
                      <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Company Name</label>
                    </div>
                    <input 
                      type="text" 
                      value={companyName} 
                      onChange={e => setCompanyName(e.target.value)} 
                      className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-teal-600 dark:text-teal-400">work</span>
                      </div>
                      <label className="font-black text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wider">Job Title</label>
                    </div>
                    <input 
                      type="text" 
                      value={jobTitle} 
                      onChange={e => setJobTitle(e.target.value)} 
                      className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" 
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white rounded-xl font-black shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Save Changes
                  </>
                )}
              </button>
              <button 
                onClick={handleLogout}
                className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-black shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">delete_forever</span>
                Delete Account
              </button>
            </div>
          </div>
        </section>

        {/* Resume Auto-Save */}
        <div className={`${darkMode ? 'dark bg-gradient-to-br from-emerald-900/20 via-teal-900/20 to-cyan-900/20 border-emerald-700/30' : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200'} backdrop-blur-2xl rounded-3xl p-6 border-2 shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden group`}> 
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                  <span className="material-symbols-outlined text-white text-2xl">sync</span>
                </div>
                <div>
                  <h2 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Resume Auto-Save</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically save your resume changes</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={resumeAutoSave}
                  onChange={handleResumeAutoSaveChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600"></div>
              </label>
            </div>
            <div className="mt-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {resumeAutoSave ? (
                  <span className="flex items-center gap-2"><span className="text-emerald-600 dark:text-emerald-400">✓</span> Auto-save is <strong>enabled</strong>. Your resume changes will be saved automatically.</span>
                ) : (
                  <span className="flex items-center gap-2"><span className="text-gray-400">○</span> Auto-save is <strong>disabled</strong>. Remember to click Save to persist your changes.</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Become a Mentor - Only show if not already a mentor and no pending application */}
        {!isMentor && mentorApplicationStatus !== 'pending' && (
        <section className={`${darkMode ? 'dark bg-gradient-to-br from-green-900/30 via-emerald-900/30 to-teal-900/30 border-green-700/30' : 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200'} backdrop-blur-2xl rounded-3xl p-8 border-2 shadow-2xl hover:shadow-green-500/20 transition-all duration-300 relative overflow-hidden group`}>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg">
                <span className="material-symbols-outlined text-white text-4xl">school</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">Become a Mentor</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Share your expertise and help students succeed. Apply to become an official mentor and make a lasting impact on the next generation.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-2xl font-black text-green-600 dark:text-green-400">1000+</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Students Helped</div>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">500+</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Mentors</div>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-2xl font-black text-teal-600 dark:text-teal-400">4.9★</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Rating</div>
              </div>
            </div>
            <button
              onClick={handleApplyMentor}
              disabled={isSaving}
              className="w-full px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white rounded-xl font-black shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl">school</span>
                  <span>Apply to Become a Mentor</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </section>
        )}
        
        {/* Application Pending Message */}
        {!isMentor && mentorApplicationStatus === 'pending' && (
        <section className={`${darkMode ? 'dark bg-gradient-to-br from-yellow-900/30 via-amber-900/30 to-orange-900/30 border-yellow-700/30' : 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-yellow-200'} backdrop-blur-2xl rounded-3xl p-8 border-2 shadow-2xl relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg">
                <span className="material-symbols-outlined text-white text-4xl">pending</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">Application Under Review</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Your mentor application is currently being reviewed by our admin team. You'll receive a notification once a decision has been made. Thank you for your patience!
                </p>
              </div>
            </div>
          </div>
        </section>
        )}
        
        {/* Already a Mentor Message */}
        {isMentor && (
        <section className={`${darkMode ? 'dark bg-gradient-to-br from-blue-900/30 via-indigo-900/30 to-purple-900/30 border-blue-700/30' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200'} backdrop-blur-2xl rounded-3xl p-8 border-2 shadow-2xl relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <span className="material-symbols-outlined text-white text-4xl">verified</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">You're a Verified Mentor! 🎉</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  You have full mentor privileges and can now guide students on their journey. Keep up the great work!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.href = '/mentorship'}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">diversity_3</span>
                    View Mentorship Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Complete Profile */}
        <section className={`${darkMode ? 'dark bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20 border-indigo-700/30' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200'} backdrop-blur-2xl rounded-3xl p-8 border-2 shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden group`}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-lg">
                <span className="material-symbols-outlined text-white text-3xl">person</span>
              </div>
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Complete Profile</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Build your professional presence</p>
              </div>
            </div>
          <div className="space-y-6">
            {/* Bio */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all">
              <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-indigo-500">description</span>
                About Me
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px]"
              />
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-400 dark:hover:border-purple-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-purple-500">phone</span>
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-pink-400 dark:hover:border-pink-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-pink-500">location_on</span>
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-pink-500 transition-all"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-blue-500">language</span>
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-blue-600">work</span>
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-gray-700 dark:text-gray-400">code</span>
                  GitHub
                </label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-gray-500 transition-all"
                />
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-sky-400 dark:hover:border-sky-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-sky-500">tag</span>
                  Twitter
                </label>
                <input
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/username"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>

            {/* Skills & Interests */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500">psychology</span>
                  Skills
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, React, Data Analysis"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-amber-400 dark:hover:border-amber-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-amber-500">favorite</span>
                  Interests
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. AI, Entrepreneurship, Music"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Professional Info */}
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all">
              <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-indigo-500">work_history</span>
                Work Experience
              </label>
              <textarea
                value={workExperience}
                onChange={(e) => setWorkExperience(e.target.value)}
                placeholder="List your work experience..."
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px]"
              />
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-400 dark:hover:border-purple-500 transition-all">
              <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-purple-500">school</span>
                Education
              </label>
              <textarea
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="List your education background..."
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-purple-500 transition-all min-h-[80px]"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-blue-500">verified</span>
                  Certifications
                </label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="e.g. AWS Certified, PMP"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all">
                <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-yellow-600">emoji_events</span>
                  Achievements
                </label>
                <input
                  type="text"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="e.g. Dean's List, Hackathon Winner"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-yellow-500 transition-all"
                />
              </div>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-green-400 dark:hover:border-green-500 transition-all">
              <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-green-500">schedule</span>
                Availability
              </label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g. Weekdays 6-9 PM EST"
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>

            {/* Mentor Toggle */}
            <div className="pt-6 border-t-2 border-gray-200/50 dark:border-gray-700/50">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border-2 border-teal-200 dark:border-teal-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
                      <span className="material-symbols-outlined text-white text-2xl">diversity_3</span>
                    </div>
                    <div>
                      <label className="font-bold text-lg text-gray-900 dark:text-white">Available as Mentor</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Help others grow and learn</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMentor}
                      onChange={(e) => handleMentorToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-teal-500 peer-checked:to-cyan-600"></div>
                  </label>
                </div>
                {isMentor && (
                  <div className="space-y-4 mt-6 pt-6 border-t border-teal-200 dark:border-teal-700/50">
                    <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4">
                      <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-teal-500">lightbulb</span>
                        Mentorship Expertise
                      </label>
                      <input
                        type="text"
                        value={mentorExpertise}
                        onChange={(e) => setMentorExpertise(e.target.value)}
                        placeholder="e.g., Computer Science, Career Guidance"
                        className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-lg px-4 py-3 text-base font-medium focus:ring-2 focus:ring-teal-500 transition-all"
                      />
                    </div>
                    <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-4">
                      <label className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-cyan-500">chat</span>
                        Mentor Bio
                      </label>
                      <textarea
                        value={mentorBio}
                        onChange={(e) => setMentorBio(e.target.value)}
                        placeholder="Tell students how you can help them..."
                        className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-lg px-4 py-3 text-base font-medium focus:ring-2 focus:ring-cyan-500 transition-all min-h-[100px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleMentorProfileSave}
              disabled={isSaving}
              className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-black shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl">save</span>
                  <span>Save Complete Profile</span>
                </>
              )}
            </button>
          </div>
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
