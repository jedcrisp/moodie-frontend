import React from 'react'

const moods = [
  { emoji: "😄", label: "Happy" },
  { emoji: "🙂", label: "Okay" },
  { emoji: "😟", label: "Sad" },
  { emoji: "😠", label: "Angry" },
  { emoji: "😴", label: "Tired" },
]

export default function MoodSelector({ onSelect }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-pink-100 to-blue-100">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full mx-4 text-center px-8 py-12 space-y-8">
        <h1 className="text-4xl font-extrabold text-indigo-600 drop-shadow-sm">
          Welcome to Moodie! 🌈
        </h1>
        <p className="text-2xl text-gray-700 font-semibold">
          How are you feeling today?
        </p>
        
        <div className="flex justify-center gap-6 text-[4rem] flex-wrap">
          {moods.map((mood) => (
            <button
              key={mood.label}
              onClick={() => onSelect(mood)}
              className="bg-gray-100 hover:bg-yellow-200 rounded-full p-4 transition-transform hover:scale-110 shadow-md"
              aria-label={mood.label}
            >
              {mood.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
