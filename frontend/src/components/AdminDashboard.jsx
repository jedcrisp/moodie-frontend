import React from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react'; // use lucide or heroicons
import clsx from 'clsx'; // optional: for cleaner conditional classes

export default function AdminDashboard({ user }) {
  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    window.location.reload(); // or navigate to /signin if preferred
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with title + Sign out */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Counselor Dashboard for <span className="text-indigo-600">{user.school}</span>
        </h1>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Mood filter control */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-700">
        <span>Show average over last</span>
        <input
          type="number"
          defaultValue={5}
          className="border border-gray-300 rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span>days</span>
      </div>

      {/* Mood table */}
      <table className="w-full text-left bg-white shadow-sm rounded overflow-hidden">
        <thead className="bg-indigo-100 text-gray-700 text-sm">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Student ID</th>
            <th className="px-4 py-2">Today's Mood</th>
            <th className="px-4 py-2">Average Mood (Last 5 Days)</th>
          </tr>
        </thead>
        <tbody>
          {/* Render rows here */}
          <tr className="border-t hover:bg-indigo-50 transition">
            <td className="px-4 py-2">Anna L.</td>
            <td className="px-4 py-2">123456</td>
            <td className="px-4 py-2">🙂</td>
            <td className="px-4 py-2">🙂</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
