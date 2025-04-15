import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MoodSelector from './components/MoodSelector.jsx';
import AdminDashboard from './components/AdminDashboard';
import SignIn from './components/SignIn';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getSchoolFromSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      return 'TestSchool';
    }
    return parts[0];
  };

  const currentSchool = getSchoolFromSubdomain();

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? currentUser.uid : null);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'schools', currentSchool, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = {
              role: userDoc.data().role || 'student',
              name: currentUser.displayName || 'User',
              uid: currentUser.uid,
              school: currentSchool,
              studentId: userDoc.data().studentId || null,
            };
            setUser(userData);
            console.log('Set user:', userData);
          } else {
            console.log('User not found in school:', currentSchool);
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        console.log('No user signed in');
      }
      setLoading(false);
    });

    return () => {
      console.log('Unsubscribing auth listener');
      unsubscribe();
    };
  }, [currentSchool]);

  // ✅ MOVE THIS OUTSIDE the above useEffect!
  useEffect(() => {
    if (!loading && user && user.school === currentSchool) {
      if (user.role === 'counselor' && window.location.pathname !== '/admin') {
        navigate('/admin');
      } else if (user.role === 'student' && window.location.pathname !== '/') {
        navigate('/');
      }
    }
  }, [user, loading, currentSchool, navigate]);

  if (loading) {
    console.log('Loading auth state...');
    return <div>Loading...</div>;
  }

  console.log('Rendering with user:', user);
  console.log('Current path:', window.location.pathname);
  console.log('Current school:', currentSchool);

  return (
    <Routes>
      {user && user.role === 'student' && user.school === currentSchool && (
        <>
          <Route
            path="/"
            element={
              <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector user={user} onSelect={(mood) => console.log('Selected mood:', mood)} />
              </div>
            }
          />
          <Route path="/signin" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
      {user && user.role === 'counselor' && user.school === currentSchool && (
        <>
          <Route path="/admin" element={<AdminDashboard user={user} />} />
          <Route path="/signin" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </>
      )}
      {(!user || user.school !== currentSchool) && (
        <>
          <Route path="/signin" element={<SignIn currentSchool={currentSchool} />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </>
      )}
    </Routes>
  );
}
