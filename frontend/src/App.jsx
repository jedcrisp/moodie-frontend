import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MoodFlow from './components/MoodSelector';
import AdminDashboard from './components/AdminDashboard';
import SignIn from './components/SignIn';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(null);
  const [schoolDisplayName, setSchoolDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  const getSchoolFromSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      return 'TestSchool';
    }
    if (parts[0] === 'www') {
      return 'TestSchool';
    }
    return parts[0];
  };

  const currentSchool = getSchoolFromSubdomain();

  useEffect(() => {
    const db = getFirestore();
    const fetchSchoolName = async () => {
      const schoolRef = doc(db, 'schools', currentSchool);
      const schoolSnap = await getDoc(schoolRef);
      if (schoolSnap.exists()) {
        const displayName = schoolSnap.data().displayName || currentSchool;
        setSchoolDisplayName(displayName);
      } else {
        setSchoolDisplayName(currentSchool);
      }
    };
    fetchSchoolName();
  }, [currentSchool]);

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
            const studentDocRef = doc(db, 'schools', currentSchool, 'students', currentUser.uid);
            const studentDoc = await getDoc(studentDocRef);

            if (studentDoc.exists()) {
              const userData = {
                role: 'student',
                name: studentDoc.data().name || 'User',
                uid: currentUser.uid,
                school: currentSchool,
                studentId: studentDoc.data().studentId || null,
              };
              setUser(userData);
              console.log('Set user:', userData);
            } else {
              console.log('User not found in school:', currentSchool);
              setUser(null);
            }
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

  useEffect(() => {
    if (!user || user.role !== 'student') return;

    console.log('Starting 5-second logout timer for student');
    const logoutTimer = setTimeout(() => {
      const auth = getAuth();
      signOut(auth)
        .then(() => {
          console.log('User signed out');
          setUser(null);
        })
        .catch((error) => {
          console.error('Logout error:', error);
        });
    }, 5000);

    return () => clearTimeout(logoutTimer);
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        width: '100dvw',
        height: '100dvh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <div
              style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom right, #ffdee9, #b5fffc)',
              }}
            >
              <MoodFlow user={user} />
            </div>
          }
        />

        {user && user.role === 'student' && user.school === currentSchool && (
          <>
            <Route path="/signin" element={<Navigate to="/" replace />} />
            <Route path="/admin" element={<Navigate to="/" replace />} />
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
            <Route
              path="/signin"
              element={<SignIn currentSchool={currentSchool} displayName={schoolDisplayName} />}
            />
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}
