import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { db } from '../src/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

const BecomeMentor: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [darkMode] = useState(localStorage.getItem('unity_dark_mode') === 'true');
  
  const [formData, setFormData] = useState({
    expertise: '',
    bio: '',
    yearsExperience: 0,
    availability: '',
    maxMentees: 3,
    preferredTopics: '',
    linkedIn: '',
    motivation: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        isMentor: true,
        mentorExpertise: formData.expertise,
        mentorBio: formData.bio,
        mentorYearsExperience: formData.yearsExperience,
        mentorAvailability: formData.availability,
        mentorMaxMentees: formData.maxMentees,
        mentorPreferredTopics: formData.preferredTopics,
        mentorLinkedIn: formData.linkedIn,
        mentorMotivation: formData.motivation,
        mentorApplicationDate: Timestamp.now(),
        mentorStatus: 'pending',
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      setSuccess(true);
      setTimeout(() => navigate('/profile-settings'), 2000);
    } catch (err) {
      console.error('Error submitting mentor application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-12">
          <div className="inline-block p-4 bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl shadow-2xl">
            <span className="material-symbols-outlined text-white text-6xl">school</span>
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
            Become a Mentor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Share your knowledge and experience to help students succeed. Join our community of mentors making a real impact.
          </p>
        </div>

        {success && (
          <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-2xl flex items-center gap-4">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl">check_circle</span>
            <div>
              <h3 className="font-black text-green-900 dark:text-green-100 text-lg">Application Submitted!</h3>
              <p className="text-green-700 dark:text-green-300">Redirecting you back to settings...</p>
            </div>
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className={`${darkMode ? 'dark bg-slate-900/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-3xl p-8 border shadow-2xl space-y-8`}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block font-black text-sm text-gray-700 dark:text-gray-300 mb-2">
                Areas of Expertise *
              </label>
              <input
                type="text"
                required
                value={formData.expertise}
                onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                placeholder="e.g., Computer Science, Career Guidance, Data Science"
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-black text-sm text-gray-700 dark:text-gray-300 mb-2">
                Mentor Bio *
              </label>
              <textarea
                required
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell students about yourself and how you can help them..."
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
              />
            </div>

            <div>
              <label className="block font-black text-sm text-gray-700 dark:text-gray-300 mb-2">
                Years of Experience *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.yearsExperience}
                onChange={(e) => setFormData({...formData, yearsExperience: Number(e.target.value)})}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-black text-sm text-gray-700 dark:text-gray-300 mb-2">
                Max Mentees
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.maxMentees}
                onChange={(e) => setFormData({...formData, maxMentees: Number(e.target.value)})}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-black text-sm text-gray-700 dark:text-gray-300 mb-2">
                Availability *
              </label>
              <input
                type="text"
                required
                value={formData.availability}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                placeholder="e.g., Weekdays 6-9 PM EST, Weekends"
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-black text-sm text-gray-700 dark:text-gray-300 mb-2">
                Preferred Topics
              </label>
              <input
                type="text"
                value={formData.preferredTopics}
                onChange={(e) => setFormData({...formData, preferredTopics: e.target.value})}
                placeholder="e.g., Resume Review, Interview Prep, Career Planning"
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-black text-sm text-gray-700 dark:text-gray-300 mb-2">
                LinkedIn Profile
              </label>
              <input
                type="url"
                value={formData.linkedIn}
                onChange={(e) => setFormData({...formData, linkedIn: e.target.value})}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-black text-sm text-gray-700 dark:text-gray-300 mb-2">
                Why do you want to become a mentor? *
              </label>
              <textarea
                required
                value={formData.motivation}
                onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                placeholder="Share your motivation for mentoring students..."
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => navigate('/profile-settings')}
              className="flex-1 px-6 py-4 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-bold hover:scale-105 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-bold shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>

        {/* Benefits Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className={`${darkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-2xl p-6 border shadow-xl text-center`}>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">diversity_3</span>
            </div>
            <h3 className="font-black text-lg mb-2 dark:text-white">Make an Impact</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Help students achieve their goals and build meaningful connections</p>
          </div>

          <div className={`${darkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-2xl p-6 border shadow-xl text-center`}>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">workspace_premium</span>
            </div>
            <h3 className="font-black text-lg mb-2 dark:text-white">Earn Recognition</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get verified mentor badge and build your professional brand</p>
          </div>

          <div className={`${darkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-2xl p-6 border shadow-xl text-center`}>
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-3xl">trending_up</span>
            </div>
            <h3 className="font-black text-lg mb-2 dark:text-white">Grow Your Network</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect with talented students and fellow mentors</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeMentor;
