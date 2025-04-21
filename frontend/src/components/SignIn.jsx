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
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

// Helpers to format school slugs into human-readable names
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const formatSchoolName = (slug) => {
  const lower = slug.toLowerCase();
  // handle e.g. "waskomisd"
  const isdMatch = lower.match(/^(.+?)(isd)$/);
  if (isdMatch) {
    return `${capitalize(isdMatch[1])} ${isdMatch[2].toUpperCase()}`;
  }
  // fallback: split on non-letters
  return slug
    .split(/[-_\s]+/)
    .map(capitalize)
    .join(' ');
};

export default function SignIn({ currentSchool }) {
  const navigate = useNavigate();
  const [schoolDisplayName, setSchoolDisplayName] = useState(
    formatSchoolName(currentSchool)
  );

  useEffect(() => {
    const fetchDisplayName = async () => {
      try {
        const db = getFirestore();
        const schoolRef = doc(db, 'schools', currentSchool);
        const schoolSnap = await getDoc(schoolRef);
        let rawName;

        if (schoolSnap.exists() && schoolSnap.data().displayName) {
          rawName = schoolSnap.data().displayName;
        } else {
          rawName = formatSchoolName(currentSchool);
          // initialize in Firestore
          await setDoc(
            schoolRef,
            { displayName: rawName, hasCounselor: false },
            { merge: true }
          );
        }

        setSchoolDisplayName(formatSchoolName(rawName));
      } catch (error) {
        console.error('Error fetching school displayName:', error);
        setSchoolDisplayName(formatSchoolName(currentSchool));
      }
    };

    fetchDisplayName();
  }, [currentSchool]);

  const getEmailDomain = (email) => email.split('@')[1].toLowerCase();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    const db = getFirestore();

    try {
      const { user } = await signInWithPopup(auth, provider);
      const email = user.email.toLowerCase();
      const domain = getEmailDomain(email);

      // fetch school settings
      const schoolRef = doc(db, 'schools', currentSchool);
      const schoolSnap = await getDoc(schoolRef);
      let expectedDomain = `${currentSchool.toLowerCase()}.edu`;
      if (schoolSnap.exists() && schoolSnap.data().emailDomain) {
        expectedDomain = schoolSnap.data().emailDomain.toLowerCase();
      }

      // whitelists
      const counselorSnap = await getDoc(
        doc(db, 'schools', currentSchool, 'counselorEmails', email)
      );
      const studentTestSnap = await getDoc(
        doc(db, 'schools', currentSchool, 'studentTestEmails', email)
      );
      const isCounselorEmail = counselorSnap.exists();
      const isTestStudent = studentTestSnap.exists();

      // block non-domain & non-whitelisted
      if (
        !domain.includes(expectedDomain) &&
        !isCounselorEmail &&
        !isTestStudent
      ) {
        alert(
          `Please sign in with a ${expectedDomain} email or use a whitelisted test account.`
        );
        return;
      }

      // reference for redirect logic
      const userRef = doc(db, 'schools', currentSchool, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // first-time init
      if (!userSnap.exists()) {
        let role = 'student';
        if (isCounselorEmail) {
          role = 'counselor';
        } else if (!schoolSnap.exists() || !schoolSnap.data().hasCounselor) {
          role = 'counselor';
        }

        if (role === 'counselor') {
          await setDoc(userRef, {
            role,
            name: user.displayName || 'Counselor',
            studentId: null,
          });
          await setDoc(schoolRef, { hasCounselor: true }, { merge: true });
        } else {
          const studentId = `S${user.uid.slice(0, 3).toUpperCase()}`;
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
          await setDoc(userRef, {
            role,
            name: user.displayName || 'Student',
            studentId,
          });
        }
      }

      // final role & redirect
      const finalSnap = await getDoc(
        doc(db, 'schools', currentSchool, 'users', user.uid)
      );
      const finalRole = finalSnap.data()?.role || 'student';
      navigate(finalRole === 'counselor' ? '/admin' : '/');
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
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
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
          {/* Google icon */}
          <svg
            style={{ width: 20, height: 20 }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
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
