import { useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useNavigate } from 'react-router-dom';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const useAutoLogout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('unity_onboarding_complete');
      localStorage.removeItem('unity_user_name');
      localStorage.removeItem('unity_user_role');
      navigate('/login');
    } catch (error) {
      console.error('Auto-logout error:', error);
    }
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, []);
};
