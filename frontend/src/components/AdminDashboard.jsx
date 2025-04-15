import React from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import MiniGraph from './MiniGraph'; // You’ll create this separately

const getMoodColor = (mood) => {
  switch (mood) {
    case '😄':
      return 'bg-green-100 text-green-800';
    case '🙂':
      return 'bg-yellow-100 text-yellow-800';
    case '😟':
      return 'bg-orange-100 text-orange-800';
    case '😠':
      return 'bg-red-100 text-red-800';
    case '😴':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function AdminDashboard({ user }) {
  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload(); // or use navigate('/signin')
  };

  // Example student data
  const students = [
    {
      name: 'Anna L.',
      studentId: '123456',
      moodToday: '🙂',
      moodTrend: [
        { date: 'Apr 11', mood: 3 },
        { date: 'Apr 12', mood: 2 },
        { date: 'Apr 13', mood: 4 },
        { date: 'Apr 14', mood: 3 },
        { date: 'Apr 15', mood: 3 }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">
          Counselor Dashboard for <span className="text-indigo-600">{user.school}</span>
        </h1>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="bg-white p-2 rounded-lg shadow hover:bg-red-100 transition"
        >
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Welcome card */}
      <div className="flex items-center gap-4 mb-8 bg-white rounded-lg shadow p-4">
        <img
          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.name || "counselor"}`}
          alt="Avatar"
          className="w-12 h-12 rounded-full"
        />
        <div>
          <p className="text-lg font-semibold text-gray-800">Welcome back, {user.name}!</p>
          <p className="text-sm text-gray-500">Viewing mood data for {user.school}</p>
        </div>
      </div>

      {/* Mood filter */}
      <div className="flex items-center gap-2 mb-4 text-gray-700">
        <label htmlFor="days">Show average over last</label>
        <input
          id="days"
          type="number"
          defaultValue={5}
          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <span>days</span>
      </div>

      {/* Mood table */}
      <div className="overflow-x-auto shadow rounded-lg bg-white">
        <table className="min-w-full table-auto text-sm text-gray-700">
          <thead className="bg-indigo-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Name</th>
              <th className="px-6 py-3 text-left font-semibold">Student ID</th>
              <th className="px-6 py-3 text-left font-semibold">Today's Mood</th>
              <th className="px-6 py-3 text-left font-semibold">Trend (Last 5 Days)</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={idx} className="border-t hover:bg-indigo-50">
                <td className="px-6 py-3">{student.name}</td>
                <td className="px-6 py-3">{student.studentId}</td>
                <td className={`px-6 py-3 text-2xl rounded ${getMoodColor(student.moodToday)}`}>
                  {student.moodToday}
                </td>
                <td className="px-6 py-3">
                  <MiniGraph data={student.moodTrend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
