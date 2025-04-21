// Friendly messagesimport React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase'; // adjust path as needed

// Mood definitions with Upset emoji
const moods = [
  { emoji: '😄', label: 'Happy', value: 7 },
  { emoji: '🙂', label: 'Okay',  value: 6 },
  { emoji: '😴', label: 'Tired', value: 5 },
  { emoji: '😢', label: 'Sad',   value: 4 },
  { emoji: '😟', label: 'Upset', value: 3 },
  { emoji: '😠', label: 'Angry', value: 2 },
  { emoji: '😡', label: 'Mad',   value: 1 },
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

// Format to YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

export default function MoodFlow({ user }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [counter, setCounter] = useState(3);
  const navigate = useNavigate();

  // Save to Firestore on selection (allows multiple per day)
  useEffect(() => {
    if (!selectedMood || !user?.uid) return;

    const saveMood = async () => {
      const today = formatDate(new Date());
      const timestamp = Date.now();
      const docId = `${today}_${timestamp}`; // e.g. "2025-04-21_1682085600000"
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
          score:      selectedMood.value,
          emoji:      selectedMood.emoji,
          date:       today,
          recordedAt: serverTimestamp(),
        });
        console.log('Mood saved:', selectedMood, 'for', user.uid, 'id:', docId);
      } catch (err) {
        console.error('Error saving mood:', err);
      }
    };

    saveMood();
  }, [selectedMood, user]);

  // Start countdown when a mood is selected
  useEffect(() => {
    if (!selectedMood) return;
    setCounter(3);
    const timer = setInterval(() => setCounter((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [selectedMood]);

  // Sign out and redirect when countdown finishes
  useEffect(() => {
    if (selectedMood && counter < 0) {
      signOut(auth)
        .then(() => navigate('/signin'))
        .catch(console.error);
    }
  }, [counter, selectedMood, navigate]);

  // After selection: thank you + countdown
  if (selectedMood) {
    return (
      <div style={thankYouContainer}>
        <h1 style={thankYouHeader}>{moodMessages[selectedMood.label]}</h1>
        <div style={emojiStyle}>{selectedMood.emoji}</div>
        <p style={thankYouLabel}>{selectedMood.label}</p>
        <p style={countdownStyle}>
          Signing out in {counter >= 0 ? counter : 0}...
        </p>
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
            style={emojiButton}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            aria-label={m.label}
          >
            {m.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// — Styles —
const pickerContainer = {
  display:        'flex',
  flexDirection:  'column',
  alignItems:     'center',
  justifyContent: 'center',
  gap:            '1.5rem',
  height:         '100vh',
  width:          '100vw',
  background:     'linear-gradient(to bottom right, #FBCFE8, #C7D2FE)',
};

const pickerHeader = {
  fontSize:   '2rem',
  fontWeight: 600,
  color:      '#1F2937',
  textAlign:  'center',
};

const buttonRow = {
  display:        'flex',
  gap:            '1.5rem',
  justifyContent: 'center',
};

const emojiButton = {
  background:   'transparent',
  border:       'none',
  padding:      0,
  cursor:       'pointer',
  fontSize:     '8rem',
  transition:   'transform 0.2s',
};

const thankYouContainer = {
  display:        'flex',
  flexDirection:  'column',
  alignItems:     'center',
  justifyContent: 'center',
  textAlign:      'center',
  height:         '100vh',
  width:          '100vw',
  background:     'linear-gradient(to bottom right, #FECACA, #BFDBFE)',
  padding:        '1rem',
};

const thankYouHeader = {
  fontSize:     '2.5rem',
  fontWeight:   'bold',
  color:        'indigo',
  marginBottom: '1.5rem',
};

const emojiStyle = {
  fontSize:  '12rem',
  lineHeight:'1',
};

const thankYouLabel = {
  fontSize:   '2rem',
  fontWeight: 600,
  color:      'blue',
  marginTop: '1rem',
};

const countdownStyle = {
  marginTop: '2rem',
  fontSize: '1.25rem',
  color: '#374151',
  fontWeight: 500,
};

const moodMessages = {
  Happy: 'Yay! You look happy!',
  Okay: 'Thanks! Hope your day gets better.',
  Sad: 'Sorry you’re sad. Cheer up soon!',
  Angry: 'Take a deep breath. It will be okay!',
  Tired: 'Rest up and feel better!',
};

// Format to YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

export default function MoodFlow({ user }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [counter, setCounter] = useState(3);
  const navigate = useNavigate();

  // Save to Firestore on selection (allows multiple per day)
  useEffect(() => {
    if (!selectedMood || !user?.uid) return;

    const saveMood = async () => {
      const today = formatDate(new Date());
      const timestamp = Date.now();
      const docId = `${today}_${timestamp}`; // e.g. "2025-04-21_1682085600000"
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
          score:      selectedMood.value,
          emoji:      selectedMood.emoji,
          date:       today,
          recordedAt: serverTimestamp(),
        });
        console.log('Mood saved:', selectedMood, 'for', user.uid, 'id:', docId);
      } catch (err) {
        console.error('Error saving mood:', err);
      }
    };

    saveMood();
  }, [selectedMood, user]);

  // Start countdown when a mood is selected
  useEffect(() => {
    if (!selectedMood) return;
    setCounter(3);
    const timer = setInterval(() => setCounter((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [selectedMood]);

  // Sign out and redirect when countdown finishes
  useEffect(() => {
    if (selectedMood && counter < 0) {
      signOut(auth)
        .then(() => navigate('/signin'))
        .catch(console.error);
    }
  }, [counter, selectedMood, navigate]);

  // After selection: thank you + countdown
  if (selectedMood) {
    return (
      <div style={thankYouContainer}>
        <h1 style={thankYouHeader}>{moodMessages[selectedMood.label]}</h1>
        <div style={emojiStyle}>{selectedMood.emoji}</div>
        <p style={thankYouLabel}>{selectedMood.label}</p>
        <p style={countdownStyle}>
          Signing out in {counter >= 0 ? counter : 0}...
        </p>
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
            style={emojiButton}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.25)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            aria-label={m.label}
          >
            {m.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// — Styles —
const pickerContainer = {
  display:        'flex',
  flexDirection:  'column',
  alignItems:     'center',
  justifyContent: 'center',
  gap:            '1.5rem',
  height:         '100vh',
  width:          '100vw',
  background:     'linear-gradient(to bottom right, #FBCFE8, #C7D2FE)',
};

const pickerHeader = {
  fontSize:   '2rem',
  fontWeight: 600,
  color:      '#1F2937',
  textAlign:  'center',
};

const buttonRow = {
  display:        'flex',
  gap:            '1.5rem',
  justifyContent: 'center',
};

const emojiButton = {
  background:   'transparent',
  border:       'none',
  padding:      0,
  cursor:       'pointer',
  fontSize:     '8rem',
  transition:   'transform 0.2s',
};

const thankYouContainer = {
  display:        'flex',
  flexDirection:  'column',
  alignItems:     'center',
  justifyContent: 'center',
  textAlign:      'center',
  height:         '100vh',
  width:          '100vw',
  background:     'linear-gradient(to bottom right, #FECACA, #BFDBFE)',
  padding:        '1rem',
};

const thankYouHeader = {
  fontSize:     '2.5rem',
  fontWeight:   'bold',
  color:        'indigo',
  marginBottom: '1.5rem',
};

const emojiStyle = {
  fontSize:  '12rem',
  lineHeight:'1',
};

const thankYouLabel = {
  fontSize:   '2rem',
  fontWeight: 600,
  color:      'blue',
  marginTop: '1rem',
};

const countdownStyle = {
  marginTop: '2rem',
  fontSize: '1.25rem',
  color: '#374151',
  fontWeight: 500,
};
