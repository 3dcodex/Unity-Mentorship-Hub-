
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../src/firebase';
import { collection, getDocs, doc, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '../App';
import { errorService } from '../services/errorService';
import { UserProfile } from '../types';
import { FOCUS_AREA_LABELS, scoreMentorAgainstFocusAreas } from '../utils/mentorMatching';
import { CURRENT_MENTOR_APPLICATION_VERSION } from '../utils/mentorMatching';

interface MentorMatchResult extends Partial<UserProfile> {
  id: string;
  matchScore: number;
  matchedFocusAreas: string[];
  matchReasons: string[];
  matchStrength: 'strong' | 'good' | 'potential';
}

const MentorMatching: React.FC = () => {
  const [step, setStep] = useState<'selection' | 'loading' | 'results'>('selection');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [matchedMentors, setMatchedMentors] = useState<MentorMatchResult[]>([]);
  const [fallbackMentors, setFallbackMentors] = useState<MentorMatchResult[]>([]);
  const [approvedMentorCount, setApprovedMentorCount] = useState(0);
  const [matchMessage, setMatchMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const getMatchLabel = (strength: MentorMatchResult['matchStrength']) => {
    if (strength === 'strong') return 'Strong match';
    if (strength === 'good') return 'Good fit';
    return 'Potential fit';
  };

  const summarizeMentorBio = (mentor: MentorMatchResult, maxLength = 140) => {
    const rawText = (mentor.mentorBio || mentor.bio || 'Experienced mentor ready to help you succeed.').trim();
    const cleanText = rawText.replace(/\s+/g, ' ');

    if (cleanText.length <= maxLength) {
      return cleanText;
    }

    const truncated = cleanText.slice(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    const safeSlice = lastSpaceIndex > 0 ? truncated.slice(0, lastSpaceIndex) : truncated;
    return `${safeSlice}...`;
  };

  const handleMatch = async () => {
    setStep('loading');
    setMatchMessage('');

    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          seekingTags: selectedInterests,
          updatedAt: Timestamp.now()
        }).catch(() => {});
      }

      const q = query(
        collection(db, 'users'),
        where('mentorStatus', '==', 'approved'),
        where('mentorApplicationVersion', '==', CURRENT_MENTOR_APPLICATION_VERSION)
      );
      const snapshot = await getDocs(q);
      const mentors = snapshot.docs
        .map(mentorDoc => ({ id: mentorDoc.id, ...mentorDoc.data() } as MentorMatchResult))
        .filter(mentor => mentor.isMentor);

      setApprovedMentorCount(mentors.length);

      const scoredMentors = mentors
        .map(mentor => ({
          ...mentor,
          ...scoreMentorAgainstFocusAreas(mentor, selectedInterests),
        }))
        .filter(mentor => mentor.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 12);

      setMatchedMentors(scoredMentors);

      if (scoredMentors.length === 0) {
        setFallbackMentors(mentors.slice(0, 6).map(mentor => ({
          ...mentor,
          matchScore: 0,
          matchedFocusAreas: [],
          matchReasons: ['Approved mentor profile available for broader exploration'],
          matchStrength: 'potential',
        })));
        setMatchMessage('No direct matches found yet. Browse approved mentors while more mentor profiles are enriched.');
      } else {
        setFallbackMentors([]);
      }

      setStep('results');
    } catch (err) {
      errorService.handleError(err, 'Error fetching mentors');
      setMatchedMentors([]);
      setFallbackMentors([]);
      setMatchMessage('Unable to load mentor matches right now. Please try again.');
      setStep('results');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Find Your Perfect Match</h1>
        <p className="text-gray-500 font-medium">Match with approved mentors based on structured focus areas, expertise, and profile quality.</p>
      </div>

      {step === 'selection' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 border border-gray-100 shadow-xl space-y-6 sm:space-y-8 md:space-y-10">
          <div className="space-y-6">
            <h2 className="text-base sm:text-base sm:text-lg md:text-xl font-black">What are your primary focus areas?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FOCUS_AREA_LABELS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                    selectedInterests.includes(interest) 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          <button 
            disabled={selectedInterests.length === 0}
            onClick={handleMatch}
            className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            Find My Matches
          </button>
        </div>
      )}

      {step === 'loading' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] p-24 border border-gray-100 shadow-xl flex flex-col items-center justify-center space-y-4 sm:space-y-6 md:space-y-8">
          <div className="size-20 relative">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div className="text-center">
            <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">AI is Analyzing...</h2>
            <p className="text-gray-500 font-medium mt-2">Scoring your focus areas against approved mentor profiles.</p>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">Approved Mentor Matches</h2>
            <p className="text-sm text-gray-500 font-medium">{approvedMentorCount} approved mentors evaluated against your selected focus areas.</p>
            {matchMessage && <p className="text-sm text-amber-600 font-medium">{matchMessage}</p>}
          </div>
          {matchedMentors.length === 0 && fallbackMentors.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xl text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">person_search</span>
              <p className="text-gray-500 font-medium">No approved mentors are available right now. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {(matchedMentors.length > 0 ? matchedMentors : fallbackMentors).map(mentor => (
                <div key={mentor.id} className="rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 bg-gray-50 transition-all hover:scale-105 flex flex-col space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="size-12 sm:size-14 rounded-full overflow-hidden bg-gray-100 border-2 border-primary/20 flex-shrink-0">
                      <img src={mentor.photoURL || 'https://i.pravatar.cc/100'} alt={mentor.displayName} className="w-full h-full object-cover" />
                    </div>
                    {mentor.matchScore > 0 ? (
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        {getMatchLabel(mentor.matchStrength)}
                      </div>
                    ) : (
                      <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold">
                        Approved mentor
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight">{mentor.displayName || mentor.name || 'Mentor'}</h3>
                    <p className="text-xs text-gray-600 mt-1 font-medium">{mentor.mentorExpertise || mentor.role || 'Expert Mentor'}</p>
                    {mentor.matchedFocusAreas.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mentor.matchedFocusAreas.slice(0, 3).map(area => (
                          <span key={area} className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    ) : mentor.mentorTags && mentor.mentorTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mentor.mentorTags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed min-h-[64px]">
                    {summarizeMentorBio(mentor)}
                  </p>
                  {mentor.matchReasons.length > 0 && (
                    <div
                      className="rounded-lg sm:rounded-xl bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-medium text-slate-600 min-h-[56px] border border-gray-200"
                      style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {mentor.matchReasons[0]}
                    </div>
                  )}
                  <button 
                    onClick={() => navigate(`/mentorship/book?mentor=${mentor.id}`)}
                    className="w-full px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all"
                  >
                    Book This Mentor
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-center pt-8">
            <button 
              onClick={() => setStep('selection')}
              className="text-gray-400 font-bold hover:text-primary transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">refresh</span>
              Try different interests
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorMatching;
