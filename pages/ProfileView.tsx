import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../src/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../App';

const ProfileView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    if (userId && user) {
      setLoading(true);
      Promise.all([
        getDoc(doc(db, 'users', userId)),
        getDoc(doc(db, 'users', user.uid))
      ]).then(([profileSnap, currentUserSnap]) => {
        if (profileSnap.exists()) {
          setProfile({ id: profileSnap.id, ...profileSnap.data() });
        }
        if (currentUserSnap.exists()) {
          const userData = currentUserSnap.data();
          setCurrentUserRole(userData.role || '');
          setIsBlocked(userData.blockedUsers?.includes(userId) || false);
        }
        setLoading(false);
      }).catch(err => {
        console.error('Error loading profile:', err);
        setLoading(false);
      });
    }
  }, [userId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">person_off</span>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Profile not found</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.uid === userId;
  const displayName = profile.name || profile.displayName || 'User';
  const photoURL = profile.photoURL || null;
  const isMentorOrAdmin = currentUserRole === 'mentor' || currentUserRole === 'admin' || currentUserRole === 'super_admin';

  const handleCreateChatRoom = async () => {
    if (!user || !userId) return;
    try {
      const chatRoomId = [user.uid, userId].sort().join('_');
      await setDoc(doc(db, 'chatRooms', chatRoomId), {
        participants: [user.uid, userId],
        createdBy: user.uid,
        createdAt: new Date(),
        lastMessage: null,
        type: 'mentorship'
      }, { merge: true });
      navigate(`/quick-chat?room=${chatRoomId}`);
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert('Failed to create chat room');
    }
  };

  const handleScheduleSession = () => {
    navigate(`/mentorship/book?mentor=${userId}`);
  };

  const handleFileComplaint = async () => {
    if (!user || !complaintText.trim()) return;
    try {
      await setDoc(doc(db, 'reports', `${user.uid}_${userId}_${Date.now()}`), {
        reporterId: user.uid,
        reportedUserId: userId,
        type: 'mentorship_complaint',
        description: complaintText,
        status: 'open',
        createdAt: new Date()
      });
      setShowComplaintModal(false);
      setComplaintText('');
      alert('Complaint submitted successfully');
    } catch (error) {
      console.error('Error filing complaint:', error);
      alert('Failed to submit complaint');
    }
  };

  const handleBlockUser = async () => {
    if (!user) return;
    try {
      if (isBlocked) {
        await updateDoc(doc(db, 'users', user.uid), {
          blockedUsers: arrayRemove(userId)
        });
        setIsBlocked(false);
      } else {
        await updateDoc(doc(db, 'users', user.uid), {
          blockedUsers: arrayUnion(userId)
        });
        setIsBlocked(true);
      }
      setShowBlockModal(false);
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to update block status');
    }
  };

  const handleRequestBilling = () => {
    navigate(`/billing?mentor=${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 font-bold transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>

        {/* Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16">
              {/* Profile Photo */}
              <div className="relative">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="size-32 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-xl"
                  />
                ) : (
                  <div className="size-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center">
                    <span className="text-5xl font-black text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {profile.isMentor && (
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 size-10 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg">
                    <span className="material-symbols-outlined text-white text-lg">workspace_premium</span>
                  </div>
                )}
              </div>

              {/* Name and Role */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-black text-gray-900 dark:text-white">{displayName}</h1>
                  {profile.isMentor && (
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-black rounded-full uppercase tracking-wider">
                      Mentor
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-wrap text-sm">
                  {profile.role && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="material-symbols-outlined text-lg">school</span>
                      <span className="font-bold">{profile.role}</span>
                    </div>
                  )}
                  {profile.university && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                      <span className="font-bold">{profile.university}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/quick-chat?user=${userId}`)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>
                    Message
                  </button>
                  {(isMentorOrAdmin || profile.isMentor) && (
                    <>
                      <button
                        onClick={handleCreateChatRoom}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">group_add</span>
                        Chat Room
                      </button>
                      <button
                        onClick={handleScheduleSession}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                        Schedule
                      </button>
                      <button
                        onClick={() => setShowComplaintModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">report</span>
                        Complain
                      </button>
                      <button
                        onClick={() => setShowBlockModal(true)}
                        className={`px-4 py-2 ${isBlocked ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2`}
                      >
                        <span className="material-symbols-outlined text-lg">{isBlocked ? 'check_circle' : 'block'}</span>
                        {isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={handleRequestBilling}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">payments</span>
                        Billing
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* About */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
                About
              </h2>
              {profile.mentorBio || profile.bio || profile.professionalBio ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {profile.mentorBio || profile.bio || profile.professionalBio}
                </p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">No bio provided</p>
              )}
            </div>

            {/* Contact Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">contact_mail</span>
                Contact
              </h2>
              <div className="space-y-3">
                {profile.email && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-lg">email</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-lg">phone</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-lg">location_on</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{profile.location}</span>
                  </div>
                )}
                {profile.languagesSpoken && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-lg">language</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{profile.languagesSpoken}</span>
                  </div>
                )}
                {/* Social Links */}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:underline">
                    <span className="material-symbols-outlined text-lg">link</span>
                    <span className="text-sm font-medium">Website</span>
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:underline">
                    <span className="material-symbols-outlined text-lg">work</span>
                    <span className="text-sm font-medium">LinkedIn</span>
                  </a>
                )}
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:underline">
                    <span className="material-symbols-outlined text-lg">code</span>
                    <span className="text-sm font-medium">GitHub</span>
                  </a>
                )}
                {profile.twitter && (
                  <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 dark:text-blue-400 hover:underline">
                    <span className="material-symbols-outlined text-lg">tag</span>
                    <span className="text-sm font-medium">Twitter</span>
                  </a>
                )}
              </div>
            </div>

            {/* Skills/Expertise */}
            {(profile.skills || profile.mentorExpertise || profile.expertise) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">stars</span>
                  Skills & Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills || profile.mentorExpertise || profile.expertise).split(',').map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {profile.interests && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">favorite</span>
                  Interests
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.split(',').map((interest: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold">
                      {interest.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {profile.achievements && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">emoji_events</span>
                  Achievements
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{profile.achievements}</p>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">verified</span>
                  Certifications
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{profile.certifications}</p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Academic Info */}
            {(profile.university || profile.major || profile.yearOfStudy) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">school</span>
                  Academic Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.university && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">University</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.university}</p>
                    </div>
                  )}
                  {profile.major && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Major</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.major}</p>
                    </div>
                  )}
                  {profile.yearOfStudy && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Year of Study</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.yearOfStudy}</p>
                    </div>
                  )}
                  {profile.clubsSocieties && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Clubs & Societies</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.clubsSocieties}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Professional Info (Alumni/Professional) */}
            {(profile.currentEmployer || profile.jobTitle || profile.companyName || profile.workExperience) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">work</span>
                  Professional Experience
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {(profile.currentEmployer || profile.companyName) && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Company</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.currentEmployer || profile.companyName}</p>
                    </div>
                  )}
                  {profile.jobTitle && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Position</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.jobTitle}</p>
                    </div>
                  )}
                  {profile.industry && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Industry</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.industry}</p>
                    </div>
                  )}
                  {profile.yearsExperience && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Experience</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.yearsExperience} years</p>
                    </div>
                  )}
                </div>
                {profile.workExperience && (
                  <div className="space-y-1 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Details</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{profile.workExperience}</p>
                  </div>
                )}
              </div>
            )}

            {/* Education */}
            {profile.education && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">school</span>
                  Education
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{profile.education}</p>
              </div>
            )}

            {/* Mentorship Info */}
            {profile.isMentor && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 shadow-lg border border-yellow-100 dark:border-yellow-800 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">diversity_3</span>
                  Mentorship
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.maxMentees && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Max Mentees</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.maxMentees}</p>
                    </div>
                  )}
                  {profile.availableForMentoring !== undefined && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Availability</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {profile.availableForMentoring ? 'Available' : 'Not Available'}
                      </p>
                    </div>
                  )}
                  {profile.mentorApplicationData?.credentials && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Credentials</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{profile.mentorApplicationData.credentials}</p>
                    </div>
                  )}
                  {profile.mentorApplicationData?.experience && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Experience</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{profile.mentorApplicationData.experience}</p>
                    </div>
                  )}
                  {profile.mentorApplicationData?.expertise && profile.mentorApplicationData.expertise.length > 0 && (
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Areas of Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.mentorApplicationData.expertise.map((exp: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold">
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.mentorApplicationData?.availability && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Availability</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.mentorApplicationData.availability}</p>
                    </div>
                  )}
                  {profile.mentorApplicationData?.linkedIn && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">LinkedIn</p>
                      <a href={profile.mentorApplicationData.linkedIn} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        View Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mentor Application Status (if pending) */}
            {profile.mentorApplicationStatus === 'pending' && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 shadow-lg border border-blue-100 dark:border-blue-800 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">pending</span>
                  Mentor Application Pending
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This user has applied to become a mentor. The application is currently under review by the admin team.
                </p>
                {profile.mentorApplicationData?.appliedAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Applied: {new Date(profile.mentorApplicationData.appliedAt.seconds * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* International Student Info */}
            {(profile.homeCountry || profile.visaStatus) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">public</span>
                  International Student Info
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.homeCountry && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Home Country</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.homeCountry}</p>
                    </div>
                  )}
                  {profile.visaStatus && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Visa Status</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.visaStatus}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">File Complaint</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Report issues with mentorship sessions or user behavior. Admin will review your complaint.
            </p>
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none focus:border-blue-500 min-h-[120px]"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowComplaintModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleFileComplaint}
                disabled={!complaintText.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {isBlocked ? 'Unblock User' : 'Block User'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isBlocked
                ? 'This user will be able to contact you and book sessions again.'
                : 'This user will not be able to contact you or book sessions. Use this for users who repeatedly miss sessions or violate policies.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUser}
                className={`flex-1 px-4 py-3 ${isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl font-bold`}
              >
                {isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
