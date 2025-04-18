// App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MoodSelector from './components/MoodSelector.jsx';
import MoodFlow from './components/MoodSelector.jsx'; // Added import
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
          const userDocRef = doc(db, 'schools', currentSchool, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const role = userDoc.data().role || 'student';
            setUser({
              role,
              name: currentUser.displayName || 'User',
              uid: currentUser.uid,
              school: currentSchool,
              studentId: userDoc.data().studentId || null,
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
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Student Routes */}
      {user && user.role === 'student' && user.school === currentSchool && (
        <>
          <Route
            path="/"
            element={
              <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodFlow user={user} onSelect={(mood) => console.log('Selected mood:', mood)} />
              </div>
            }
          />
          <Route
            path="/mood-selector"
            element={
              <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodFlow user={user} onSelect={(mood) => console.log('Selected mood:', mood)} />
              </div>
            }
          />
          <Route path="/signin" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* Counselor/Admin Routes */}
      {user && user.role === 'counselor' && user.school === currentSchool && (
        <>
          <Route path="/admin" element={<AdminDashboard user={user} />} />
          <Route
            path="/admin/mood-selector"
            element={<MoodSelector user={user} onSelect={(m) => console.log('Selected mood:', m)} />}
          />
          <Route path="/signin" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </>
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
