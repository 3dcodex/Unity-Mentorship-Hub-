
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMentorshipMatches } from '../services/geminiService';

const MentorMatching: React.FC = () => {
  const [step, setStep] = useState<'selection' | 'loading' | 'results'>('selection');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const navigate = useNavigate();

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
    // Simulate AI thinking and calling Gemini service
    try {
      const result = await getMentorshipMatches({ interests: selectedInterests });
      setMatches(result.suggestions || []);
      // Minimum delay for dramatic effect
      setTimeout(() => setStep('results'), 2000);
    } catch (e) {
      // Fallback
      setMatches([
        { mentorType: 'Alumni Professional', reason: 'Matches your career transition focus.' },
        { mentorType: 'Senior Peer Mentor', reason: 'Matches your academic excellence goals.' },
        { mentorType: 'Inclusion Lead', reason: 'Aligned with your social inclusion interests.' }
      ]);
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
          <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">Recommended Pathways</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matches.map((match, i) => (
              <div key={i} className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-gray-100 shadow-lg flex flex-col space-y-4 hover:-translate-y-2 transition-transform">
                <div className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">{match.mentorType}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium flex-1">{match.reason}</p>
                <button 
                  onClick={() => navigate('/mentorship/book')}
                  className="w-full py-3 bg-gray-50 text-primary font-bold rounded-xl text-sm hover:bg-primary hover:text-white transition-all"
                >
                  Explore Mentors
                </button>
              </div>
            ))}
          </div>
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
