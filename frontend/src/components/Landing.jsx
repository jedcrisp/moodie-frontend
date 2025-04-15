import React from 'react'

export default function Landing({ onLogin }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-blue-600">Welcome to Moodie 👋</h1>
      <p className="text-lg text-gray-700">Track how you feel, every day.</p>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-2 px-6 rounded-xl transition"
        onClick={onLogin}
      >
        Sign in with Google
      </button>
    </div>
  )
}
