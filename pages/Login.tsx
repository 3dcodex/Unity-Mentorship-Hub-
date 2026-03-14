
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useAuth } from '../App';
import { errorService } from '../services/errorService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [resetAttempts, setResetAttempts] = useState(0);
  const [lastResetTime, setLastResetTime] = useState<number>(0);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

  // If already signed in, go to dashboard
  React.useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

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
      
      // Fetch user data from Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../src/firebase');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Block suspended accounts
        if (userData.status === 'suspended') {
          await import('firebase/auth').then(({ signOut }) => signOut(auth));
          const reason = userData.suspendReason || 'Policy violation';
          setError(`Your account has been suspended. Reason: ${reason}. Please contact support.`);
          setIsLoading(false);
          return;
        }

        localStorage.setItem('unity_user_name', userData.displayName || user.email || 'User');
        localStorage.setItem('unity_user_role', userData.role || 'Student');
      } else {
        localStorage.setItem('unity_user_name', user.email || 'User');
      }
      
      localStorage.setItem('unity_onboarding_complete', 'true');
      
      // Keep loading state and use window.location for clean navigation
      window.location.href = '/dashboard';
    } catch (err: any) {
      errorService.handleError(err, 'Login error');
      setError(err?.message ?? 'Sign-in failed');
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'linkedin') => {
    setError(null);
    setIsLoading(true);
    try {
      const authProvider = provider === 'google' 
        ? new GoogleAuthProvider()
        : new OAuthProvider('microsoft.com'); // LinkedIn uses Microsoft OAuth
      
      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;
      
      // Fetch/create user data in Firestore
      const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../src/firebase');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'Student',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      const userData = userDoc.exists() ? userDoc.data() : { displayName: user.displayName, role: 'Student' };

      // Block suspended accounts for OAuth too
      if (userDoc.exists() && userData.status === 'suspended') {
        await import('firebase/auth').then(({ signOut }) => signOut(auth));
        const reason = userData.suspendReason || 'Policy violation';
        setError(`Your account has been suspended. Reason: ${reason}. Please contact support.`);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('unity_user_name', userData.displayName || user.email || 'User');
      localStorage.setItem('unity_user_role', userData.role || 'Student');
      localStorage.setItem('unity_onboarding_complete', 'true');
      
      window.location.href = '/dashboard';
    } catch (err: any) {
      errorService.handleError(err, 'OAuth login error');
      setError(err?.message ?? `${provider} sign-in failed`);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Validation
    if (!resetEmail.trim()) {
      setResetMessage({ type: 'error', text: 'Please enter your email' });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setResetMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    // Rate limiting - client side (3 attempts per 15 minutes)
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    
    if (now - lastResetTime < fifteenMinutes && resetAttempts >= 3) {
      const waitTime = Math.ceil((fifteenMinutes - (now - lastResetTime)) / 60000);
      setResetMessage({ 
        type: 'error', 
        text: `Too many attempts. Please wait ${waitTime} minutes.` 
      });
      return;
    }

    // Reset counter if 15 minutes passed
    if (now - lastResetTime >= fifteenMinutes) {
      setResetAttempts(0);
    }
    
    setResetLoading(true);
    setResetMessage(null);

    // reCAPTCHA verification (if configured)
    if (RECAPTCHA_SITE_KEY && recaptchaRef.current) {
      const token = await recaptchaRef.current.executeAsync();
      recaptchaRef.current.reset();
      if (!token) {
        setResetMessage({ type: 'error', text: 'reCAPTCHA verification failed. Please try again.' });
        setResetLoading(false);
        return;
      }
    }
    
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      
      // Log attempt to Firestore for audit trail
      try {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../src/firebase');
        await setDoc(doc(db, 'passwordResetLogs', `${Date.now()}_${resetEmail}`), {
          email: resetEmail.trim(),
          timestamp: serverTimestamp(),
          ip: 'client',
          userAgent: navigator.userAgent,
          success: true
        });
      } catch (logError) {
        errorService.handleError(logError, 'Failed to log reset attempt');
      }
      
      setResetMessage({ 
        type: 'success', 
        text: 'Password reset email sent! Check your inbox and spam folder. The link expires in 1 hour.' 
      });
      
      setResetAttempts(prev => prev + 1);
      setLastResetTime(now);
      
      setTimeout(() => {
        setShowForgotModal(false);
        setResetEmail('');
        setResetMessage(null);
      }, 6000);
    } catch (err: any) {
      errorService.handleError(err, 'Password reset error');
      
      let errorMessage = 'Failed to send reset email. ';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again in 15 minutes.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage += 'Please try again or contact support.';
      }
      
      setResetMessage({ type: 'error', text: errorMessage });
      
      // Log failed attempt
      try {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../src/firebase');
        await setDoc(doc(db, 'passwordResetLogs', `${Date.now()}_${resetEmail}_failed`), {
          email: resetEmail.trim(),
          timestamp: serverTimestamp(),
          error: err.code || err.message,
          success: false
        });
      } catch (logError) {
        errorService.handleError(logError, 'Failed to log error');
      }
      
      setResetAttempts(prev => prev + 1);
      setLastResetTime(now);
    } finally {
      setResetLoading(false);
    }
  };

  // Show loading overlay during login
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="size-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-gray-600 dark:text-gray-400">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Glass Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 space-y-8">
          <div className="text-center space-y-4">
            <Link to="/" className="inline-flex flex-col items-center gap-3 group">
              <img 
                src="/logo.png" 
                alt="Unity" 
                className="size-16 rounded-2xl object-contain"
              />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">UNITY</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mentorship Hub</span>
              </div>
            </Link>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Welcome back</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Continue your journey to success</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" aria-label="Sign in form">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                  autoComplete="email"
                  className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-medium focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white" 
                  placeholder="alex@university.edu" 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Password</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-label="Password"
                    autoComplete="current-password"
                    className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-medium focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all pr-12 dark:text-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
            <div className="relative flex justify-center text-xs font-medium text-gray-500 dark:text-gray-400"><span className="bg-white/80 dark:bg-slate-900/80 px-4">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleOAuthLogin('google')} disabled={isLoading} className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all font-medium text-sm dark:text-gray-300 disabled:opacity-50 group">
              <img src="https://www.google.com/favicon.ico" className="size-5" alt="Google" /> 
              <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">Google</span>
            </button>
            <button onClick={() => handleOAuthLogin('linkedin')} disabled={isLoading} className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all font-medium text-sm dark:text-gray-300 disabled:opacity-50 group">
              <svg className="size-5" fill="#0A66C2" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">LinkedIn</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            New to Unity? <Link to="/signup" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Create an account</Link>
          </p>
        </div>
        
        {/* Minimal Footer */}
        <div className="text-center pb-6">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2024 Unity Mentorship Hub. All rights reserved.
          </p>
        </div>
      </div>
      {showForgotModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setShowForgotModal(false);
            setResetEmail('');
            setResetMessage(null);
          }}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Reset Password</h2>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setResetEmail('');
                  setResetMessage(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter your email and we'll send you a password reset link. Check your spam folder if you don't see it within a few minutes.
            </p>
            
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                setResetMessage(null);
              }}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white mb-4"
              disabled={resetLoading}
            />
            
            {resetMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                resetMessage.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                {resetMessage.text}
              </div>
            )}
            
            <button
              onClick={handleForgotPassword}
              disabled={resetLoading || !resetEmail.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {resetLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            {RECAPTCHA_SITE_KEY && (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                size="invisible"
                badge="bottomright"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
