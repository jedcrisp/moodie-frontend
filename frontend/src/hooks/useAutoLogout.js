import { useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const useAutoLogout = (auth) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin', { replace: true });
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleSignOut();
    }, TIMEOUT_DURATION);
  };

  const handleActivity = () => {
    resetTimeout();
  };

  useEffect(() => {
    const events = ['mousemove', 'click', 'keypress', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimeout();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return handleSignOut;
};

export default useAutoLogout;
