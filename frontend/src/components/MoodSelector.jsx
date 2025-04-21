// src/components/MoodSelector.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // Adjust path as needed

// Mood definitions
const moods = [
  { emoji: '😄', label: 'Happy', value: 7 },
  { emoji: '🙂', label: 'Okay', value: 6 },
  { emoji: '😴', label: 'Tired', value: 5 },
  { emoji: '😢', label: 'Sad', value: 4 },
  { emoji: '😟', label: 'Upset', value: 3 },
  { emoji: '😠', label: 'Angry', value: 2 },
  { emoji: '😡', label: 'Mad', value: 1 },
];

// Friendly messages
const moodMessages = {
  Happy: 'Yay! You look happy!',
  Okay: 'Thanks! Hope your day gets better.',
  Tired: 'Rest up and feel better!',
  Sad: 'Sorry you’re sad. Cheer up soon!',
  Upset: 'I’m sorry you’re upset. Things will get better!',
  Angry: 'Take a deep breath. It will be okay!',
  Mad: 'I can see you’re mad—take a breath and hang in there!',
};

// Format date to YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

interface User {
  uid: string;
  school: string;
  role?: string;
}

export default function MoodSelector({ user }: { user: User }) {
  const [selectedMood, setSelectedMood] = useState<typeof moods[0] | null>(null);
  const [counter, setCounter] = useState(3);
  const [userRole, setUserRole] = useState<string | null>(user.role || null);
  const navigate = useNavigate();

  // Fetch user role if not provided
  useEffect(() => {
    async function fetchUserRole() {
      if (!userRole && user?.uid) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || 'student');
        } else {
          console.warn('No user role found, defaulting to student');
          setUserRole('student');
        }
      }
    }
    fetchUserRole();
  }, [user?.uid, userRole]);

  // Save to Firestore on selection
  useEffect(() => {
    if (!selectedMood || !user?.uid) return;

    const saveMood = async () => {
      const today = formatDate(new Date());
      const timestamp = Date.now();
      const docId = `${today}_${timestamp}`;
      const moodRef = doc(
        db,
        'schools',
        user.school,
        'students',
        user.uid,
        'moods',
        docId
      );

      try {
        await setDoc(moodRef, {
          score: selectedMood.value,
          emoji: selectedMood.emoji,
          date: today,
          recordedAt: serverTimestamp(),
        });
        console.log('Mood saved:', selectedMood, 'for', user.uid, 'id:', docId);
      } catch (err) {
        console.error('Error saving mood:', err);
      }
    };

    saveMood();
  }, [selectedMood, user]);

  // Start countdown only for non-counselors
  useEffect(() => {
    if (!selectedMood || userRole === 'counselor') return;
    setCounter(3);
    const timer = setInterval(() => setCounter((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [selectedMood, userRole]);

  // Sign out and redirect only for non-counselors when countdown finishes
  useEffect(() => {
    if (selectedMood && counter < 0 && userRole !== 'counselor') {
      signOut(auth)
        .then(() => navigate('/signin'))
        .catch(console.error);
    }
  }, [counter, selectedMood, navigate, userRole]);

  // After selection: thank you + countdown (show countdown only for non-counselors)
  if (selectedMood) {
    return (
      <div style={thankYouContainer}>
        <h1 style={thankYouHeader}>{moodMessages[selectedMood.label]}</h1>
        <div style={emojiStyle}>{selectedMood.emoji}</div>
        <p style={thankYouLabel}>{selectedMood.label}</p>
        {userRole !== 'counselor' ? (
          <p style={countdownStyle}>
            Signing out in {counter >= 0 ? counter : 0}...
          </p>
        ) : (
          <button
            onClick={() => navigate('/admin')}
            style={backButtonStyle}
          >
            Back to Dashboard
          </button>
        )}
      </div>
    );
  }

  // Mood picker
  return (
    <div style={pickerContainer}>
      <h2 style={pickerHeader}>Hi there! How are you feeling today?</h2>
      <div style={buttonRow}>
        {moods.map((m) => (
          <button
            key={m.label}
            onClick={() => setSelectedMood(m)}
            title={m.label}
            aria-label={m.label}
            style={emojiButton}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {m.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// Styles (unchanged)
const pickerContainer = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5rem',
  height: '100vh',
  width: '100vw',
  background: 'linear-gradient(to bottom right, #FBCFE8, #C7D2FE)',
};

const pickerHeader = {
  fontSize: '2rem',
  fontWeight: 600,
  color: '#1F2937',
  textAlign: 'center',
};

const buttonRow = {
  display: 'flex',
  gap: '1.5rem',
  justifyContent: 'center',
};

const emojiButton = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontSize: '8rem',
  transition: 'transform 0.2s',
};

const thankYouContainer = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  height: '100vh',
  width: '100vw',
  background: 'linear-gradient(to bottom right, #FECACA, #BFDBFE)',
  padding: '1rem',
};

const thankYouHeader = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: 'indigo',
  marginBottom: '1.5rem',
};

const emojiStyle = {
  fontSize: '12rem',
  lineHeight: '1',
};

const thankYouLabel = {
  fontSize: '2rem',
  fontWeight: 600,
  color: 'blue',
  marginTop: '1rem',
};

const countdownStyle = {
  marginTop: '2rem',
  fontSize: '1.25rem',
  color: '#374151',
  fontWeight: 500,
};

const backButtonStyle = {
  marginTop: '2rem',
  padding: '8px 16px',
  backgroundColor: '#6B7280',
  color: 'white',
  border: 'none',
  borderRadius: '9999px',
  cursor: 'pointer',
  fontSize: '1rem',
};
