import React from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';

export default function AdminDashboard({ user }) {
  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload(); // or navigate('/signin') if you're using useNavigate
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
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

      {/* Average mood filter */}
      <div className="flex items-center gap-2 mb-6 text-gray-700">
        <label htmlFor="days" className="text-md">
          Show average over last
        </label>
        <input
          id="days"
          type="number"
          defaultValue={5}
          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <span className="text-md">days</span>
      </div>

      {/* Mood table */}
      <div className="overflow-x-auto shadow rounded-lg bg-white">
        <table className="min-w-full table-auto text-sm text-gray-700">
          <thead className="bg-indigo-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Name</th>
              <th className="px-6 py-3 text-left font-semibold">Student ID</th>
              <th className="px-6 py-3 text-left font-semibold">Today's Mood</th>
              <th className="px-6 py-3 text-left font-semibold">Average Mood (Last 5 Days)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t hover:bg-indigo-50">
              <td className="px-6 py-3">Anna L.</td>
              <td className="px-6 py-3">123456</td>
              <td className="px-6 py-3 text-2xl">🙂</td>
              <td className="px-6 py-3 text-2xl">🙂</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
