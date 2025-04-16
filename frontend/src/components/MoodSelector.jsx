import React, { useState } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function MoodSelector({ user, onSelect }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const db = getFirestore();
  const navigate = useNavigate();

  const moods = [
    { emoji: '😠', label: 'Angry', score: 1 },
    { emoji: '😟', label: 'Sad', score: 2 },
    { emoji: '🙂', label: 'Okay', score: 3 },
    { emoji: '😄', label: 'Happy', score: 4 },
    { emoji: '😁', label: 'Excited', score: 5 },
  ];

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    try {
      await addDoc(collection(db, 'schools', user.school, 'students', user.uid, 'moods'), {
        emoji: mood.emoji,
        score: mood.score,
        date: new Date().toISOString().split('T')[0], // e.g., "2025-04-15"
      });
      if (onSelect) onSelect(mood);
    } catch (error) {
      console.error('Error submitting mood:', error);
    }
  };

  return (
    <div className="text-center">
      {user.role === 'counselor' && (
        <div className="flex justify-start mb-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition transform hover:scale-105"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Admin Dashboard</span>
          </button>
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        How are you feeling today, {user.name}?
      </h2>
      <div className="flex justify-center gap-4">
        {moods.map((mood) => (
          <button
            key={mood.emoji}
            onClick={() => handleMoodSelect(mood)}
            className={clsx(
              'flex flex-col items-center p-4 rounded-xl transition transform hover:scale-105',
              selectedMood?.emoji === mood.emoji
                ? 'bg-purple-100 border-2 border-purple-500'
                : 'bg-white border-2 border-gray-300 hover:bg-gray-100'
            )}
          >
            <span className="text-4xl">{mood.emoji}</span>
            <span className="mt-2 text-sm font-medium text-gray-700">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
