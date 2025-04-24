// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MoodSelector from './components/MoodSelector.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import StudentProfile from './components/StudentProfile.jsx';
import SignIn from './components/SignIn.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentSchool = (() => {
    const h = window.location.hostname;
    return h === 'localhost' || h.includes('127.0.0.1')
      ? 'TestSchool'
      : h.split('.')[0];
  })();

  useEffect(() => {
    const auth = getAuth(), db = getFirestore();
    const unsub = onAuthStateChanged(auth, async u => {
      if (u) {
        const userRef = doc(db, 'schools', currentSchool, 'users', u.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            uid: u.uid,
            name: u.displayName || 'User',
            role: userData.role || 'student',
            school: currentSchool,
            campuses: userData.campuses || [], // Include campuses
          });
        } else {
          // Create the user document if it doesn't exist
          const defaultUserData = {
            role: 'student', // Default role; adjust based on sign-in logic
            campuses: [], // Initialize campuses array
          };
          await setDoc(userRef, defaultUserData);
          setUser({
            uid: u.uid,
            name: u.displayName || 'User',
            role: defaultUserData.role,
            school: currentSchool,
            campuses: defaultUserData.campuses,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [currentSchool]);

  useEffect(() => {
    if (!loading && user?.school === currentSchool) {
      const p = window.location.pathname;
      if (user.role === 'counselor') {
        if (!p.startsWith('/admin')) navigate('/admin', { replace: true });
      } else {
        if (p !== '/' && p !== '/mood-selector') navigate('/', { replace: true });
      }
    }
  }, [user, loading, currentSchool, navigate]);

  if (loading) return <div>Loading…</div>;

  return (
    <Routes>
      {/* STUDENT */}
      {user?.role === 'student' && (
        <>
          <Route
            path="/"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector user={user} onSelect={m => console.log('Picked', m)} />
              </div>
            }
          />
          <Route
            path="/mood-selector"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector user={user} onSelect={m => console.log('Picked', m)} />
              </div>
            }
          />
          <Route path="/signin" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* COUNSELOR / ADMIN */}
      {user?.role === 'counselor' && (
        <Route path="/admin/*" element={<AdminDashboard user={user} />}>
          <Route index element={<div className="p-6">Welcome, {user.name}</div>} />
          <Route
            path="mood-selector"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector user={user} onSelect={m => console.log('Picked', m)} />
              </div>
            }
          />
          <Route
            path="students/:id"
            element={<StudentProfile user={user} />}
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
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
