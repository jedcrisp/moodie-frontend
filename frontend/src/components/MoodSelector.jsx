import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { ArrowLeft } from 'lucide-react';

const moods = [
  { emoji: "😄", label: "Happy" },
  { emoji: "🙂", label: "Okay" },
  { emoji: "😟", label: "Sad" },
  { emoji: "😠", label: "Angry" },
  { emoji: "😴", label: "Tired" },
];

// Short and kid-friendly messages:
const moodMessages = {
  Happy: "Yay! You look happy!",
  Okay: "Thanks! Hope your day gets better.",
  Sad: "Sorry you're sad. Cheer up soon!",
  Angry: "Take a deep breath. It will be okay!",
  Tired: "Rest up and feel better!",
};

export default function MoodFlow({ user }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const navigate = useNavigate();

  // When a mood is selected, sign out and go back to sign in after 5 seconds.
  useEffect(() => {
    if (selectedMood) {
      const timer = setTimeout(async () => {
        const auth = getAuth();
        try {
          await signOut(auth);
          console.log("User signed out after mood selection.");
        } catch (error) {
          console.error("Error signing out:", error);
        }
        navigate("/signin");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedMood, navigate]);

  // Show thank-you screen if a mood is selected:
  if (selectedMood) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          textAlign: "center",
          background: "linear-gradient(to bottom right, #FECACA, #BFDBFE)",
          padding: "1rem",
        }}
      >
        {user.role === 'counselor' && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
            }}
          >
            <button
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'transform 0.2s, background-color 0.3s',
                fontSize: '1rem',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.backgroundColor = '#7C3AED';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = '#8B5CF6';
              }}
              title="Back to Admin Dashboard"
            >
              <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>Back to Admin Dashboard</span>
            </button>
          </div>
        )}
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "indigo",
            marginBottom: "1.5rem",
          }}
        >
          {moodMessages[selectedMood.label]}
        </h1>
        <div
          style={{
            fontSize: "12rem",
            lineHeight: "1",
          }}
        >
          {selectedMood.emoji}
        </div>
        <p
          style={{
            fontSize: "2rem",
            fontWeight: "600",
            color: "blue",
            marginTop: "1rem",
          }}
        >
          {selectedMood.label}
        </p>
      </div>
    );
  }

  // Otherwise, show the mood selection screen:
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(to bottom right, #FBCFE8, #C7D2FE)",
      }}
    >
      {user.role === 'counselor' && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
          }}
        >
          <button
            onClick={() => navigate('/admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#8B5CF6',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'transform 0.2s, background-color 0.3s',
              fontSize: '1rem',
              fontWeight: '500',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = '#7C3AED';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#8B5CF6';
            }}
            title="Back to Admin Dashboard"
          >
            <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
            <span>Back to Admin Dashboard</span>
          </button>
        </div>
      )}
      <h2
        style={{
          fontSize: "2rem",
          fontWeight: "600",
          color: "#1F2937",
          textAlign: "center",
        }}
      >
        Hi there! How are you feeling today?
      </h2>
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          justifyContent: "center",
        }}
      >
        {moods.map((mood) => (
          <button
            key={mood.label}
            onClick={() => setSelectedMood(mood)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              transition: "transform 0.2s",
              cursor: "pointer",
              fontSize: "8rem",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            aria-label={mood.label}
          >
            {mood.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
