import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../src/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../App';
import BookingModal from '../components/BookingModal';

const ProfileView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
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
      
      // Create connection first
      await setDoc(doc(db, 'connections', chatRoomId), {
        participants: [user.uid, userId],
        createdBy: user.uid,
        createdAt: new Date(),
        lastMessage: null,
        lastMessageTime: null,
        type: 'mentorship'
      }, { merge: true });
      
      // Create conversation
      await setDoc(doc(db, 'conversations', chatRoomId), {
        participants: [user.uid, userId],
        createdAt: new Date(),
        lastMessage: '',
        lastMessageTime: null,
        isActive: true
      }, { merge: true });
      
      navigate(`/quick-chat?room=${chatRoomId}`);
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert('Failed to create chat room');
    }
  };

  const handleScheduleSession = () => {
    setShowBookingModal(true);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 py-8 px-4 relative overflow-hidden">
      {/* Modern Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 font-bold transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>

        {/* Modern Header Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/30 dark:border-slate-700/30 overflow-hidden">
          {/* Dynamic Cover with Mesh Gradient */}
          <div className="h-56 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          
          {/* Enhanced Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end -mt-24">
              {/* Enhanced Profile Photo */}
              <div className="relative group">
                {photoURL ? (
                  <div className="relative">
                    <img
                      src={photoURL}
                      alt={displayName}
                      className="size-48 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ) : (
                  <div className="size-48 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 border-4 border-white dark:border-slate-900 shadow-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z\"/%3E%3C/g%3E%3C/svg%3E')"}}></div>
                    <span className="text-7xl font-black text-white relative z-10">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {profile.isMentor && (
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 size-16 rounded-2xl flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl animate-bounce">
                    <span className="material-symbols-outlined text-white text-2xl">workspace_premium</span>
                  </div>
                )}
              </div>

              {/* Enhanced Name and Role */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">{displayName}</h1>
                  {profile.isMentor && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-black rounded-full uppercase tracking-wider shadow-lg animate-pulse">
                      <span className="material-symbols-outlined text-lg">star</span>
                      Verified Mentor
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6 flex-wrap text-sm">
                  {profile.role && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-bold">
                      <span className="material-symbols-outlined text-lg">school</span>
                      <span>{profile.role}</span>
                    </div>
                  )}
                  {profile.university && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full font-bold">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                      <span>{profile.university}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full font-bold">
                      <span className="material-symbols-outlined text-lg">place</span>
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              {!isOwnProfile && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (!user || !userId) return;
                      const chatRoomId = [user.uid, userId].sort().join('_');
                      // Create connection and navigate
                      setDoc(doc(db, 'connections', chatRoomId), {
                        participants: [user.uid, userId],
                        createdBy: user.uid,
                        createdAt: new Date(),
                        lastMessage: null,
                        lastMessageTime: null
                      }, { merge: true }).then(() => {
                        navigate(`/quick-chat`);
                      }).catch(err => {
                        console.error('Error creating connection:', err);
                        navigate(`/quick-chat`);
                      });
                    }}
                    className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined group-hover:animate-pulse">chat</span>
                    Message
                  </button>
                  {(isMentorOrAdmin || profile.isMentor) && (
                    <>
                      <button
                        onClick={handleCreateChatRoom}
                        className="group px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg group-hover:animate-bounce">group_add</span>
                        Chat Room
                      </button>
                      <button
                        onClick={handleScheduleSession}
                        className="group px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg group-hover:animate-pulse">calendar_month</span>
                        Schedule
                      </button>
                      {/* More Actions Dropdown */}
                      <div className="relative group">
                        <button className="px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => setShowComplaintModal(true)}
                            className="w-full px-4 py-3 text-left text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-t-2xl flex items-center gap-2 font-bold"
                          >
                            <span className="material-symbols-outlined text-lg">report</span>
                            Report Issue
                          </button>
                          <button
                            onClick={() => setShowBlockModal(true)}
                            className={`w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-bold ${isBlocked ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                          >
                            <span className="material-symbols-outlined text-lg">{isBlocked ? 'check_circle' : 'block'}</span>
                            {isBlocked ? 'Unblock User' : 'Block User'}
                          </button>
                          <button
                            onClick={handleRequestBilling}
                            className="w-full px-4 py-3 text-left text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-b-2xl flex items-center gap-2 font-bold"
                          >
                            <span className="material-symbols-outlined text-lg">payments</span>
                            Billing
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Enhanced */}
          <div className="lg:col-span-1 space-y-6">
            {/* About Card - Enhanced */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/30 space-y-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
                </div>
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

            {/* Contact Info - Enhanced */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/30 space-y-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">contact_mail</span>
                </div>
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

            {/* Skills/Expertise - Enhanced */}
            {(profile.skills || profile.mentorExpertise || profile.expertise) && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/30 dark:border-slate-700/30 space-y-4">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">stars</span>
                  </div>
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
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-slate-700/50 space-y-4">
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

          {/* Main Content - Enhanced */}
          <div className="lg:col-span-3 space-y-6">
            {/* Academic Info */}
            {(profile.university || profile.major || profile.yearOfStudy) && (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-slate-700/50 space-y-4">
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
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-yellow-200/50 dark:border-yellow-800/50 space-y-4">
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

      {/* Booking Modal */}
      {showBookingModal && profile && (
        <BookingModal
          mentor={{
            id: profile.id,
            displayName: profile.displayName || profile.name,
            name: profile.name,
            photoURL: profile.photoURL,
            mentorExpertise: profile.mentorExpertise || profile.role,
            role: profile.role,
            email: profile.email,
          }}
          onClose={() => setShowBookingModal(false)}
        />
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
