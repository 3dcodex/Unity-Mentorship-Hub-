
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMentorshipMatches } from '../services/geminiService';
import { db } from '../src/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../App';

const MentorMatching: React.FC = () => {
  const [step, setStep] = useState<'selection' | 'loading' | 'results'>('selection');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [realMentors, setRealMentors] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const interests = [
    'Academic Excellence', 'Career Transition', 'Mental Health', 
    'First-Gen Experience', 'STEM Careers', 'Entrepreneurship',
    'Cultural Exchange', 'Leadership Skills', 'Social Inclusion'
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleMatch = async () => {
    setStep('loading');
    // Store selected focus areas in Firestore
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        seekingTags: selectedInterests,
        updatedAt: new Date()
      });
    }
    
    // Fetch mentors with intelligent matching
    try {
      const { query, where, or } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), where('isMentor', '==', true));
      const snapshot = await getDocs(q);
      let mentors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter and score mentors based on selected interests
      const scoredMentors = mentors.map(mentor => {
        let score = 0;
        const mentorData = {
          expertise: (mentor.mentorExpertise || '').toLowerCase(),
          bio: (mentor.mentorBio || mentor.bio || '').toLowerCase(),
          interests: (mentor.interests || []).map((i: string) => i.toLowerCase()),
          skills: (mentor.skills || []).map((s: string) => s.toLowerCase()),
          tags: (mentor.mentorTags || []).map((t: string) => t.toLowerCase())
        };
        
        // Score based on selected interests
        selectedInterests.forEach(interest => {
          const interestLower = interest.toLowerCase();
          
          // Direct expertise match (highest score)
          if (mentorData.expertise.includes(interestLower)) score += 10;
          
          // Bio/description match
          if (mentorData.bio.includes(interestLower)) score += 5;
          
          // Interest array match
          if (mentorData.interests.some(i => i.includes(interestLower) || interestLower.includes(i))) score += 8;
          
          // Skills match
          if (mentorData.skills.some(s => s.includes(interestLower) || interestLower.includes(s))) score += 6;
          
          // Tags match
          if (mentorData.tags.some(t => t.includes(interestLower) || interestLower.includes(t))) score += 7;
          
          // Keyword matching for common terms
          const keywords = {
            'academic excellence': ['academic', 'education', 'study', 'research', 'university'],
            'career transition': ['career', 'transition', 'job', 'professional', 'industry'],
            'mental health': ['mental', 'health', 'wellness', 'stress', 'balance'],
            'first-gen experience': ['first-gen', 'first generation', 'family', 'support'],
            'stem careers': ['stem', 'technology', 'engineering', 'science', 'math', 'tech'],
            'entrepreneurship': ['entrepreneur', 'startup', 'business', 'founder', 'innovation'],
            'cultural exchange': ['cultural', 'diversity', 'international', 'global'],
            'leadership skills': ['leadership', 'management', 'team', 'lead', 'director'],
            'social inclusion': ['inclusion', 'diversity', 'equity', 'community']
          };
          
          const relatedKeywords = keywords[interestLower as keyof typeof keywords] || [];
          relatedKeywords.forEach(keyword => {
            if (mentorData.expertise.includes(keyword) || mentorData.bio.includes(keyword)) {
              score += 3;
            }
          });
        });
        
        return { ...mentor, matchScore: score };
      });
      
      // Sort by score (highest first) and take top matches
      const sortedMentors = scoredMentors
        .filter(mentor => mentor.matchScore > 0) // Only show mentors with some relevance
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 12); // Limit to top 12 matches
      
      // If no good matches, show all active mentors
      const finalMentors = sortedMentors.length > 0 ? sortedMentors : mentors.slice(0, 12);
      
      setRealMentors(finalMentors);
      
      // Try to get AI suggestions as additional context
      try {
        const result = await getMentorshipMatches({ interests: selectedInterests });
        setMatches(result.suggestions || []);
      } catch (e) {
        console.log('AI matching unavailable, using algorithmic matching');
      }
      
      setTimeout(() => setStep('results'), 2000);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setTimeout(() => setStep('results'), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Find Your Perfect Match</h1>
        <p className="text-gray-500 font-medium">Our AI-powered algorithm analyzes your goals to connect you with the right mentor.</p>
      </div>

      {step === 'selection' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 border border-gray-100 shadow-xl space-y-6 sm:space-y-8 md:space-y-10">
          <div className="space-y-6">
            <h2 className="text-base sm:text-base sm:text-lg md:text-xl font-black">What are your primary focus areas?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {interests.map(interest => (
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
            <p className="text-gray-500 font-medium mt-2">Matching your interests with 500+ active mentors.</p>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">Available Mentors</h2>
          {realMentors.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xl text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">person_search</span>
              <p className="text-gray-500 font-medium">No mentors available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {realMentors.map((mentor, i) => (
                <div key={mentor.id} className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-100 shadow-lg flex flex-col space-y-4 hover:-translate-y-2 transition-transform">
                  <div className="flex items-start justify-between">
                    <div className="size-16 rounded-full overflow-hidden bg-gray-100 border-2 border-primary/20">
                      <img src={mentor.photoURL || 'https://i.pravatar.cc/100'} alt={mentor.displayName} className="w-full h-full object-cover" />
                    </div>
                    {mentor.matchScore > 0 && (
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                        {Math.round((mentor.matchScore / 10) * 100)}% Match
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">{mentor.displayName || mentor.name || 'Mentor'}</h3>
                    <p className="text-xs font-bold text-primary mt-1">{mentor.mentorExpertise || mentor.role || 'Expert Mentor'}</p>
                    {mentor.mentorTags && mentor.mentorTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mentor.mentorTags.slice(0, 3).map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium flex-1">{mentor.mentorBio || mentor.bio || 'Experienced mentor ready to help you succeed.'}</p>
                  <button 
                    onClick={() => navigate(`/mentorship/book?mentor=${mentor.id}`)}
                    className="w-full py-3 bg-gray-50 text-primary font-bold rounded-xl text-sm hover:bg-primary hover:text-white transition-all"
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
