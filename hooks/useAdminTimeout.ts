import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../src/firebase';

type AdminTimeoutOptions = {
  onWarning?: () => void;
  onExpired?: () => void;
};

export const useAdminTimeout = (timeoutMinutes: number = 30, options?: AdminTimeoutOptions) => {
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

    // Emit warning 2 minutes before timeout so UI can render custom modal/toast.
    warningRef.current = setTimeout(() => {
      options?.onWarning?.();
      window.dispatchEvent(new CustomEvent('admin-timeout-warning'));
    }, (timeoutMinutes - 2) * 60 * 1000);

    // Auto-logout after timeout
    timeoutRef.current = setTimeout(() => {
      auth.signOut();
      navigate('/login');
      options?.onExpired?.();
      window.dispatchEvent(new CustomEvent('admin-timeout-expired'));
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
  }, [timeoutMinutes, options]);
};
