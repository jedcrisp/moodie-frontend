import React from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';

export default function AdminDashboard({ user }) {
  const handleSignOut = async () => {
    await signOut(getAuth());
    window.location.reload();
  };

  // Example student data
  const students = [
    {
      name: 'Anna L.',
      studentId: '123456',
      grade: '3rd',
      birthday: '2015-09-12',
      notes: 'Loves drawing, shy around new kids.',
    },
    {
      name: 'Ben T.',
      studentId: '234567',
      grade: '5th',
      birthday: '2013-04-03',
      notes: 'Talked to counselor last week about test anxiety.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
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

      {/* Grid of student cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow p-4 space-y-2">
            <h2 className="text-xl font-semibold text-indigo-700">{student.name}</h2>
            <p className="text-sm text-gray-600">ID: {student.studentId}</p>
            <p className="text-sm text-gray-600">Grade: {student.grade}</p>
            <p className="text-sm text-gray-600">Birthday: {student.birthday}</p>
            <div className="mt-2">
              <label className="text-sm text-gray-500 block mb-1">Notes:</label>
              <textarea
                readOnly
                value={student.notes}
                className="w-full p-2 text-sm border border-gray-300 rounded bg-gray-50 resize-none"
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
