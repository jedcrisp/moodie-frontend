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
      console.log('Signed in user:', user.uid, 'School:', currentSchool, 'Email:', user.email);

      // Check if user is already assigned as a counselor or student
      const userDocRef = doc(db, 'schools', currentSchool, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Check student document
        const studentDocRef = doc(db, 'schools', currentSchool, 'students', user.uid);
        const studentDoc = await getDoc(studentDocRef);

        if (!studentDoc.exists()) {
          // Check if the user's email is in the school's counselorEmails subcollection
          const counselorEmailRef = doc(db, 'schools', currentSchool, 'counselorEmails', user.email);
          const counselorEmailDoc = await getDoc(counselorEmailRef);
          let role = 'student'; // Default role

          if (counselorEmailDoc.exists() && counselorEmailDoc.data().role === 'counselor') {
            role = 'counselor';
          } else {
            // Fallback to existing logic if email isn't in counselorEmails
            const schoolDocRef = doc(db, 'schools', currentSchool);
            const schoolDoc = await getDoc(schoolDocRef);
            const hasCounselor = schoolDoc.exists() && schoolDoc.data().hasCounselor === true;
            role = hasCounselor ? 'student' : 'counselor';
          }

          if (role === 'counselor') {
            // Assign as counselor in users collection
            await setDoc(userDocRef, {
              role,
              name: user.displayName || 'User',
              studentId: null,
            });
            // Update school document
            await setDoc(schoolDocRef, { hasCounselor: true }, { merge: true });
            console.log(`Assigned counselor to ${user.uid} in ${currentSchool}`);
          } else {
            // Assign as student in students collection
            const studentId = `S${user.uid.slice(0, 3).toUpperCase()}`;
            await setDoc(studentDocRef, {
              role,
              name: user.displayName || 'User',
              studentId,
              grade: null,
              birthday: null,
            });
            console.log(`Assigned student to ${user.uid} in ${currentSchool} with studentId: ${studentId}`);
          }
        } else {
          console.log('User already assigned as student in', currentSchool, ':', studentDoc.data());
        }
      } else {
        console.log('User already assigned as counselor in', currentSchool, ':', userDoc.data());
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
            gap: '12px', // Increased gap for better spacing
            width: '100%',
            padding: '0.75rem 1.5rem', // Added more horizontal padding
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '9999px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Added subtle shadow
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
            style={{ width: '20px', height: '20px' }} // Reduced icon size slightly for better proportion
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
          <span style={{ color: '#555', fontWeight: '500', lineHeight: '20px' }}>
            Sign in with Google
          </span>
        </button>
      </div>
    </div>
  );
}
