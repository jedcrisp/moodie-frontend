import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

const moods = [
  { emoji: '😄', label: 'Happy' },
  { emoji: '😄', label: 'Okay' },
  { emoji: '😟', label: 'Sad' },
  { emoji: '😟', label: 'Upset' },
  { emoji: '😠', label: 'Angry' },
];

const moodMessages = {
  Happy: 'Yay! You look happy!',
  Okay: 'Thanks! Hope your day gets better.',
  Sad: "Sorry you're sad. Cheer up soon!",
  Upset: 'Take a deep breath. It will be okay!',
  Angry: 'Big feelings = brave heart. You’ve got this!',
};

export default function MoodFlow({ user }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(5); // Countdown timer state
  const navigate = useNavigate();
  const isCounselor = user?.role === 'counselor';

  // Auto sign-out for students after selecting a mood
  useEffect(() => {
    if (selectedMood && !isCounselor) {
      // Start the countdown timer
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Sign out and redirect
            const auth = getAuth();
            signOut(auth)
              .then(() => {
                console.log('User signed out after mood selection.');
                navigate('/signin');
              })
              .catch((error) => {
                console.error('Sign-out error:', error);
              });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Clean up the timer on component unmount
      return () => clearInterval(timer);
    }
  }, [selectedMood, isCounselor, navigate]);

  const goToAdminDashboard = () => navigate('/admin');

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
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: 'indigo',
            marginBottom: '1.5rem',
          }}
        >
          {moodMessages[selectedMood.label]}
        </h1>
        <div style={{ fontSize: '12rem', lineHeight: '1' }}>{selectedMood.emoji}</div>
        <p style={{ fontSize: '2rem', fontWeight: '600', color: 'blue', marginTop: '1rem' }}>
          {selectedMood.label}
        </p>
        {!isCounselor && (
          <p style={{ fontSize: '1.25rem', color: '#555', marginTop: '1rem' }}>
            Signing out in {secondsRemaining} seconds...
          </p>
        )}
        {isCounselor && (
          <button
            onClick={goToAdminDashboard}
            style={{
              marginTop: '2rem',
              backgroundColor: '#8b5cf6',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Back to Admin Dashboard
          </button>
        )}
      </div>
    );
  }

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
      }}
    >
      <h2
        style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: '#1F2937',
          textAlign: 'center',
        }}
      >
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label={mood.label}
          >
            {mood.emoji}
          </button>
        ))}
      </div>

      {isCounselor && (
        <button
          onClick={goToAdminDashboard}
          style={{
            marginTop: '2rem',
            backgroundColor: '#8b5cf6',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Back to Admin Dashboard
        </button>
      )}
    </div>
  );
}
