
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useAuth } from '../App';
import Footer from '../components/Footer';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

  // If already signed in, go to dashboard
  if (!loading && user) {
    navigate('/dashboard');
    return null;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Wait a moment for auth to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch user data from Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../src/firebase');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      let isAdmin = false;
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('unity_user_name', userData.displayName || user.email || 'User');
        localStorage.setItem('unity_user_role', userData.role || 'Domestic Student');
        isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
        console.log('User role:', userData.role, 'isAdmin:', isAdmin);
      } else {
        localStorage.setItem('unity_user_name', user.email || 'User');
      }
      
      localStorage.setItem('unity_onboarding_complete', 'true');
      
      // Force navigation after a brief delay
      setTimeout(() => {
        navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
      }, 100);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message ?? 'Sign-in failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 p-4 sm:p-6">
      <div className="flex items-center justify-center flex-1">
      <div className="max-w-md w-full space-y-8 sm:space-y-12">
        <div className="text-center space-y-4 sm:space-y-6">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="h-12 sm:h-16">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=200" 
                alt="Unity Logo" 
                className="h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 80'%3E%3Crect fill='%231392ec' width='200' height='80'/%3E%3Ctext x='50%25' y='50%25' font-size='32' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3EUNITY%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#001f3f]">UNITY</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mentorship Hub</span>
            </div>
          </Link>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Welcome back</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">Log in to your inclusive student success hub.</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none transition-all dark:text-white" 
                placeholder="alex@university.edu" 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[9px] sm:text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Forgot?</button>
              </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 dark:focus:ring-blue-500/20 outline-none transition-all pr-10 dark:text-white"
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
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 sm:py-5 bg-primary dark:bg-blue-600 text-white font-black rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 dark:shadow-blue-600/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-lg sm:text-xl">progress_activity</span>
            ) : 'Sign In'}
          </button>
        </form>

        {error && (
          <div className="text-xs sm:text-sm text-red-600 text-center font-bold mt-2">{error}</div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-700"></div></div>
          <div className="relative flex justify-center text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500"><span className="bg-white dark:bg-slate-900 px-4">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 border border-gray-100 dark:border-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-bold text-xs dark:text-gray-300">
            <img src="https://developers.google.com/static/identity/images/branding_guideline/logo_standard_cO8025APcVccDE5DMsy59Euqo9G7M35xfDCulqWkQg.png" className="size-4 sm:size-5" alt="Google" onError={(e) => (e.currentTarget.style.display = 'none')} /> Google
          </button>
          <button className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 border border-gray-100 dark:border-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-bold text-xs dark:text-gray-300">
            <img src="https://cdn.worldvectorlogo.com/logos/linkedin-icon-2.svg" className="size-4 sm:size-5" alt="LinkedIn" onError={(e) => (e.currentTarget.style.display = 'none')} /> LinkedIn
          </button>
        </div>

        <p className="text-center text-xs font-bold text-gray-400 dark:text-gray-500">
          New to Unity? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
