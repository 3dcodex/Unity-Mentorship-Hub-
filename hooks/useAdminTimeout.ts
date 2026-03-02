import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../src/firebase';

export const useAdminTimeout = (timeoutMinutes: number = 30) => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Show warning 2 minutes before timeout
    warningRef.current = setTimeout(() => {
      const shouldContinue = confirm(
        'Your session will expire in 2 minutes due to inactivity. Click OK to continue.'
      );
      if (shouldContinue) {
        resetTimeout();
      }
    }, (timeoutMinutes - 2) * 60 * 1000);

    // Auto-logout after timeout
    timeoutRef.current = setTimeout(() => {
      auth.signOut();
      navigate('/login');
      alert('Session expired due to inactivity. Please log in again.');
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [timeoutMinutes]);
};
