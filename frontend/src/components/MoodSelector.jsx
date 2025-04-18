// src/components/MoodFlow.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { auth, db } from './firebase'; // adjust path if needed

// Mood definitions with numerical values and emojis
const moods = [
  { emoji: '😄', label: 'Happy', value: 5 },
  { emoji: '🙂', label: 'Okay', value: 4 },
  { emoji: '😟', label: 'Sad', value: 2 },
  { emoji: '😠', label: 'Angry', value: 3 },
  { emoji: '😴', label: 'Tired', value: 1 },
];

// Short and kid‑friendly messages
const moodMessages = {
  Happy: 'Yay! You look happy!',
  Okay: 'Thanks! Hope your day gets better.',
  Sad: 'Sorry you’re sad. Cheer up soon!',
  Angry: 'Take a deep breath. It will be okay!',
  Tired: 'Rest up and feel better!',
};

// Utility to format date as YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

export default function MoodFlow({ user }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const navigate = useNavigate();

  // Save to Firestore when a mood is picked
  useEffect(() => {
    if (selectedMood && user?.studentId) {
      const today = formatDate(new Date());
      const moodDocRef = doc(
        db,
        'schools',
        user.school,
        'students',
        user.studentId,
        'moods',
        today
      );

      (async () => {
        try {
          await setDoc(moodDocRef, {
            score: selectedMood.value,
            emoji: selectedMood.emoji,
            date: today,
            recordedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Error saving mood:', err);
        }
      })();
    }
  }, [selectedMood, user]);

  // No more auto-signout here!

  // Render the thank‑you screen
  if (selectedMood) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          textAlign: 'center',
          background: 'linear-gradient(to bottom right, #FECACA, #BFDBFE)',
          padding: '1rem',
          position: 'relative',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'indigo', marginBottom: '1.5rem' }}>
          {moodMessages[selectedMood.label]}
        </h1>
        <div style={{ fontSize: '12rem', lineHeight: 1 }}>
          {selectedMood.emoji}
        </div>
        <p style={{ fontSize: '2rem', fontWeight: '600', color: 'blue', marginTop: '1rem' }}>
          {selectedMood.label}
        </p>

        {/* Back to dashboard for counselors */}
        {user.role === 'counselor' && (
          <button
            onClick={() => navigate('/admin')}
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
      </div>
    );
  }

  // Otherwise show the mood selector
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(to bottom right, #FBCFE8, #C7D2FE)',
        position: 'relative',
      }}
    >
      <h2 style={{ fontSize: '2rem', fontWeight: '600', color: '#1F2937', textAlign: 'center' }}>
        Hi there! How are you feeling today?
      </h2>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
        {moods.map((mood) => (
          <button
            key={mood.label}
            onClick={() => setSelectedMood(mood)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              transition: 'transform 0.2s',
              cursor: 'pointer',
              fontSize: '8rem',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            aria-label={mood.label}
          >
            {mood.emoji}
          </button>
        ))}
      </div>

      {/* Back to dashboard for counselors */}
      {user.role === 'counselor' && (
        <button
          onClick={() => navigate('/admin')}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#6B7280',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      )}
    </div>
  );
}
