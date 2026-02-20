
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Role } from '../types';
import Footer from '../components/Footer';

const roles: { id: Role, title: string, desc: string, img: string }[] = [
  { 
    id: 'International Student', 
    title: 'International Student', 
    desc: 'Seeking cultural and academic support in a new environment.',
    img: 'https://images.unsplash.com/photo-1523240693567-579c48b01bb0?auto=format&fit=crop&q=80&w=400'
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

const Welcome: React.FC = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role | ''>('Domestic Student');
  const [selectedOffer, setSelectedOffer] = useState<string[]>(['Local Events']);
  const [selectedSeeking, setSelectedSeeking] = useState<string[]>(['Industry Trends']);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 2) setStep(s => s + 1);
    else handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem('unity_onboarding_complete', 'true');
    localStorage.setItem('unity_user_name', 'Alex Johnson');
    localStorage.setItem('unity_user_role', selectedRole);
    navigate('/dashboard');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('unity_onboarding_complete', 'true');
    localStorage.setItem('unity_user_name', 'Returning User');
    navigate('/dashboard');
  };

  const toggleTag = (tag: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sticky Mini Nav */}
      <nav className="h-12 sm:h-16 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-7">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=200" 
              alt="Unity logo" 
              className="h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 80'%3E%3Crect fill='%231392ec' width='200' height='80'/%3E%3Ctext x='50%25' y='50%25' font-size='32' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3EUNITY%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-sm font-black tracking-tighter text-[#001f3f]">UNITY</span>
            <span className="text-[6px] font-bold text-gray-400 uppercase tracking-widest">Mentorship Hub</span>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xs font-bold text-gray-500 hover:text-primary transition-colors">Home</Link>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 flex-1 flex items-center">
        <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative min-h-48 sm:h-80 md:h-[600px]">
          
          {isLogin ? (
            <div className="p-6 sm:p-4 sm:p-6 md:p-8 md:p-6 sm:p-8 md:p-12 lg:p-24 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 md:space-y-12 animate-in fade-in slide-in-from-top-4 sm:p-6 md:p-8 duration-700">
               <div className="space-y-4">
                <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Welcome Back</h1>
                <p className="text-gray-500 font-medium">Log in to continue your mentorship journey.</p>
              </div>
              
              <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                    <input type="email" required className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder="alex@university.edu" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
                    <input type="password" required className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all">
                  Sign In
                </button>
              </form>
              
              <p className="text-xs font-bold text-gray-400">
                New to the hub? <button onClick={() => setIsLogin(false)} className="text-primary hover:underline">Create an account</button>
              </p>
            </div>
          ) : (
            <>
              {/* Progress Header */}
              <div className="p-4 sm:p-6 md:p-8 border-b border-gray-50 bg-gray-50/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-900">Step {step} of 2: Create Your Profile</h3>
                  <div className="bg-blue-50 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {step * 50}% Complete
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${step * 50}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-16 text-center space-y-6 sm:space-y-8 md:space-y-12">
                {step === 1 ? (
                  <div className="space-y-6 sm:space-y-8 md:space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="space-y-4">
                      <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Identify Your Role</h1>
                      <p className="text-gray-500 font-medium max-w-2xl mx-auto">
                        Whether you're looking to share wisdom or seeking guidance, you belong here.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                      {roles.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRole(r.id)}
                          className={`group relative text-left rounded-3xl border-2 transition-all p-2 ${
                            selectedRole === r.id ? 'border-primary bg-primary/5' : 'border-gray-50 hover:border-gray-200 bg-white'
                          }`}
                        >
                          <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                            <img src={r.img} alt={r.title} className="w-full h-full object-cover" />
                            <div className={`absolute top-3 right-3 size-5 rounded-full border-2 flex items-center justify-center ${
                              selectedRole === r.id ? 'bg-primary border-primary' : 'bg-white/80 border-gray-300'
                            }`}>
                              {selectedRole === r.id && <div className="size-2 bg-white rounded-full"></div>}
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            <h4 className="font-black text-sm mb-1">{r.title}</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{r.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 sm:space-y-8 md:space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="space-y-4 text-center">
                      <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Your Interests</h1>
                      <p className="text-gray-500 font-medium max-w-2xl mx-auto">
                        This helps our algorithm find your perfect peer mentor matches.
                      </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12 text-left">
                      <div className="space-y-6">
                        <h3 className="text-sm font-black flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-500">volunteer_activism</span>
                          I can Offer
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {offerTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag, selectedOffer, setSelectedOffer)}
                              className={`px-5 py-2.5 rounded-full text-xs font-bold border-2 transition-all ${
                                selectedOffer.includes(tag) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/10' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-sm font-black flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-500">settings_suggest</span>
                          I am Seeking
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {seekingTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag, selectedSeeking, setSelectedSeeking)}
                              className={`px-5 py-2.5 rounded-full text-xs font-bold border-2 transition-all ${
                                selectedSeeking.includes(tag) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/10' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
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

                {/* Actions */}
                <div className="pt-12 flex items-center justify-between">
                  <button 
                    onClick={() => step === 1 ? setIsLogin(true) : setStep(1)} 
                    className="px-8 py-3 rounded-xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-100"
                  >
                    {step === 1 ? 'Back to Login' : 'Previous Step'}
                  </button>
                  <button 
                    onClick={handleNext}
                    className="bg-primary text-white font-black px-12 py-4 rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                  >
                    {step === 2 ? 'Complete Account' : 'Next Step'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Welcome;
