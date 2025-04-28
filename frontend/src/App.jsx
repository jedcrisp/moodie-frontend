// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MoodSelector from './components/MoodSelector.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import StudentProfile from './components/StudentProfile.jsx';
import SignIn from './components/SignIn.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
        const userDoc = await getDoc(doc(db, 'schools', currentSchool, 'users', u.uid));
        if (userDoc.exists()) {
          setUser({
            uid: u.uid,
            name: u.displayName || 'User',
            role: userDoc.data().role || 'student',
            school: currentSchool
          });
        } else {
          setUser(null);
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

  const handleMoodSelect = async (mood) => {
    if (!user) return;
    const db = getFirestore();
    try {
      await addDoc(collection(db, 'schools', user.school, 'students', user.uid, 'moods'), {
        score: mood.score,
        emoji: mood.emoji,
        date: new Date(),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error saving mood:', err);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
      <p className="text-2xl text-purple-700">Loading…</p>
    </div>
  );

  return (
    <Routes>
      {/* Student */}
      {user?.role === 'student' && (
        <>
          <Route
            path="/"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector user={user} onSelect={handleMoodSelect} />
              </div>
            }
          />
          <Route
            path="/mood-selector"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector user={user} onSelect={handleMoodSelect} />
              </div>
            }
          />
          <Route path="/signin" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* Counselor / Admin */}
      {user?.role === 'counselor' && (
        <Route path="/admin/*" element={<AdminDashboard user={user} />}>
          {/* Remove placeholder welcome message; AdminDashboard already renders the student table */}
          <Route index element={null} />

          {/* Allow counselors to take attendance themselves too */}
          <Route
            path="mood-selector"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector user={user} onSelect={handleMoodSelect} />
              </div>
            }
          />

          {/* Student profile route */}
          <Route
            path="students/:studentId"
            element={<StudentProfile user={user} />}
          />

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      )}

      {/* Unauthenticated */}
      {(!user || user.school !== currentSchool) && (
        <>
          <Route path="/signin" element={<SignIn currentSchool={currentSchool} />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </>
      )}
    </Routes>
  );
}
