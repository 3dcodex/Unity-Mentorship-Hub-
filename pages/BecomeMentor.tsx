import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../src/firebase';

const BecomeMentor: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    expertise: [] as string[],
    credentials: '',
    experience: '',
    bio: '',
    linkedIn: '',
    availability: ''
  });
  const [expertiseInput, setExpertiseInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && formData.expertise.length < 5) {
      setFormData({ ...formData, expertise: [...formData.expertise, expertiseInput.trim()] });
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (index: number) => {
    setFormData({ ...formData, expertise: formData.expertise.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const applicationData = {
        userId: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'Unknown',
        email: auth.currentUser.email,
        ...formData,
        status: 'pending',
        appliedAt: new Date(),
        documents: []
      };

      // Store application
      await addDoc(collection(db, 'mentorApplications'), applicationData);

      // Update user document with application data and status
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        mentorApplicationStatus: 'pending',
        mentorApplicationData: {
          expertise: formData.expertise,
          credentials: formData.credentials,
          experience: formData.experience,
          bio: formData.bio,
          linkedIn: formData.linkedIn,
          availability: formData.availability,
          appliedAt: new Date()
        }
      });

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-12 text-center max-w-md shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-5xl">check_circle</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your mentor application has been submitted successfully. Our admin team will review it and get back to you soon.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-4xl">school</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Become a Mentor</h1>
            <p className="text-gray-600">Share your expertise and help students succeed</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Areas of Expertise</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
                  placeholder="e.g., Software Engineering, Data Science"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={handleAddExpertise}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.expertise.map((exp, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
                    {exp}
                    <button type="button" onClick={() => handleRemoveExpertise(idx)} className="hover:text-green-900">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Credentials & Education</label>
              <textarea
                required
                value={formData.credentials}
                onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                placeholder="Your degrees, certifications, and qualifications..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Professional Experience</label>
              <textarea
                required
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="Your work experience and achievements..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
              <textarea
                required
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself and why you want to be a mentor..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">LinkedIn Profile (Optional)</label>
              <input
                type="url"
                value={formData.linkedIn}
                onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Availability</label>
              <select
                required
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-green-500"
              >
                <option value="">Select your availability</option>
                <option value="1-2 hours/week">1-2 hours per week</option>
                <option value="3-5 hours/week">3-5 hours per week</option>
                <option value="5+ hours/week">5+ hours per week</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.expertise.length === 0}
                className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeMentor;
