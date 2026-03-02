import { createUserProfile } from '../services/userService';
import { Role } from '../types';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../src/firebase';

const roles: { id: Role, title: string, desc: string, img: string }[] = [
  { 
    id: 'Student', 
    title: 'Student', 
    desc: 'Currently enrolled in an educational institution.',
    img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student&backgroundColor=b6e3f4'
  },
  { 
    id: 'Professional', 
    title: 'Working Professional', 
    desc: 'Experienced professional offering mentorship and guidance.',
    img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=professional&backgroundColor=ffdfbf'
  }
];

const offerTags = ['Life Skills', 'Career Advice', 'Study Tips', 'Language Exchange', 'Local Events'];
const seekingTags = ['Industry Trends', 'Resume Review', 'DEI Advocacy', 'Research Collab', 'Cultural Guidance'];

const Signup: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [selectedOffer, setSelectedOffer] = useState<string[]>([]);
  const [selectedSeeking, setSelectedSeeking] = useState<string[]>([]);
  const [customOffer, setCustomOffer] = useState('');
  const [customSeeking, setCustomSeeking] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  // Student-specific fields
  const [school, setSchool] = useState('');
  const [programName, setProgramName] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  // Professional-specific fields
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 3) setStep(s => s + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }
    if (selectedRole === 'Student') {
      if (!school.trim()) {
        setError('School is required for students');
        return;
      }
    }
    if (selectedRole === 'Professional') {
      if (!companyName.trim() || !jobTitle.trim()) {
        setError('Company name and job title are required for professionals');
        return;
      }
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      const userName = `${firstName.trim()} ${lastName.trim()}`;
      
      // Save user profile to Firestore
      await createUserProfile(
        user.uid,
        user.email || email,
        selectedRole as Role,
        selectedOffer,
        selectedSeeking,
        userName,
        phoneNumber.trim() || undefined,
        selectedRole === 'Student' ? school.trim() : undefined,
        false,
        selectedRole === 'Professional' ? {
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          industry: jobTitle.trim(),
          yearsExperience: 0,
        } : undefined
      );
      
      localStorage.setItem('unity_onboarding_complete', 'true');
      localStorage.setItem('unity_user_name', userName);
      localStorage.setItem('unity_user_role', selectedRole);
      
      // Show verification message
      alert('Account created! Please check your email to verify your account before logging in.');
      
      // All users go to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err?.message ?? 'Sign-up failed');
      setIsLoading(false);
    }
  };

  // Show loading overlay during signup
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="size-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-gray-600 dark:text-gray-400">Creating your account...</p>
        </div>
      </div>
    );
  }

  const toggleTag = (tag: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="flex items-center justify-center min-h-screen py-8 relative z-10">
      <div className="max-w-4xl w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-800 w-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-700 shadow-lg" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 md:p-12 lg:p-16 space-y-6 sm:space-y-8 md:space-y-12">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-2">
                  <span className="material-symbols-outlined text-white text-3xl">person_add</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Choose your role</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Join our community in the capacity that fits your journey</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`group relative text-left rounded-2xl border-2 transition-all p-6 ${
                      selectedRole === r.id 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-xl' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition ${
                        selectedRole === r.id 
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <span className={`material-symbols-outlined text-3xl ${
                          selectedRole === r.id ? 'text-white' : 'text-gray-400'
                        }`}>{r.id === 'Student' ? 'school' : 'work'}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-lg mb-1 dark:text-white">{r.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{r.desc}</p>
                      </div>
                      {selectedRole === r.id && (
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-1.5 rounded-full">
                          <span className="material-symbols-outlined text-lg">check</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-2">
                  <span className="material-symbols-outlined text-white text-3xl">tune</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Tailor your experience</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">This helps us match you with the right peers and mentors</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 md:gap-12">
                <div className="space-y-4">
                  <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 dark:text-white">
                    <span className="material-symbols-outlined text-green-500 text-base sm:text-lg">volunteer_activism</span>
                    I can offer
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {offerTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag, selectedOffer, setSelectedOffer)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          selectedOffer.includes(tag) 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white shadow-lg' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customOffer}
                      onChange={(e) => setCustomOffer(e.target.value)}
                      placeholder="Add custom skill..."
                      className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 outline-none dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customOffer.trim()) {
                          setSelectedOffer(prev => [...prev, customOffer.trim()]);
                          setCustomOffer('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (customOffer.trim()) {
                          setSelectedOffer(prev => [...prev, customOffer.trim()]);
                          setCustomOffer('');
                        }
                      }}
                      className="bg-primary dark:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 dark:hover:bg-blue-700 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs sm:text-sm font-black flex items-center gap-2 dark:text-white">
                    <span className="material-symbols-outlined text-amber-500 text-base sm:text-lg">settings_suggest</span>
                    I am seeking
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {seekingTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag, selectedSeeking, setSelectedSeeking)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          selectedSeeking.includes(tag) 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white shadow-lg' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSeeking}
                      onChange={(e) => setCustomSeeking(e.target.value)}
                      placeholder="Add custom need..."
                      className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-500/20 outline-none dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customSeeking.trim()) {
                          setSelectedSeeking(prev => [...prev, customSeeking.trim()]);
                          setCustomSeeking('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (customSeeking.trim()) {
                          setSelectedSeeking(prev => [...prev, customSeeking.trim()]);
                          setCustomSeeking('');
                        }
                      }}
                      className="bg-primary dark:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 dark:hover:bg-blue-700 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 max-w-lg mx-auto">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-2">
                  <span className="material-symbols-outlined text-white text-3xl">badge</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Final Step</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Complete your profile to begin</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">First Name *</label>
                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Last Name *</label>
                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                  <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="+1 (555) 123-4567" />
                </div>
                {selectedRole === 'Student' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">School *</label>
                      <input type="text" required value={school} onChange={(e) => setSchool(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="Your school" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Program Name</label>
                      <input type="text" value={programName} onChange={(e) => setProgramName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="e.g. Computer Science" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Current Year</label>
                      <input type="text" value={currentYear} onChange={(e) => setCurrentYear(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="e.g. 2nd Year" />
                    </div>
                  </>
                )}
                {selectedRole === 'Professional' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Company Name *</label>
                      <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="Your company" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Job Title *</label>
                      <input type="text" required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="Your position" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Choose Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none pr-10 dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-blue-400"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none pr-10 dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-blue-400"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>
                {error && <div className="text-sm text-red-600 text-center font-bold">{error}</div>}
                <div className="flex items-start gap-2 sm:gap-3 px-1 pt-2">
                   <input type="checkbox" className="rounded-md border-gray-200 text-primary focus:ring-primary mt-0.5" />
                   <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 leading-snug">I agree to the <Link to="#" className="text-primary hover:underline">Terms of Service</Link> and <Link to="#" className="text-primary hover:underline">Community Guidelines</Link>.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 sm:pt-8 md:pt-12">
            <button 
              onClick={() => step === 1 ? navigate('/login') : setStep(s => s - 1)} 
              className="w-full sm:w-auto px-6 sm:px-8 py-3 text-xs sm:text-sm font-black text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors uppercase tracking-widest"
            >
              {step === 1 ? 'Log In' : 'Previous'}
            </button>
            <button 
              onClick={handleNext}
              disabled={(step === 1 && !selectedRole) || (step === 3 && isLoading)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-12 py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  {step === 3 ? 'Get Started' : 'Next Step'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Signup;
