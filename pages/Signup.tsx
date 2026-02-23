import { createUserProfile } from '../services/userService';
import { Role } from '../types';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebase';

const roles: { id: Role, title: string, desc: string, img: string }[] = [
  { 
    id: 'International Student', 
    title: 'International Student', 
    desc: 'Seeking cultural and academic support in a new environment.',
    img: "/src/1741580433phpAkAF6s.jpeg"
  },
  { 
    id: 'Domestic Student', 
    title: 'Domestic Student', 
    desc: 'Building local connections and community roots.',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'Alumni', 
    title: 'Alumni', 
    desc: 'Sharing post-grad wisdom and career guidance.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'Professional', 
    title: 'Professional', 
    desc: 'Offering specialized industry mentorship and networking.',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [university, setUniversity] = useState('');
  // Professional-specific fields
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 3) setStep(s => s + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    setError(null);
    if (!userName.trim()) {
      setError('Username is required');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!university.trim()) {
      setError('University is required');
      return;
    }
    if (selectedRole === 'Professional') {
      if (!companyName.trim() || !jobTitle.trim() || !industry.trim()) {
        setError('All professional fields are required');
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
      
      // Professional role is always a mentor
      const isMentor = selectedRole === 'Professional';
      
      // Save user profile to Firestore
      await createUserProfile(
        user.uid,
        user.email || email,
        selectedRole as Role,
        selectedOffer,
        selectedSeeking,
        userName.trim(),
        phoneNumber.trim(),
        university.trim(),
        isMentor,
        selectedRole === 'Professional' ? {
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          industry: industry.trim(),
          yearsExperience
        } : undefined
      );
      
      localStorage.setItem('unity_onboarding_complete', 'true');
      localStorage.setItem('unity_user_name', userName.trim());
      localStorage.setItem('unity_user_role', selectedRole);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err?.message ?? 'Sign-up failed');
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 p-4 sm:p-6">
      <PublicHeader />
      <div className="flex items-center justify-center flex-1">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl md:rounded-[40px] shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-700 w-full overflow-hidden">
          <div 
            className="h-full bg-primary dark:bg-blue-600 transition-all duration-700" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 md:p-12 lg:p-16 space-y-6 sm:space-y-8 md:space-y-12">
          {step === 1 && (
            <div className="space-y-6 sm:space-y-8 md:space-y-12 animate-in fade-in slide-in-from-right-8">
              <div className="text-center space-y-2 sm:space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Choose your role</h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">Join our community in the capacity that fits your journey.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`group relative text-left rounded-3xl border-2 transition-all p-2 ${
                      selectedRole === r.id ? 'border-primary dark:border-blue-500 bg-primary/5 dark:bg-blue-900/20' : 'border-gray-50 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-slate-700'
                    }`}
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                      <img src={r.img} alt={r.title} className="w-full h-full object-cover" />
                      {selectedRole === r.id && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="bg-primary text-white p-2 rounded-full shadow-lg">
                            <span className="material-symbols-outlined font-black">check</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-4 pb-4">
                      <h4 className="font-black text-sm mb-1 dark:text-white">{r.title}</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 sm:space-y-8 md:space-y-12 animate-in fade-in slide-in-from-right-8">
              <div className="text-center space-y-2 sm:space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">Tailor your experience</h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">This helps us match you with the right peers and mentors.</p>
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
                        className={`px-5 py-2.5 rounded-full text-xs font-bold border-2 transition-all ${
                          selectedOffer.includes(tag) ? 'bg-primary dark:bg-blue-600 border-primary dark:border-blue-600 text-white shadow-lg shadow-primary/10 dark:shadow-blue-600/10' : 'bg-white dark:bg-slate-700 border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
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
                        className={`px-5 py-2.5 rounded-full text-xs font-bold border-2 transition-all ${
                          selectedSeeking.includes(tag) ? 'bg-primary dark:bg-blue-600 border-primary dark:border-blue-600 text-white shadow-lg shadow-primary/10 dark:shadow-blue-600/10' : 'bg-white dark:bg-slate-700 border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 sm:space-y-8 md:space-y-12 animate-in fade-in slide-in-from-right-8 max-w-sm mx-auto">
              <div className="text-center space-y-2 sm:space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white">Final Step</h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">Complete your profile to begin.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Username</label>
                  <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                  <input type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">University</label>
                  <input type="text" required value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="Your university" />
                </div>
                {selectedRole === 'Professional' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Company Name</label>
                      <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="Your company" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Job Title</label>
                      <input type="text" required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="Your position" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Industry</label>
                      <input type="text" required value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="e.g. Technology, Finance" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Years of Experience</label>
                      <input type="number" min="0" required value={yearsExperience} onChange={(e) => setYearsExperience(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="0" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none dark:text-white" placeholder="alex@university.edu" />
                </div>
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
              className="w-full sm:w-auto bg-primary dark:bg-blue-600 text-white font-black px-8 sm:px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 dark:shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
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
      <Footer />
    </div>
  );
};

export default Signup;
