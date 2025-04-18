// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import MoodSelector from './components/MoodSelector.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import SignIn from './components/SignIn.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const currentSchool = (() => {
    const h = window.location.hostname;
    return h === 'localhost' || h.includes('127.0.0.1')
      ? 'TestSchool'
      : h.split('.')[0];
  })();

  // Listen for auth state
  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userDoc = await getDoc(
          doc(db, 'schools', currentSchool, 'users', u.uid)
        );
        if (userDoc.exists()) {
          setUser({
            uid: u.uid,
            name: u.displayName || 'User',
            role: userDoc.data().role || 'student',
            school: currentSchool,
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

  // Redirect on login, but allow any /admin/* and student mood-selector
  useEffect(() => {
    if (!loading && user?.school === currentSchool) {
      if (
        user.role === 'counselor' &&
        !location.pathname.startsWith('/admin')
      ) {
        navigate('/admin', { replace: true });
      } else if (
        user.role === 'student' &&
        !['/', '/mood-selector'].includes(location.pathname)
      ) {
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, currentSchool, navigate, location.pathname]);

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
                <MoodSelector
                  user={user}
                  onSelect={(m) => console.log('Picked', m)}
                />
              </div>
            }
          />
          <Route
            path="/mood-selector"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector
                  user={user}
                  onSelect={(m) => console.log('Picked', m)}
                />
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
          {/* default admin landing */}
          <Route
            index
            element={
              <div className="p-6 text-center text-lg">
                Welcome, {user.name}!
              </div>
            }
          />
          {/* mood selector under admin */}
          <Route
            path="mood-selector"
            element={
              <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 to-blue-200">
                <MoodSelector
                  user={user}
                  onSelect={(m) => console.log('Picked', m)}
                />
              </div>
            }
          />
          {/* any other unmatched: back to /admin */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      )}

      {/* UNAUTHENTICATED */}
      {(!user || user.school !== currentSchool) && (
        <>
          <Route
            path="/signin"
            element={<SignIn currentSchool={currentSchool} />}
          />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </>
      )}
    </Routes>
  );
}
