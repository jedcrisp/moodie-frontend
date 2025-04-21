// src/components/SignIn.jsx
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
import { auth } from '../firebase';
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
          // initialize if missing
          await setDoc(schoolDocRef, {
            displayName: currentSchool,
            hasCounselor: false,
          });
          setSchoolDisplayName(currentSchool);
        }
      } catch (error) {
        console.error('Error fetching school displayName:', error);
      }
    };

    fetchDisplayName();
  }, [currentSchool]);

  const getEmailDomain = (email) =>
    email?.split('@')[1].toLowerCase() || '';

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    const db = getFirestore();
    try {
      const { user } = await signInWithPopup(auth, provider);
      const email = user.email.toLowerCase();
      const domain = getEmailDomain(email);

      // Firestore refs
      const schoolRef = doc(db, 'schools', currentSchool);
      const schoolSnap = await getDoc(schoolRef);
      let expectedDomain = `${currentSchool.toLowerCase()}.edu`;
      if (schoolSnap.exists() && schoolSnap.data().emailDomain) {
        expectedDomain = schoolSnap.data().emailDomain.toLowerCase();
      }

      // check whitelists
      const counselorEmailSnap = await getDoc(
        doc(db, 'schools', currentSchool, 'counselorEmails', email)
      );
      const studentTestSnap = await getDoc(
        doc(db, 'schools', currentSchool, 'studentTestEmails', email)
      );
      const isCounselorEmail = counselorEmailSnap.exists();
      const isTestStudent = studentTestSnap.exists();

      // block if not matching domain or whitelisted
      if (!domain.includes(expectedDomain) && !isCounselorEmail && !isTestStudent) {
        alert(
          `Please sign in with a ${expectedDomain} email or use a whitelisted test account.`
        );
        return;
      }

      // doc where we store user role for redirect logic
      const userRef = doc(db, 'schools', currentSchool, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // if first time ever logging in
      if (!userSnap.exists()) {
        // decide role
        let role = 'student';
        if (isCounselorEmail) {
          role = 'counselor';
        } else if (!schoolSnap.exists() || !schoolSnap.data().hasCounselor) {
          // make first true school member a counselor
          role = 'counselor';
        }

        // write both students/ and users/ for consistency
        if (role === 'counselor') {
          await setDoc(userRef, {
            role,
            name: user.displayName || 'Counselor',
            studentId: null,
          });
          // mark school has counselor
          await setDoc(
            schoolRef,
            { hasCounselor: true },
            { merge: true }
          );
        } else {
          const studentId = `S${user.uid.slice(0, 3).toUpperCase()}`;
          // students subcollection
          await setDoc(
            doc(db, 'schools', currentSchool, 'students', user.uid),
            {
              role,
              name: user.displayName || 'Student',
              studentId,
              grade: null,
              birthday: null,
            }
          );
          // mirror into users/ for routing
          await setDoc(userRef, {
            role,
            name: user.displayName || 'Student',
            studentId,
          });
        }
      }

      // final read to get assigned role
      const finalSnap = await getDoc(userRef);
      const finalRole = finalSnap.data()?.role || 'student';

      // redirect
      if (finalRole === 'counselor') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      alert('Sign-in failed. Please try again.');
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
            fontFamily: '"Fredoka One", cursive',
            color: '#FF6B6B',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
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
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            fontSize: '1rem',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)')
          }
        >
          {/* Google icon + text */}
          <svg
            style={{ width: 20, height: 20 }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path fill="#EA4335" d="M24 9.5c3.54 0..." />
            <path fill="#4285F4" d="M46.98 24.55c0..." />
            <path fill="#FBBC05" d="M10.53 28.59c-.48..." />
            <path fill="#34A853" d="M24 48c6.48 0..." />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          <span style={{ color: '#555', fontWeight: 500 }}>
            Sign in with Google
          </span>
        </button>
      </div>
    </div>
  );
}
