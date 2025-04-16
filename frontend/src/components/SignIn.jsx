import React, { useEffect, useState } from 'react';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

export default function SignIn({ currentSchool }) {
  const navigate = useNavigate();
  const [schoolDisplayName, setSchoolDisplayName] = useState(currentSchool);

  useEffect(() => {
    const fetchDisplayName = async () => {
      try {
        const db = getFirestore();
        const schoolDocRef = doc(db, 'schools', currentSchool);
        const schoolDoc = await getDoc(schoolDocRef);

        if (schoolDoc.exists() && schoolDoc.data().displayName) {
          setSchoolDisplayName(schoolDoc.data().displayName);
        } else {
          // Create school if missing
          await setDoc(schoolDocRef, {
            displayName: currentSchool,
            hasCounselor: false,
          });
          setSchoolDisplayName(currentSchool);
          console.warn('Created school entry for:', currentSchool);
        }
      } catch (error) {
        console.error('Error fetching school displayName:', error);
      }
    };

    fetchDisplayName();
  }, [currentSchool]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    const db = getFirestore();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'schools', currentSchool, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const studentDocRef = doc(db, 'schools', currentSchool, 'students', user.uid);
        const studentDoc = await getDoc(studentDocRef);

        if (!studentDoc.exists()) {
          const counselorEmailRef = doc(db, 'schools', currentSchool, 'counselorEmails', user.email);
          const counselorEmailDoc = await getDoc(counselorEmailRef);
          let role = 'student';

          if (counselorEmailDoc.exists() && counselorEmailDoc.data().role === 'counselor') {
            role = 'counselor';
          } else {
            const schoolDocRef = doc(db, 'schools', currentSchool);
            const schoolDoc = await getDoc(schoolDocRef);
            const hasCounselor = schoolDoc.exists() && schoolDoc.data().hasCounselor === true;
            role = hasCounselor ? 'student' : 'counselor';
          }

          if (role === 'counselor') {
            await setDoc(userDocRef, {
              role,
              name: user.displayName || 'User',
              studentId: null,
            });
            await setDoc(doc(db, 'schools', currentSchool), { hasCounselor: true }, { merge: true });
          } else {
            const studentId = `S${user.uid.slice(0, 3).toUpperCase()}`;
            await setDoc(studentDocRef, {
              role,
              name: user.displayName || 'User',
              studentId,
              grade: null,
              birthday: null,
            });
          }
        }
      }

      // ✅ Final check for role and redirect
      const finalUserDoc = await getDoc(userDocRef);
      const role = finalUserDoc.exists() ? finalUserDoc.data().role : 'student';
      navigate(role === 'counselor' ? '/admin' : '/');

    } catch (err) {
      console.error('Google Sign-In Error:', err);
      alert('Failed to sign in. Please try again.');
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(to bottom right, #ffdee9, #b5fffc)',
      }}
    >
      <div
        style={{
          width: '350px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            fontFamily: '"Fredoka One", "Comic Sans MS", cursive, sans-serif',
            color: '#FF6B6B',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          Moodie <span style={{ fontSize: '1.5rem' }}>🌈</span>
        </h1>
        <p style={{ marginBottom: '1rem', color: '#555' }}>
          Signing in for <strong>{schoolDisplayName}</strong>
        </p>
        <button
          onClick={handleGoogleSignIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '9999px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            fontSize: '1rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          }}
        >
          <svg
            style={{ width: '20px', height: '20px' }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0..."
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57..."
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c..."
            />
            <path
              fill="#34A853"
              d="M24 48c..."
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          <span style={{ color: '#555', fontWeight: '500', lineHeight: '20px' }}>
            Sign in with Google
          </span>
        </button>
      </div>
    </div>
  );
}
