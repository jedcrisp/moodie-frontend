// App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MoodSelector from './components/MoodSelector.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import SignIn from './components/SignIn.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getSchoolFromSubdomain = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      return 'TestSchool';
    }
    return hostname.split('.')[0];
  };
  const currentSchool = getSchoolFromSubdomain();

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'schools', currentSchool, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUser({
              uid: currentUser.uid,
              name: currentUser.displayName || 'User',
              role: userDoc.data().role || 'student',
              school: currentSchool,
              studentId: userDoc.data().studentId || null
            });
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [currentSchool]);

  // upon login, redirect student to "/" and counselor to "/admin"
  useEffect(() => {
    if (!loading && user) {
      if (user.school === currentSchool) {
        if (user.role === 'counselor') navigate('/admin', { replace: true });
        else if (user.role === 'student') navigate('/', { replace: true });
      }
    }
  }, [user, loading, currentSchool, navigate]);

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      {/* STUDENT */}
      {user?.role === 'student' && user.school === currentSchool && (
        <>
          <Route
            path="/"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodFlow user={user} onSelect={m => console.log('Picked', m)} />
              </div>
            }
          />
          <Route
            path="/mood-selector"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodFlow user={user} onSelect={m => console.log('Picked', m)} />
              </div>
            }
          />
          <Route path="/signin" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* COUNSELOR / ADMIN */}
      {user?.role === 'counselor' && user.school === currentSchool && (
        <>
          <Route path="/admin" element={<AdminDashboard user={user} />} />

          {/*  ↳ mounted inside AdminDashboard via navigate('/admin/mood-selector') */}
          <Route
            path="/admin/mood-selector"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector user={user} onSelect={m => console.log('Picked', m)} />
              </div>
            }
          />

          <Route path="/signin" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </>
      )}

      {/* UNAUTHENTICATED */}
      {(!user || user.school !== currentSchool) && (
        <>
          <Route path="/signin" element={<SignIn currentSchool={currentSchool} />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </>
      )}
    </Routes>
  );
}
