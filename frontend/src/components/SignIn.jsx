import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

export default function SignIn({ currentSchool }) {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    const db = getFirestore();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Signed in user:', user.uid, 'School:', currentSchool);

      // Check if user is already assigned to this school
      const userDocRef = doc(db, 'schools', currentSchool, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Check if school has a counselor using school document
        const schoolDocRef = doc(db, 'schools', currentSchool);
        const schoolDoc = await getDoc(schoolDocRef);
        const hasCounselor = schoolDoc.exists() && schoolDoc.data().hasCounselor === true;
        const role = hasCounselor ? 'student' : 'counselor';

        // Generate a studentId for students
        const studentId = role === 'student' ? `S${user.uid.slice(0, 3).toUpperCase()}` : null;

        // Assign user to school
        await setDoc(userDocRef, {
          role,
          name: user.displayName || 'User',
          ...(studentId && { studentId }),
        });

        // If counselor, update school document
        if (role === 'counselor') {
          await setDoc(schoolDocRef, { hasCounselor: true }, { merge: true });
        }

        console.log(`Assigned ${role} to ${user.uid} in ${currentSchool} with studentId: ${studentId || 'N/A'}`);
      } else {
        console.log('User already assigned in', currentSchool, ':', userDoc.data());
      }

      navigate('/');
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
          Signing in for {currentSchool}
        </p>
        <button
          onClick={handleGoogleSignIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '9999px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            fontSize: '1rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg
            style={{ width: '24px', height: '24px' }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          <span style={{ color: '#555', fontWeight: '500' }}>
            Sign in with Google
          </span>
        </button>
      </div>
    </div>
  );
}